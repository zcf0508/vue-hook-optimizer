import { babelParse } from '@vue/compiler-sfc';
import _traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { processSetup } from './setupScript';
import { NodeCollection } from './utils';
const traverse: typeof _traverse =
  //@ts-ignore
  _traverse.default?.default || _traverse.default || _traverse;

export function analyze(
  content: string,
  lineOffset = 0,
) {
  // console.log({lineOffset});
  // console.log(content);
  const ast = babelParse(content, { sourceType: 'module',
    plugins: [
      'typescript',
    ],
  });

  // ---

  const nodeCollection = new NodeCollection(lineOffset);

  const graph = { 
    nodes: new Set<string>(), 
    edges: new Map<string, Set<string>>(), 
  };

  function process(node: t.ObjectExpression, path: NodePath<t.ExportDefaultDeclaration>) {
    traverse(node, {
      ObjectProperty(path1) {
        if(
          (
            path.node.declaration.type === 'ObjectExpression' 
            && path1.parent === path.node.declaration
          ) || (
            path.node.declaration.type === 'CallExpression' 
            && path1.parent === path.node.declaration.arguments[0]
          )
        ) {
          // data
          if(
            path1.node.key.type === 'Identifier' 
            && path1.node.key.name === 'data'
            && path1.node.value.type === 'ArrowFunctionExpression'
          ) {
            const dataNode = path1.node.value;
            
            traverse(dataNode, {
              ReturnStatement(path2){
                if(path2.parent == dataNode.body) {
                  if(path2.node.argument?.type === 'ObjectExpression') {
                    path2.node.argument.properties.forEach(prop => {
                      if(prop.type === 'ObjectProperty') {
                        if(prop.key.type === 'Identifier') {
                          const name = prop.key.name;
                          graph.nodes.add(name);
                          nodeCollection.addNode(name, prop);
                          if(!graph.edges.get(name)) {
                            graph.edges.set(name, new Set());
                          }
                        }
                      }
                    });
                  }
                }
              },
            }, path1.scope, path1);
          }   
          
          // computed
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'computed') {
            const computedNode = path1.node;
            if(computedNode.value.type === 'ObjectExpression') {
              computedNode.value.properties.forEach(prop => {
                if(prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod') {
                  if(prop.key.type === 'Identifier') {
                    const name = prop.key.name;
                    graph.nodes.add(name);
                    nodeCollection.addNode(name, prop, {
                      isComputed: true,
                    });
                    if(!graph.edges.get(name)) {
                      graph.edges.set(name, new Set());
                    }
                  }
                }
              });
            }
          }

          // methods
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'methods') {
            const methodsNode = path1.node;
            if(methodsNode.value.type === 'ObjectExpression') {
              methodsNode.value.properties.forEach(prop => {
                if(prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod') {
                  if(prop.key.type === 'Identifier') {
                    const name = prop.key.name;
                    graph.nodes.add(name);
                    nodeCollection.addNode(name, prop, {isMethod: true});
                    if(!graph.edges.get(name)) {
                      graph.edges.set(name, new Set());
                    }
                  }
                }
              });
            }
          }
        }
      },
      ObjectMethod(path1) {
        if(
          (
            path.node.declaration.type === 'ObjectExpression' 
            && path1.parent === path.node.declaration
          ) || (
            path.node.declaration.type === 'CallExpression' 
            && path1.parent === path.node.declaration.arguments[0]
          )
        ) {
          // setup
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'setup') {
            const setupNode = path1.node;

            const spread: string[] = [];

            traverse(setupNode, {
              ReturnStatement(path2) {
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
            }, path1.scope, path1);
            
            const {
              graph : {
                nodes: tempNodes,
                edges: tempEdges,
                spread: tempSpread,
              },
              nodeCollection: tempNodeCollection,
            } = processSetup(setupNode, path1.scope, setupNode, spread, lineOffset);
            
            // 3 filter data by return
            traverse(setupNode, {
              ReturnStatement(path2) {
                if(path2.node.argument?.type === 'ObjectExpression') {
                  const returnNode = path2.node.argument;
                  traverse(returnNode, {
                    ObjectProperty(path3) {
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
                } else {
                  console.warn('setup return type is not ObjectExpression');
                }
              },
            }, path1.scope, path1);
          }

          // data
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'data') {
            const dataNode = path1.node;
            
            traverse(dataNode, {
              ReturnStatement(path2){
                if(path2.parent == dataNode.body) {
                  if(path2.node.argument?.type === 'ObjectExpression') {
                    path2.node.argument.properties.forEach(prop => {
                      if(prop.type === 'ObjectProperty') {
                        if(prop.key.type === 'Identifier') {
                          const name = prop.key.name;
                          graph.nodes.add(name);
                          nodeCollection.addNode(name, prop);
                          if(!graph.edges.get(name)) {
                            graph.edges.set(name, new Set());
                          }
                        }
                      }
                    });
                  }
                }
              },
            }, path1.scope, path1);
          }              
        }
      },
    }, path.scope, path);
    
    traverse(node, {
      ObjectProperty(path1) {
        if(
          (
            path.node.declaration.type === 'ObjectExpression' 
            && path1.parent === path.node.declaration
          ) || (
            path.node.declaration.type === 'CallExpression' 
            && path1.parent === path.node.declaration.arguments[0]
          )
        ) {
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'computed') {
            const computedNode = path1.node;
            if(computedNode.value.type === 'ObjectExpression') {
              computedNode.value.properties.forEach(prop => {
                if(prop.type === 'ObjectMethod' && prop.key.type === 'Identifier') {
                  const name = prop.key.name;
                  traverse(prop, {
                    MemberExpression(path2) {
                      if(path2.node.object.type === 'ThisExpression' && path2.node.property.type === 'Identifier') {
                        graph.edges.get(name)?.add(path2.node.property.name);
                      }
                    },
                  }, path1.scope, path1);
                }

                if(
                  prop.type === 'ObjectProperty' 
                  && prop.key.type === 'Identifier' 
                  && prop.value.type === 'ObjectExpression'
                ) {
                  const name = prop.key.name;
                  prop.value.properties.forEach(prop1 => {
                    if(prop1.type === 'ObjectProperty' && prop1.key.type === 'Identifier' && prop1.key.name === 'get') {
                      traverse(prop1, {
                        MemberExpression(path2) {
                          if(path2.node.object.type === 'ThisExpression' && path2.node.property.type === 'Identifier') {
                            graph.edges.get(name)?.add(path2.node.property.name);
                          }
                        },
                      }, path1.scope, path1);
                    }
                  });
                }
              });
            }
            
          }
  
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'methods') {
            const methodsNode = path1.node;
            if(methodsNode.value.type === 'ObjectExpression') {
              methodsNode.value.properties.forEach(prop => {
                if((prop.type === 'ObjectMethod' || prop.type === 'ObjectProperty') && prop.key.type === 'Identifier') {
                  const name = prop.key.name;
                  traverse(prop, {
                    MemberExpression(path2) {
                      if(path2.node.object.type === 'ThisExpression' && path2.node.property.type === 'Identifier') {
                        graph.edges.get(name)?.add(path2.node.property.name);
                      }
                    },
                  }, path1.scope, path1);
                }
              });
            }
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


  return nodeCollection.map(graph);
}
