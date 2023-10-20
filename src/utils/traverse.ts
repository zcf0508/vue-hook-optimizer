import * as t from '@babel/types';
import _traverse, { NodePath, Scope } from '@babel/traverse';
import { NodeCollection, getComment } from '../analyze/utils';

export const traverse: typeof _traverse =
  //@ts-ignore
  _traverse.default?.default || _traverse.default || _traverse;

export interface IReturnData {
  graph: {
    nodes: Set<string>;
    edges: Map<string, Set<string>>;
    spread?: Map<string, Set<string>>;
  };
  nodeCollection: NodeCollection;
  nodesUsedInTemplate: Set<string>;
}

export interface IAddNode {
  name: string,
  node: t.Node,
  path: NodePath<t.VariableDeclarator | t.FunctionDeclaration>,
  scope: Scope
}

export interface IUsedNode {
  name: string,
  path: NodePath<t.Identifier>,
  parentPath: NodePath<t.Node>,
}

export interface IAddEdge {
  fromName: string,
  toName: string,
  path: NodePath<t.Identifier | t.MemberExpression>,
  scope: Scope,
  toScope?: Scope,
  collectionNodes: Set<string>,
}

export interface IParseVariable {
  path: NodePath<t.VariableDeclarator>,
  rootScope: Scope,
}

export interface IParseNodeBase extends IParseVariable{
  cb?: (params: IAddNode) => void
}

export interface IParseEdgeBase extends IParseVariable{
  cb?: (params: IAddEdge) => void
  collectionNodes: Set<string>
  spread?: string[]
}


export interface IRescureObject {
  node: t.ObjectPattern, 
  rootScope: Scope, 
  res: t.Identifier[], 
  parentScope: Scope, 
  parentPath: NodePath<t.VariableDeclarator | t.ObjectProperty>,
}

export interface IRescureArray {
  node: t.ArrayPattern, 
  rootScope: Scope, 
  res: t.Identifier[], 
  parentScope: Scope, 
  parentPath: NodePath<t.VariableDeclarator | t.ArrayPattern>
}

export interface IParseNodeFunction {
  path: NodePath<t.FunctionDeclaration>, 
  rootScope: Scope,
  cb?: (params: IAddNode) => void
}

export interface IParseEdgeFunction {
  path: NodePath<t.FunctionDeclaration>, 
  rootScope: Scope,
  cb?: (params: IAddEdge) => void
  collectionNodes: Set<string>,
}

export interface IParseReturnJSX {
  path: NodePath<t.ReturnStatement>, 
  parentPath: NodePath<t.Node>,
  cb?: (params: IUsedNode) => void,
}

export interface IParseSetup {
  node: t.ObjectExpression,
  parentScope: Scope,
  parentPath: NodePath<t.ExportDefaultDeclaration>
}

export interface ICollectSpread {
  path: NodePath<t.ObjectMethod>,
  spread: string[]
}

export interface IAddIdentifiesToGraphByScanReturn {
  path: NodePath<t.ObjectMethod>,
  graph: IReturnData['graph'],
  nodeCollection: IReturnData['nodeCollection'],
  tempNodeCollection: IReturnData['nodeCollection'],
  tempEdges: IReturnData['graph']['edges']
}

export interface IAddSpreadToGraphByScanReturn {
  path: NodePath<t.ObjectMethod>,
  graph: IReturnData['graph'],
  nodeCollection: IReturnData['nodeCollection'],
  tempNodeCollection: IReturnData['nodeCollection'],
  tempEdges: IReturnData['graph']['edges']
  tempSpread: Map<string, Set<string>>
}

export interface IAddGraphBySpreadIdentifier {
  path: NodePath<t.VariableDeclarator>, 
  graph: IReturnData['graph'] & {
    spread: Map<string, Set<string>>;
  }, 
  nodeCollection: IReturnData['nodeCollection'], 
  iname: string
}


/**
 * 递归遍历如下结构：
 * let { loc, loc: locd, loc: { start, end }, loc: { start: { line: { deep } }} } = node;
 * 解出 loc, locd, start, end, deep
 */
export function rescureObjectPattern({ node, rootScope, res, parentScope, parentPath }: IRescureObject) {
  traverse(node, {
    ObjectProperty(path1) {
      if (path1.node.type === 'ObjectProperty' 
      && path1.node.key.type === 'Identifier' && path1.node.value.type === 'Identifier') {
        const name = path1.node.value.name;
        const _scope = path1.scope.getBinding(name)?.scope;
        if (_scope && _scope === rootScope) {
          res.push(path1.node.value);
        }
      } else if (path1.node.type === 'ObjectProperty' 
      && path1.node.key.type === 'Identifier' && path1.node.value.type === 'ObjectPattern') {
        rescureObjectPattern({
          node: path1.node.value, 
          rootScope: rootScope, 
          res, 
          parentScope: path1.scope, 
          parentPath: path1,
        });
      }
    },
    RestElement(path1) {
      if (path1.node.argument.type === 'Identifier') {
        const name = path1.node.argument.name;
        const _scope = path1.scope.getBinding(name)?.scope;
        if (_scope && _scope === rootScope) {
          res.push(path1.node.argument);
        }
      }
    },
  }, parentScope, parentPath);
}

/**
 * 递归遍历如下结构：
 * let [foo, [bar, baz]] = [1, [[2], 3]];
 * 解出 foo, bar, baz
 * @param node 
 * @param scope 
 * @param res 
 */
export function rescureArrayPattern({node, rootScope, res, parentScope, parentPath}: IRescureArray) {
  traverse(node, {
    Identifier(path1) {
      if (path1.node.type === 'Identifier') {
        const name = path1.node.name;
        const _scope = path1.scope.getBinding(name)?.scope;
        if (_scope && _scope === rootScope) {
          res.push(path1.node);
        }
      }
    },
    ArrayPattern(path1) {
      if (path1.node.type === 'ArrayPattern') {
        rescureArrayPattern({
          node: path1.node,
          rootScope,
          res,
          parentScope: path1.scope,
          parentPath: path1,
        });
      }
    },
  }, parentScope, parentPath);
}

export function parseNodeIdentifierPattern({
  path, 
  rootScope,
  cb,
}: IParseNodeBase) {
  if (path.node.id.type !== 'Identifier') return;

  if (path.node.init?.type === 'ArrowFunctionExpression' || path.node.init?.type === 'FunctionExpression') {
    // const speak = () => {}
    cb?.({
      name: path.node.id.name,
      node: path.node,
      path,
      scope: rootScope,
    });
  } else {
    // const open = 22
    cb?.({
      name: path.node.id.name,
      node: path.node,
      path,
      scope: rootScope,
    });
  }
}

export function parseNodeObjectPattern ({path, rootScope, cb}: IParseNodeBase) {
  if (path.node.id.type !== 'ObjectPattern') return;
  
  path.node.id.properties.forEach(property => {
    if (property.type === 'ObjectProperty' 
    && property.key.type === 'Identifier' && property.value.type === 'Identifier') {
      // const { x } = obj
      cb?.({
        name: property.value.name,
        node: property,
        path,
        scope: rootScope,
      });
    } else if (property.type === 'ObjectProperty' 
    && property.key.type === 'Identifier' && property.value.type === 'AssignmentPattern') {
      // const { x = 3 } = obj
      cb?.({
        name: property.key.name,
        node: property,
        path,
        scope: rootScope,
      });
    } else if (property.type === 'RestElement' && property.argument.type === 'Identifier') {
      // const { ...rest } = obj
      cb?.({
        name: property.argument.name,
        node: property,
        path,
        scope: rootScope,
      });
    } else if (property.type === 'ObjectProperty' 
    && property.key.type === 'Identifier' && property.value.type === 'ObjectPattern') {
      // let { loc, loc: locd, loc: { start, end } } = node;
      const res: t.Identifier[] = [];
      rescureObjectPattern({
        node: property.value,
        rootScope,
        res,
        parentScope: path.scope,
        parentPath: path,
      });
      res.forEach(r => cb?.({
        name: r.name,
        node: r,
        path,
        scope: rootScope,
      }));
    }     
  });
  
}

export function parseNodeArrayPattern({path, rootScope, cb}: IParseNodeBase) {
  if (path.node.id.type !== 'ArrayPattern') return;

  path.node.id.elements.forEach(ele => {
    if (ele?.type === 'Identifier') {
      // const [arr, brr] = array
      cb?.({
        name: ele.name,
        node: ele,
        path,
        scope: rootScope,
      });
    } else if (ele?.type === 'ArrayPattern') {
      // let [foo, [bar, baz]] = array;
      const res: t.Identifier[] = [];
      rescureArrayPattern({
        node: ele,
        rootScope,
        res,
        parentScope: path.scope,
        parentPath: path,
      });
      res.forEach(r => cb?.({
        name: r.name,
        node: r,
        path,
        scope: rootScope,
      }));

    } else if (ele?.type === 'AssignmentPattern') {
      if (ele.left.type === 'Identifier') {
        // let [yy = 'b'] = array;
        cb?.({
          name: ele.left.name,
          node: ele,
          path,
          scope: rootScope,
        });
      }
    } else if (ele?.type === 'RestElement') {
      if (ele.argument.type === 'Identifier') {
        // const [arr2, ...rest2] = array
        cb?.({
          name: ele.argument.name,
          node: ele,
          path,
          scope: rootScope,
        });
      }
    }
  });
}

export function parseNodeFunctionPattern({path, rootScope, cb}: IParseNodeFunction) {
  if (path.node.type !== 'FunctionDeclaration') return;
  if (path.node.id?.type === 'Identifier') {
    // function abc () {}
    cb?.({
      name: path.node.id.name,
      node: path.node,
      path,
      scope: rootScope,
    });
  }
}

export function parseEdgeLeftIdentifierPattern({path, rootScope, cb, collectionNodes, spread}: IParseEdgeBase) {
  if (!path.node.id || path.node.id.type !== 'Identifier') return;

  if (path.node.init?.type && 
    [
      'ArrowFunctionExpression', 
      'FunctionExpression', 
      'CallExpression', 
      'ObjectExpression',
      'ArrayExpression',
    ].includes(path.node.init.type)
  ) {
    // if (graph.nodes.has(path.node.id.name) && path.scope.getBinding(path.node.id.name)?.scope === rootScope) {
    if (collectionNodes.has(path.node.id.name) && path.scope.getBinding(path.node.id.name)?.scope === rootScope) {
      const name = path.node.id.name;
      traverse(path.node.init, {
        Identifier(path1) {
          // graph.edges.get(name)?.add(path1.node.name);

          const binding = path1.scope.getBinding(path1.node.name);
          if(
            binding?.scope === rootScope 
            && collectionNodes.has(path1.node.name) 
            && (
              path1.parent.type !== 'MemberExpression'
              || path1.parent.object === path1.node
            )
          ) {
            cb?.({
              fromName: name,
              toName: path1.node.name,
              path: path1,
              scope: rootScope,
              collectionNodes,
            });
          }
        },
        MemberExpression(path1) {
          if (spread?.length && path1.node.object.type === 'Identifier' 
            && spread.includes(path1.node.object.name)
            && path1.node.property.type === 'Identifier') {
            cb?.({
              fromName: name,
              toName: path1.node.property.name,
              toScope: path1.scope.getBinding(path1.node.object.name)?.scope,
              path: path1,
              scope: rootScope,
              collectionNodes,
            });
          }
        },
      }, path.scope, path);
    }
  }
}

export function parseEdgeLeftObjectPattern({path, rootScope, cb, collectionNodes} : IParseEdgeBase) {
  if (!path.node.id || path.node.id.type !== 'ObjectPattern') return;
  if (path.node.init?.type && 
    [
      'ArrowFunctionExpression', 
      'FunctionExpression', 
      'CallExpression',
      'ObjectExpression',
      'ArrayExpression',
    ].includes(path.node.init.type)
  ) {
    const res: t.Identifier[] = [];
    rescureObjectPattern({
      node: path.node.id, 
      rootScope, 
      res, 
      parentScope: path.scope, 
      parentPath: path,
    });

    // res.filter(r => (graph.nodes.has(r.name) && path.scope.getBinding(r.name)?.scope === rootScope));
    res.filter(r => (collectionNodes.has(r.name) && path.scope.getBinding(r.name)?.scope === rootScope));
    
    traverse(path.node.init, {
      Identifier(path1) {
        const binding = path1.scope.getBinding(path1.node.name);
        if(
          binding?.scope === rootScope 
          && collectionNodes.has(path1.node.name)
          && (
            path1.parent.type !== 'MemberExpression'
            || path1.parent.object === path1.node
          )
        ) {
          res.forEach(r => {
            cb?.({
              fromName: r.name,
              toName: path1.node.name,
              path: path1,
              scope: rootScope,
              collectionNodes,
            });
          });
        }
      },
    }, path.scope, path);
  }
}

export function parseEdgeLeftArrayPattern({path, rootScope, cb, collectionNodes} : IParseEdgeBase) {
  if (!path.node.id || path.node.id.type !== 'ArrayPattern') return;
  if (path.node.init?.type && 
    [
      'ArrowFunctionExpression', 
      'FunctionExpression', 
      'CallExpression',
      'ObjectExpression',
      'ArrayExpression',
    ].includes(path.node.init.type)
  ) {
    const res: t.Identifier[] = [];
    rescureArrayPattern({
      node: path.node.id, 
      rootScope, 
      res, 
      parentScope: path.scope, 
      parentPath: path,
    });

    res.filter(r => (collectionNodes.has(r.name) && path.scope.getBinding(r.name)?.scope === rootScope));

    traverse(path.node.init, {
      Identifier(path1) {
        const binding = path1.scope.getBinding(path1.node.name);
        if(
          binding?.scope === rootScope 
          && collectionNodes.has(path1.node.name)
          && (
            path1.parent.type !== 'MemberExpression'
            || path1.parent.object === path1.node
          )
        ) {
          res.forEach(r => {
            cb?.({
              fromName: r.name,
              toName: path1.node.name,
              path: path1,
              scope: rootScope,
              collectionNodes,
            });
          });
        }
      },
    }, path.scope, path);
  }
}

export function parseEdgeFunctionPattern({path, rootScope, cb, collectionNodes}: IParseEdgeFunction) {
  if (!path.node.id) return;
  if (collectionNodes.has(path.node.id.name) && path.scope.getBinding(path.node.id.name)?.scope === rootScope) {
    const name = path.node.id.name;
    traverse(path.node.body, {
      Identifier(path1) {
        const binding = path1.scope.getBinding(path1.node.name);
        if(binding?.scope === rootScope && collectionNodes.has(path1.node.name)) {
          cb?.({
            fromName: name,
            toName: path1.node.name,
            path: path1,
            scope: rootScope,
            collectionNodes,
          });
        }
      },
    }, path.scope, path);
  }
}

export function parseReturnJsxPattern({path, parentPath, cb}: IParseReturnJSX) {
  if (
    path.node.argument 
    && (
      // return () => (<div></div>)
      //return function() (<div></div>)
      (
        (
          path.node.argument.type === 'ArrowFunctionExpression'
          || path.node.argument.type === 'FunctionExpression'
        ) && (
          path.node.argument.body.type === 'JSXElement' 
          || path.node.argument.body.type === 'JSXFragment'
        )
      )
      // return (<div></div>)
      || (
        path.node.argument.type === 'JSXElement'
        || path.node.argument.type === 'JSXFragment'
      )
    )
  ) { 
    path.traverse({
      Identifier(path1) {
        // if (path1.scope.getBinding(path1.node.name)?.scope === parentPath.scope) {
        //   nodesUsedInTemplate.add(path1.node.name);
        // }
        cb?.({
          name: path1.node.name,
          path: path1,
          parentPath,
        });
      },
    });
  }
}


export function traverseSetup ({node, parentScope, parentPath}: IParseSetup) {
  let path: NodePath<t.ObjectMethod>;

  traverse(node, {
    ObjectMethod(path1) {
      if (
        (
          parentPath.node.declaration.type === 'ObjectExpression' 
              && path1.parent === parentPath.node.declaration
        ) || (
          parentPath.node.declaration.type === 'CallExpression' 
              && path1.parent === parentPath.node.declaration.arguments[0]
        )
      ) {
        if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'setup') {
          path = path1;
        }
      }
    },
  }, parentScope, parentPath);

  return path!;
}

export function collectionSpread ({path: path1, spread}: ICollectSpread) {
  path1.traverse({
    ReturnStatement(path2) {
      // get setup return obj spread
      if(path2.node.argument?.type === 'ObjectExpression') {
        const returnNode = path2.node.argument;
        traverse(returnNode, {
          SpreadElement(path3) {
            // ...toRefs(xxx)
            if(
              path3.node.argument.type === 'CallExpression' 
              && path3.node.argument.callee.type === 'Identifier' 
              && path3.node.argument.callee.name === 'toRefs'
              && path3.node.argument.arguments[0].type === 'Identifier'
            ) {
              spread.push(path3.node.argument.arguments[0].name);
            }
            // ...xxx
            else if(
              path3.node.argument.type === 'Identifier' 
            ) {
              spread.push(path3.node.argument.name);
            }
          },
        }, path2.scope, path2);
      }
    },
  });
}

export function addIdentifiesToGraphByScanReturn (
  {path: path1, graph, nodeCollection, tempNodeCollection, tempEdges}: IAddIdentifiesToGraphByScanReturn
) {
  path1.traverse({
    ReturnStatement(path2) {
      // get setup return obj spread
      if(path2.node.argument?.type === 'ObjectExpression') {
        const returnNode = path2.node.argument;
        traverse(returnNode, {
          ObjectProperty(path3) {
            // not spread node
            if(path3.parent === returnNode) {
              if(path3.node.key.type === 'Identifier' && path3.node.value.type === 'Identifier') {
                const valName = path3.node.value.name;
                if(!graph.nodes.has(valName)) {
                  graph.nodes.add(valName);
                  nodeCollection.addTypedNode(
                    valName, 
                    tempNodeCollection.nodes.get(valName)!
                  );
                }
                if(!graph.edges.has(valName)) {
                  graph.edges.set(valName, new Set([...Array.from(
                    tempEdges.get(valName) || new Set<string>()
                  )]));
                }

                const name = path3.node.key.name;
                if(name !== valName) {
                  graph.nodes.add(name);
                  nodeCollection.addNode(name, path3.node.key, {
                    comment: getComment(path3.node),
                  });
                  graph.edges.set(name, new Set([valName]));
                }
              }
            }
          },
        }, path2.scope, path2);
      }
    },
  });
} 

export function addSpreadToGraphByScanReturn (
  {path: path1, graph, nodeCollection, tempNodeCollection, tempEdges, tempSpread}
  : IAddSpreadToGraphByScanReturn
) {
  path1.traverse({
    ReturnStatement(path2) {
      // get setup return obj spread
      if(path2.node.argument?.type === 'ObjectExpression') {
        const returnNode = path2.node.argument;
        traverse(returnNode, {
          SpreadElement(path3) {
            // ...toRefs(xxx)
            if(
              path3.node.argument.type === 'CallExpression' 
              && path3.node.argument.callee.type === 'Identifier' 
              && path3.node.argument.callee.name === 'toRefs'
              && path3.node.argument.arguments[0].type === 'Identifier'
              && tempSpread.get(path3.node.argument.arguments[0].name)
            ) {
              tempSpread.get(path3.node.argument.arguments[0].name)?.forEach((name) => {
                graph.nodes.add(name);
                nodeCollection.addTypedNode(name, tempNodeCollection.nodes.get(name)!);
                if(!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                  tempEdges.get(name)?.forEach((edge) => {
                    graph.edges.get(name)?.add(edge);
                  });
                }
              });
            }
            // ...xxx
            else if(
              path3.node.argument.type === 'Identifier' 
              && tempSpread.get(path3.node.argument.name)
            ) {
              tempSpread.get(path3.node.argument.name)?.forEach((name) => {
                graph.nodes.add(name);
                nodeCollection.addTypedNode(name, tempNodeCollection.nodes.get(name)!);
                if(!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                  tempEdges.get(name)?.forEach((edge) => {
                    graph.edges.get(name)?.add(edge);
                  });
                }
              });
            }
          },
        }, path2.scope, path2);
      }
    },
  });
} 

export function addGraphBySpreadIdentifier ({path: path1, graph, nodeCollection, iname }: IAddGraphBySpreadIdentifier) {
  if(path1.node.init?.type === 'ObjectExpression') {
    path1.node.init?.properties.forEach(prop => {
      if(
        (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod')
        && prop.key.type === 'Identifier'
      ) {
        const keyName = prop.key.name;
        graph.nodes.add(keyName);
        nodeCollection.addNode(keyName, prop, {
          comment: getComment(prop),
        });
        if(!graph.edges.get(keyName)) {
          graph.edges.set(keyName, new Set());
        }
        if(graph.spread.has(iname)) {
          graph.spread.get(iname)?.add(keyName);
        } else {
          graph.spread.set(iname, new Set([keyName]));
        }
      } else if(prop.type === 'SpreadElement') {
        console.warn('not support spread in spread');
      }
    });
  }

  if(
    path1.node.init?.type === 'CallExpression'
    && path1.node.init?.callee.type === 'Identifier'
    && path1.node.init?.callee.name === 'reactive'
  ) {
    const arg = path1.node.init?.arguments[0];
    if(arg.type === 'ObjectExpression') {
      arg.properties.forEach(prop => {
        if(
          (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod')
          && prop.key.type === 'Identifier'
        ) {
          const keyName = prop.key.name;
          graph.nodes.add(keyName);
          nodeCollection.addNode(keyName, prop, {
            comment: getComment(prop),
          });
          if(!graph.edges.get(keyName)) {
            graph.edges.set(keyName, new Set());
          }
          if(graph.spread.has(iname)) {
            graph.spread.get(iname)?.add(keyName);
          } else {
            graph.spread.set(iname, new Set([keyName]));
          }
        } else if(prop.type === 'SpreadElement') {
          console.warn('not support spread in spread');
        }
      });
    }
  }
}
