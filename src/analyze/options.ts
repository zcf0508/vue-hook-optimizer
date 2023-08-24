import { babelParse } from '@vue/compiler-sfc';
import _traverse from '@babel/traverse';
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

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      // export default {}
      if(path.node.declaration.type === 'ObjectExpression') {
        path.node.declaration.properties.forEach(prop => {
          if(prop.type === 'ObjectProperty'
            && prop.key.type === 'Identifier'
            && prop.key.name === 'props'
            && prop.value.type === 'ObjectExpression'
          ) {
            const propsNodes = prop.value.properties;
            propsNodes.forEach(propNode => {
              // @ts-ignore
              const name = propNode.key.name;
              if(name && !graph.nodes.has(name)) {
                graph.nodes.add(name);
                if(!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            });
          }

          if(prop.type === 'ObjectMethod'
            && prop.key.type === 'Identifier'
            && prop.key.name === 'setup'
          ) {

            const setupNode = prop.body.body;
            
            const declarNodes = new Set<string>();
            const declarEdges = new Map<string, Set<string>>();

            setupNode.forEach(item => {
              if(item.type !== 'ReturnStatement') {
                if(item.type === 'VariableDeclaration') {
                  item.declarations.forEach(declar => {

                    if(declar.type === 'VariableDeclarator'
                      && declar.id.type === 'Identifier'
                    ) {
                      const name = declar.id.name;
                      if(name && !declarNodes.has(name)) {
                        declarNodes.add(name);
                        declarEdges.set(name, new Set());
                      }
                    }
                  });
                }
                if(item.type === 'FunctionDeclaration') {
                  if(item.id?.type === 'Identifier') {
                    const name = item.id.name;
                    if(name && !declarNodes.has(name)) {
                      declarNodes.add(name);
                      declarEdges.set(name, new Set());
                    }
                  }
                }
                
              }
              // if(item.type === 'ReturnStatement'
              //   && item.argument?.type === 'ObjectExpression'
              // ) {
                
              // }
            });

            setupNode.forEach(item => {
              if(item.type !== 'ReturnStatement') {
                if(item.type === 'VariableDeclaration') {
                  item.declarations.forEach(declar => {

                    if(declar.type === 'VariableDeclarator'
                      && declar.id.type === 'Identifier'
                      && declar.init?.type === 'CallExpression'
                      && declar.init?.callee.type === 'Identifier'
                      && ['computed'].includes(declar.init?.callee.name)
                    ) {
                      const name = declar.id.name;
                      traverse(declar, {
                        Identifier(path) {
                          if(declarNodes.has(path.node.name) && path.node.name !== name) {
                            declarEdges.get(name)?.add(path.node.name);
                          }
                        },
                      },path.scope, path);
                    }
                  });
                }
                if(['CallExpression', 'ArrowFunctionExpression', 'FunctionDeclaration'].includes(item.type)) {
                  //  @ts-ignore
                  const name = item.id?.name;
                  traverse(item, {
                    Identifier(path) {
                      if(declarNodes.has(path.node.name) && path.node.name !== name) {
                        declarEdges.get(name)?.add(path.node.name);
                      }
                    },
                  }, path.scope, path);
                }
              }
            });

            setupNode.forEach(item => {
              if(item.type === 'ReturnStatement'
                && item.argument?.type === 'ObjectExpression'
              ) {
                item.argument.properties.forEach(prop => {
                  if(prop.type === 'ObjectProperty') {
                    if(
                      prop.key.type === 'Identifier'
                      && prop.value.type === 'Identifier'
                    ) {
                      const name = prop.key.name;
                      const valuename = prop.value.name;
                      if(name && !graph.nodes.has(name)) {
                        graph.nodes.add(name);
                        if(!graph.edges.has(name)) {
                          graph.edges.set(name, new Set());
                        }
                        if(
                          declarEdges.get(valuename)
                          && declarEdges.get(valuename)?.size
                        ) {
                          declarEdges.get(valuename)?.forEach(item => {
                            graph.edges.get(name)?.add(item);
                          });
                        }
                      }
                    }
                    if(
                      prop.key.type === 'Identifier'
                      && ['CallExpression', 'ArrowFunctionExpression', 'FunctionDeclaration'].includes(prop.value.type)
                    ) {
                      const name = prop.key.name;
                      if(name && !graph.nodes.has(name)) {
                        graph.nodes.add(name);
                        traverse(prop.value, {
                          Identifier(path) {
                            if(declarNodes.has(path.node.name) && path.node.name !== name) {
                              graph.edges.get(name)?.add(path.node.name);
                            }
                          },
                        }, path.scope, path);
                      }
                    }
                  }
                });
              }
            });

          }
        });
      }
      // export default defineComponent({})
      if(path.node.declaration.type === 'CallExpression' 
        && path.node.declaration.callee.type === 'Identifier'
        && path.node.declaration.callee.name === 'defineComponent'
        && path.node.declaration.arguments[0].type === 'ObjectExpression'
      ) {
        const code = path.node.declaration.arguments[0];

      }
    },
  });


  return graph;
}
