import { babelParse } from '@vue/compiler-sfc';
import _traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
const traverse: typeof _traverse =
  //@ts-ignore
  _traverse.default?.default || _traverse.default || _traverse;

export function analyze(
  content: string
) {
  // console.log(content);
  const ast = babelParse(content, { sourceType: 'module',
    plugins: [
      'typescript',
    ],
  });

  // ---

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
          // computed
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'computed') {
            const computedNode = path1.node;
            if(computedNode.value.type === 'ObjectExpression') {
              computedNode.value.properties.forEach(prop => {
                if(prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod') {
                  if(prop.key.type === 'Identifier') {
                    const name = prop.key.name;
                    graph.nodes.add(name);
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
                if(prop.type === 'ObjectMethod') {
                  if(prop.key.type === 'Identifier') {
                    const name = prop.key.name;
                    graph.nodes.add(name);
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

            const tempNodes = new Set<string>();
            const tempEdges = new Map<string, Set<string>>();

            // 1 get all the variables and functions in setup
            traverse(setupNode, {
              VariableDeclaration(path2){
                path2.node.declarations.forEach((declaration) => {
                  if(declaration.id?.type === 'Identifier') {
                    const name = declaration.id.name;
                    if(path2.parent == setupNode.body) {
                      tempNodes.add(name);
                      if(!tempEdges.get(name)) {
                        tempEdges.set(name, new Set());
                      }
                    }
                  }
                });
              },
              FunctionDeclaration(path2) {
                const name = path2.node.id?.name;
                if(name) {
                  if(path2.parent == setupNode.body) {
                    tempNodes.add(name);
                    if(!tempEdges.get(name)) {
                      tempEdges.set(name, new Set());
                    }
                  }
                }
              },
            }, path1.scope, path1);

            // 2 get the relation between the variable and the function
            traverse(setupNode, {
              FunctionDeclaration(path) {
                const name = path.node.id?.name;
                if(name && tempNodes.has(name)) {
                  path.traverse({
                    Identifier(path) {
                      if(tempNodes.has(path.node.name) && path.node.name !== name) {
                        tempEdges.get(name)?.add(path.node.name);
                      }
                    },
                  });
                }
              },
              VariableDeclarator(path) {
                if(path.node.init) {
                  if([
                    'CallExpression', 
                    'ArrowFunctionExpression', 
                    'FunctionDeclaration',
                  ].includes(path.node.init.type)
                    && path.node.id.type === 'Identifier'
                  ) {
                    const name = path.node.id?.name;
                    if(name && tempNodes.has(name)) {
                      path.traverse({
                        Identifier(path) {
                          if(tempNodes.has(path.node.name) && path.node.name !== name) {
                            tempEdges.get(name)?.add(path.node.name);
                          }
                        },
                      });
                    }
                  }
                }
              },
            }, path1.scope, path1);

            // 3 filter data by return
            traverse(setupNode, {
              ReturnStatement(path2) {
                if(path2.node.argument?.type === 'ObjectExpression') {
                  const returnNode = path2.node.argument;
                  traverse(returnNode, {
                    ObjectProperty(path3) {
                      if(path3.parent === returnNode) {
                        if(path3.node.key.type === 'Identifier') {
                          const name = path3.node.key.name;
                          const valName = path3.node.value.type === 'Identifier' ? path3.node.value.name : '';
                          if(valName && tempNodes.has(valName)) {
                            graph.nodes.add(name);
                            if(!graph.edges.get(name)) {
                              graph.edges.set(name, new Set());
                              tempEdges.get(valName)?.forEach((edge) => {
                                graph.edges.get(name)?.add(edge);
                              });
                            }
                          }
                        }
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
        console.log(graph);
      }
    },
  });


  return graph;
}
