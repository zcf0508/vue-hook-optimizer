import { transformAsync } from '@babel/core';
import _traverse, { Binding, NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import { NodeCollection, NodeType } from './utils';

const traverse: typeof _traverse =
  //@ts-ignore
  _traverse.default?.default || _traverse.default || _traverse;

/**
 * 递归遍历如下结构：
 * let { loc, loc: locd, loc: { start, end }, loc: { start: { line: { deep } }} } = node;
 * 解出 loc, locd, start, end, deep
 * @param node 
 * @param scope 
 * @param res 
 */
function rescureObjectPattern(node: t.ObjectPattern, rootScope: Scope, res: t.Identifier[], 
  parentScope: Scope, parentPath: NodePath<t.VariableDeclarator | t.ObjectProperty>) {
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
        rescureObjectPattern(path1.node.value, rootScope, res, path1.scope, path1);
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
function rescureArrayPattern(node: t.ArrayPattern, rootScope: Scope, res: t.Identifier[], 
  parentScope: Scope, parentPath: NodePath<t.VariableDeclarator | t.ArrayPattern>) {
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
        rescureArrayPattern(path1.node, rootScope, res, path1.scope, path1);
      }
    },
  }, parentScope, parentPath);
}

export function processTsx(ast: t.Node, parentScope?: Scope, parentPath?: t.Node, _spread?: string[]) {
  const spread = _spread || [];
  
  const nodeCollection = new NodeCollection();

  const nodesUsedInTemplate = new Set<string>();

  const graph = { 
    nodes: new Set<string>(), 
    edges: new Map<string, Set<string>>(), 
    spread: new Map<string, Set<string>>(),
  };

  function addNode (name: string, node: t.Node, 
    path: NodePath<t.VariableDeclarator | t.FunctionDeclaration>, scope: Scope
  ) {
    const binding = path.scope.getBinding(name);
    if (scope === binding?.scope) {
      graph.nodes.add(name);
      nodeCollection.addNode(name, node);
      if(!graph.edges.get(name)) {
        graph.edges.set(name, new Set());
      }
    }
  }

  function parseNodeIdentifierPattern(path: NodePath<t.VariableDeclarator>, rootScope: Scope) {
    if (path.node.id.type !== 'Identifier') return;

    if (path.node.init?.type === 'ArrowFunctionExpression' || path.node.init?.type === 'FunctionExpression') {
      // const speak = () => {}
      addNode(path.node.id.name, path.node, path, rootScope);
    } else {
      // const open = 22
      addNode(path.node.id.name, path.node, path, rootScope);
    }
    
  }

  function parseNodeObjectPattern (path: NodePath<t.VariableDeclarator>, rootScope: Scope) {
    if (path.node.id.type !== 'ObjectPattern') return;
    
    path.node.id.properties.forEach(property => {
      if (property.type === 'ObjectProperty' 
      && property.key.type === 'Identifier' && property.value.type === 'Identifier') {
        // const { x } = obj
        addNode(property.value.name, property, path, rootScope);
      } else if (property.type === 'ObjectProperty' 
      && property.key.type === 'Identifier' && property.value.type === 'AssignmentPattern') {
        // const { x = 3 } = obj
        addNode(property.key.name, property, path, rootScope);
      } else if (property.type === 'RestElement' && property.argument.type === 'Identifier') {
        // const { ...rest } = obj
        addNode(property.argument.name, property, path, rootScope);
      } else if (property.type === 'ObjectProperty' 
      && property.key.type === 'Identifier' && property.value.type === 'ObjectPattern') {
        // let { loc, loc: locd, loc: { start, end } } = node;
        const res: t.Identifier[] = [];
        rescureObjectPattern(property.value, rootScope, res, path.scope, path);
        res.forEach(r => addNode(r.name, r, path, rootScope));
      }     
    });
    
  }

  function parseNodeArrayPattern(path: NodePath<t.VariableDeclarator>, rootScope: Scope) {
    if (path.node.id.type !== 'ArrayPattern') return;

    path.node.id.elements.forEach(ele => {
      if (ele?.type === 'Identifier') {
        // const [arr, brr] = array
        addNode(ele.name, ele, path, rootScope);
      } else if (ele?.type === 'ArrayPattern') {
        // let [foo, [bar, baz]] = array;
        const res: t.Identifier[] = [];
        rescureArrayPattern(ele, rootScope, res, path.scope, path);
        res.forEach(r => addNode(r.name, r, path, rootScope));
      } else if (ele?.type === 'AssignmentPattern') {
        if (ele.left.type === 'Identifier') {
          // let [yy = 'b'] = array;
          addNode(ele.left.name, ele, path, rootScope);
        }
      } else if (ele?.type === 'RestElement') {
        if (ele.argument.type === 'Identifier') {
          // const [arr2, ...rest2] = array
          addNode(ele.argument.name, ele, path, rootScope);
        }
      }
    });
  }

  function parseNodeFunctionPattern(path: NodePath<t.FunctionDeclaration>, rootScope: Scope) {
    if (path.node.type !== 'FunctionDeclaration') return;
    if (path.node.id?.type === 'Identifier') {
      // function abc () {}
      addNode(path.node.id.name, path.node, path, rootScope);
    }
  }

  function parseEdgeFunctionPattern(path: NodePath<t.FunctionDeclaration>, rootScope: Scope) {
    if (!path.node.id) return;
    if (graph.nodes.has(path.node.id.name) && path.scope.getBinding(path.node.id.name)?.scope === rootScope) {
      const name = path.node.id.name;
      traverse(path.node.body, {
        Identifier(path1) {
          const binding = path1.scope.getBinding(path1.node.name);
          if (binding?.scope === rootScope && graph.nodes.has(path1.node.name)) {
            graph.edges.get(name)?.add(path1.node.name);
          }
        },
      }, path.scope, path);
    }
  }

  function parseEdgeIdentifierPattern(path: NodePath<t.VariableDeclarator>, rootScope: Scope) {
    if (!path.node.id || path.node.id.type !== 'Identifier') return;
    if (path.node.init?.type && 
      ['ArrowFunctionExpression', 'FunctionExpression', 'CallExpression'].includes(path.node.init.type)
    ) {
      if (graph.nodes.has(path.node.id.name) && path.scope.getBinding(path.node.id.name)?.scope === rootScope) {
        const name = path.node.id.name;
        traverse(path.node.init, {
          Identifier(path1) {
            const binding = path1.scope.getBinding(path1.node.name);
            if (binding?.scope === rootScope && graph.nodes.has(path1.node.name)) {
              graph.edges.get(name)?.add(path1.node.name);
            }
          },
        }, path.scope, path);
      }
    }
  }

  function parseEdgeObjectPattern(path: NodePath<t.VariableDeclarator>, rootScope: Scope) {
    if (!path.node.id || path.node.id.type !== 'ObjectPattern') return;
    if (path.node.init?.type && 
      ['ArrowFunctionExpression', 'FunctionExpression', 'CallExpression'].includes(path.node.init.type)
    ) {
      const res: t.Identifier[] = [];
      rescureObjectPattern(path.node.id, rootScope, res, path.scope, path);

      res.filter(r => (graph.nodes.has(r.name) && path.scope.getBinding(r.name)?.scope === rootScope));

      traverse(path.node.init, {
        Identifier(path1) {
          const binding = path1.scope.getBinding(path1.node.name);
          if (binding?.scope === rootScope && graph.nodes.has(path1.node.name)) {
            res.forEach(r => {
              graph.edges.get(r.name)?.add(path1.node.name);
            });
          }
        },
      }, path.scope, path);
    }
  }

  function parseEdgeArrayPattern(path: NodePath<t.VariableDeclarator>, rootScope: Scope) {
    if (!path.node.id || path.node.id.type !== 'ArrayPattern') return;
    if (path.node.init?.type && 
      ['ArrowFunctionExpression', 'FunctionExpression', 'CallExpression'].includes(path.node.init.type)
    ) {
      const res: t.Identifier[] = [];
      rescureArrayPattern(path.node.id, rootScope, res, path.scope, path);

      res.filter(r => (graph.nodes.has(r.name) && path.scope.getBinding(r.name)?.scope === rootScope));

      traverse(path.node.init, {
        Identifier(path1) {
          const binding = path1.scope.getBinding(path1.node.name);
          if (binding?.scope === rootScope && graph.nodes.has(path1.node.name)) {
            res.forEach(r => {
              graph.edges.get(r.name)?.add(path1.node.name);
            });
          }
        },
      }, path.scope, path);
    }
  }

  function process(node: t.ObjectExpression, path: NodePath<t.ExportDefaultDeclaration>) {
    // 收集节点
    traverse(node, {
      ObjectMethod(path1) {
        if (
          (
            path.node.declaration.type === 'ObjectExpression' 
            && path1.parent === path.node.declaration
          ) || (
            path.node.declaration.type === 'CallExpression' 
            && path1.parent === path.node.declaration.arguments[0]
          )
        ) {
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'setup') {
            // setup
            const setupScope = path1.scope;
            traverse(path1.node, {
              VariableDeclarator(path1) {
                parseNodeIdentifierPattern(path1, setupScope);
                parseNodeObjectPattern(path1, setupScope);
                parseNodeArrayPattern(path1, setupScope);
              },
              FunctionDeclaration(path1) {
                parseNodeFunctionPattern(path1, setupScope);
              },
            }, setupScope, path1);

            // setup return jsx
            path1.traverse({
              ReturnStatement(path2) {
                if (path2.node.argument 
                  && (path2.node.argument.type === 'ArrowFunctionExpression'
                  || path2.node.argument.type === 'FunctionExpression')
                  && (path2.node.argument.body.type === 'JSXElement' 
                  || path2.node.argument.body.type === 'JSXFragment')
                ) { 
                  path2.traverse({
                    Identifier(path3) {
                      if (path3.scope.getBinding(path3.node.name)?.scope === path1.scope) {
                        nodesUsedInTemplate.add(path3.node.name);
                      }
                    },
                  });
                }
              },
            });
          }
        }
      },
    }, path.scope, path);

    // 收集边
    traverse(node, {
      ObjectMethod(path1) {
        if (
          (path.node.declaration.type === 'ObjectExpression' && path1.parent === path.node.declaration)
          || 
          (path.node.declaration.type === 'CallExpression' && path1.parent === path.node.declaration.arguments[0])
        ) {
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'setup') {
            // setup
            const setupScope = path1.scope;
            traverse(path1.node, {
              VariableDeclarator(path1) {
                parseEdgeIdentifierPattern(path1, setupScope);
                parseEdgeObjectPattern(path1, setupScope);
                parseEdgeArrayPattern(path1, setupScope);
              },
              FunctionDeclaration(path1) {
                parseEdgeFunctionPattern(path1, setupScope);
              },
            }, setupScope, path1);
          }
        } 
      },
    }, path.scope, path);
    
  }
  
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      // export default {}
      if(path.node.declaration.type === 'ObjectExpression') {
        process(path.node.declaration, path);
      }
      // export default defineComponent({})
      else if(path.node.declaration.type === 'CallExpression' 
        && path.node.declaration.callee.type === 'Identifier'
        && path.node.declaration.callee.name === 'defineComponent'
        && path.node.declaration.arguments[0].type === 'ObjectExpression'
      ) {
        process(path.node.declaration.arguments[0], path);
      }
    },
  });
  


  return {
    graph,
    nodeCollection,
    nodesUsedInTemplate,
  };
}

export async function analyze(
  content: string
) {

  // console.log(content);
  const res = await transformAsync(content, {
    babelrc: false,
    ast: true,
    sourceMaps: false,
    configFile: false,
    plugins: [
      [
        '@babel/plugin-transform-typescript',
        {
          isTSX: true, 
          allowExtensions: true,
        },
      ],
    ],
  });

  if (res && res.ast) {
    const { graph, nodeCollection, nodesUsedInTemplate } = processTsx(res.ast);
    // ---
    return {
      graph: nodeCollection.map(graph),
      nodesUsedInTemplate,
    };
  }

  throw new Error('transpile error: can\'t find ast');
}
