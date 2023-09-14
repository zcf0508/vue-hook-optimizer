import { transformAsync } from '@babel/core';
import _traverse, { NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import { NodeCollection } from './utils';
// @ts-ignore
import bts from '@babel/plugin-transform-typescript';
import { 
  traverse, 
  IAddNode,
  IAddEdge, 
  parseNodeIdentifierPattern, 
  parseNodeObjectPattern,
  parseNodeArrayPattern,
  parseNodeFunctionPattern,
  parseEdgeLeftIdentifierPattern,
  parseEdgeLeftObjectPattern,
  parseEdgeLeftArrayPattern,
  parseEdgeFunctionPattern,
  parseReturnJsxPattern,
  IUsedNode,
} from '../utils/traverse';

interface IProcessMain {
  node: t.Node, 
  lineOffset?: number, 
  addInfo?: boolean, 
  parentScope?: Scope, 
  parentNode?: t.Node,
  parentPath?: NodePath<t.Node>
  spread?: string[]
}

interface IProcessBranch {
  node: t.ObjectExpression, 
  lineOffset?: number, 
  addInfo?: boolean, 
  parentScope?: Scope, 
  parentNode?: t.ExportDefaultDeclaration,
  parentPath: NodePath<t.ExportDefaultDeclaration>
  spread?: string[]
}

interface IReturnData {
  graph: {
    nodes: Set<string>;
    edges: Map<string, Set<string>>;
    spread?: Map<string, Set<string>>;
  };
  nodeCollection: NodeCollection;
  nodesUsedInTemplate: Set<string>;
}

export function processTsx(params : IProcessMain) {

  let result: IReturnData | undefined;


  function processByReturnNotJSX(params: IProcessBranch) {
    const {node, parentPath, lineOffset, addInfo} = params;
    const spread: string[] = [];

    const nodeCollection = new NodeCollection(lineOffset, addInfo);

    const graph = { 
      nodes: new Set<string>(), 
      edges: new Map<string, Set<string>>(), 
    };

    // 解析return, 收集spread
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
            // setup return
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
        }
      },
    }, parentPath.scope, parentPath);

    const {
      graph : {
        nodes: tempNodes,
        edges: tempEdges,
        spread: tempSpread,
      },
      nodeCollection: tempNodeCollection,
      nodesUsedInTemplate,
    } = processByReturnJSX({ node, parentPath, spread, lineOffset, addInfo });

    // 处理合并节点
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
            // setup return
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
                            nodeCollection.addNode(name, path3.node.key);
                            graph.edges.set(name, new Set([valName]));
                          }
                        }
                      }
                    },
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
        }
      },
    }, parentPath.scope, parentPath);

    return {
      graph,
      nodeCollection,
      nodesUsedInTemplate,
    };
  }

  function processByReturnJSX(params: IProcessBranch) {
    const {node, parentPath, spread = [], lineOffset, addInfo } = params;

    const nodeCollection = new NodeCollection(lineOffset, addInfo);
    const nodesUsedInTemplate = new Set<string>();

    const graph = { 
      nodes: new Set<string>(), 
      edges: new Map<string, Set<string>>(),
      spread: new Map<string, Set<string>>(),
    };

    function addNode ({ name, node, path, scope}: IAddNode) {
      const binding = path.scope.getBinding(name);
      if (scope === binding?.scope) {
        graph.nodes.add(name);
        nodeCollection.addNode(name, node);
        if(!graph.edges.get(name)) {
          graph.edges.set(name, new Set());
        }
      }
    }

    function addEdge ({ fromName, toName, path, scope, toScope, collectionNodes }: IAddEdge) {
      const bindingScope = toScope || path.scope.getBinding(toName)?.scope;
      if (scope === bindingScope && collectionNodes.has(toName)) {
        graph.edges.get(fromName)?.add(toName);
      }
    }

    function addUsed ({name, path, parentPath} : IUsedNode) {
      const binding = path.scope.getBinding(name);
      if (binding?.scope === parentPath.scope) {
        nodesUsedInTemplate.add(name);
      }
    }

    // 收集节点, 并收集spread依赖
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
            // setup
            const setupScope = path1.scope;
            traverse(path1.node, {
              VariableDeclarator(path1) {
                parseNodeIdentifierPattern({
                  path: path1, 
                  rootScope: setupScope,
                  cb: (params) => {
                    if (!spread.includes(params.name)) {
                      addNode(params);
                    } else {
                      if(path1.node.init?.type === 'ObjectExpression') {
                        path1.node.init?.properties.forEach(prop => {
                          if(
                            (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod')
                            && prop.key.type === 'Identifier'
                          ) {
                            const keyName = prop.key.name;
                            graph.nodes.add(keyName);
                            nodeCollection.addNode(keyName, prop);
                            if(!graph.edges.get(keyName)) {
                              graph.edges.set(keyName, new Set());
                            }
                            if(graph.spread.has(params.name)) {
                              graph.spread.get(params.name)?.add(keyName);
                            } else {
                              graph.spread.set(params.name, new Set([keyName]));
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
                              nodeCollection.addNode(keyName, prop);
                              if(!graph.edges.get(keyName)) {
                                graph.edges.set(keyName, new Set());
                              }
                              if(graph.spread.has(params.name)) {
                                graph.spread.get(params.name)?.add(keyName);
                              } else {
                                graph.spread.set(params.name, new Set([keyName]));
                              }
                            } else if(prop.type === 'SpreadElement') {
                              console.warn('not support spread in spread');
                            }
                          });
                        }
                      }
                    }
                  },
                });

                parseNodeObjectPattern({
                  path: path1,
                  rootScope: setupScope,
                  cb: addNode,
                });

                parseNodeArrayPattern({
                  path: path1,
                  rootScope: setupScope,
                  cb: addNode,
                });
              },
              FunctionDeclaration(path1) {
                parseNodeFunctionPattern({
                  path: path1,
                  rootScope: setupScope,
                  cb: addNode,
                });
              },
            }, setupScope, path1);

            // setup return
            path1.traverse({
              ReturnStatement(path2) {
                // setup return jsx
                parseReturnJsxPattern({
                  path: path2,
                  parentPath: path1,
                  cb: addUsed,
                });
              },
            });
          }
        }
      },
    }, parentPath.scope, parentPath);

    // 收集边
    traverse(node, {
      ObjectMethod(path1) {
        if (
          (parentPath.node.declaration.type === 'ObjectExpression' && path1.parent === parentPath.node.declaration)
          || 
          (parentPath.node.declaration.type === 'CallExpression' 
          && path1.parent === parentPath.node.declaration.arguments[0])
        ) {
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'setup') {
            // setup
            const setupScope = path1.scope;
            traverse(path1.node, {
              VariableDeclarator(path1) {
                parseEdgeLeftIdentifierPattern({
                  path: path1,
                  rootScope: setupScope,
                  collectionNodes: graph.nodes,
                  cb: addEdge,
                  spread,
                });
                
                parseEdgeLeftObjectPattern({
                  path: path1,
                  rootScope: setupScope,
                  collectionNodes: graph.nodes,
                  cb: addEdge,
                });

                parseEdgeLeftArrayPattern({
                  path: path1,
                  rootScope: setupScope,
                  collectionNodes: graph.nodes,
                  cb: addEdge,
                });
              },
              FunctionDeclaration(path1) {
                parseEdgeFunctionPattern({
                  path: path1,
                  rootScope: setupScope,
                  collectionNodes: graph.nodes,
                  cb: addEdge,
                });
              },
            }, setupScope, path1);
          }
        } 
      },
    }, parentPath.scope, parentPath);

    return {
      graph,
      nodeCollection,
      nodesUsedInTemplate,
    };
    
  }

  function process(params: IProcessBranch) {
    const { node, parentPath } = params;
    // 解析return, 收集spread
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
            // setup return
            path1.traverse({
              ReturnStatement(path2) {
                if (path2.node.argument 
                  && (path2.node.argument.type === 'ArrowFunctionExpression'
                  || path2.node.argument.type === 'FunctionExpression')
                  && (path2.node.argument.body.type === 'JSXElement' 
                  || path2.node.argument.body.type === 'JSXFragment')
                ) { 
                  result = processByReturnJSX(params);
                } else {
                  result = processByReturnNotJSX(params);
                }
              },
            });
          }
        }
      },
    }, parentPath.scope, parentPath);

  }
  
  traverse(params.node, {
    ExportDefaultDeclaration(path) {
      if(path.node.declaration.type === 'ObjectExpression') {
        // export default {}
        process({
          ...params,
          node: path.node.declaration, 
          parentNode: path.node,
          parentPath: path,
        });
      } else if(
        path.node.declaration.type === 'CallExpression' 
        && path.node.declaration.callee.type === 'Identifier'
        && path.node.declaration.callee.name === 'defineComponent'
        && path.node.declaration.arguments[0].type === 'ObjectExpression'
      ) {
        // export default defineComponent({})
        process({
          ...params,
          node: path.node.declaration.arguments[0], 
          parentNode: path.node,
          parentPath: path,
        });
      }
    },
  });
  

  return result!;
}


export async function analyze(
  content: string,
  lineOffset = 0,
  addInfo = true,
) {

  // console.log(content);
  const res = await transformAsync(content, {
    babelrc: false,
    ast: true,
    sourceMaps: false,
    configFile: false,
    plugins: [
      [
        bts,
        {
          isTSX: true, 
          allowExtensions: true,
        },
      ],
    ],
  });

  if (res && res.ast) {
    const { graph, nodeCollection, nodesUsedInTemplate } = processTsx({
      node: res.ast,
      lineOffset,
      addInfo,
    });
    // ---
    return {
      graph: nodeCollection.map(graph),
      nodesUsedInTemplate,
    };
  }

  throw new Error('transpile error: can\'t find ast');
}
