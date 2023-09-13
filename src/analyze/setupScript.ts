import { babelParse } from '@vue/compiler-sfc';
import _traverse, { Scope } from '@babel/traverse';
import * as t from '@babel/types';
import { NodeCollection, NodeType } from './utils';
const traverse: typeof _traverse =
  //@ts-ignore
  _traverse.default?.default || _traverse.default || _traverse;

export function processSetup(ast: t.Node, parentScope?: Scope, parentPath?: t.Node, _spread?: string[], _lineOffset=0) {
  const spread = _spread || [];
  
  const nodeCollection = new NodeCollection(_lineOffset);

  const graph = { 
    nodes: new Set<string>(), 
    edges: new Map<string, Set<string>>(), 
    spread: new Map<string, Set<string>>(),
  };

  traverse(ast, {
    VariableDeclaration(path){
      path.node.declarations.forEach((declaration) => {
        if(declaration.id.type === 'ArrayPattern') {
          declaration.id.elements.forEach((element) => {
            if(element?.type === 'Identifier') {
              const name = element.name;
              const binding = path.scope.getBinding(name);
              
              if(
                binding 
                && (path.parent.type === 'Program'
                || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
                )
                && !(declaration.init?.type === 'CallExpression'
                  && declaration.init?.callee.type === 'Identifier'
                  && ['defineProps', 'defineEmits'].includes(declaration.init?.callee.name)
                )
              ) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, element);
                if(!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }
            if (element?.type === 'RestElement' && element.argument.type === 'Identifier') {
              const name = element.argument.name;
              const binding = path.scope.getBinding(name);
              
              if(
                binding 
                && (path.parent.type === 'Program'
                || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
                )
                && !(declaration.init?.type === 'CallExpression'
                  && declaration.init?.callee.type === 'Identifier'
                  && ['defineProps', 'defineEmits'].includes(declaration.init?.callee.name)
                )
              ) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, element.argument);
                if(!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }
          });
        }
        if(declaration.id.type === 'ObjectPattern') {
          declaration.id.properties.forEach((property) => {
            if(property.type === 'ObjectProperty' && property.value.type === 'Identifier') {
              const name = property.value.name;
              const binding = path.scope.getBinding(name);
              if(
                binding 
                && (path.parent.type === 'Program'
                || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
                )
                && !(declaration.init?.type === 'CallExpression'
                  && declaration.init?.callee.type === 'Identifier'
                  && ['defineProps', 'defineEmits'].includes(declaration.init?.callee.name)
                )
              ) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, property.value);
                if(!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }

            if(property.type === 'RestElement' && property.argument.type === 'Identifier') {
              const name = property.argument.name;
              const binding = path.scope.getBinding(name);
              if(
                binding 
                && (path.parent.type === 'Program'
                || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
                )
                && !(declaration.init?.type === 'CallExpression'
                  && declaration.init?.callee.type === 'Identifier'
                  && ['defineProps', 'defineEmits'].includes(declaration.init?.callee.name)
                )
              ) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, property.argument);
                if(!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }
          });
        }
        if(declaration.id?.type === 'Identifier') {
          const name = declaration.id.name;
          const binding = path.scope.getBinding(name);
          if(
            binding 
            && (path.parent.type === 'Program'
              || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
            )
            && !(declaration.init?.type === 'CallExpression'
              && declaration.init?.callee.type === 'Identifier'
              && ['defineProps', 'defineEmits'].includes(declaration.init?.callee.name)
            )
          ) {
            graph.nodes.add(name);
            nodeCollection.addNode(name, declaration);
            if(!graph.edges.get(name)) {
              graph.edges.set(name, new Set());
            }


            if(spread.includes(name)) {
              if(declaration.init?.type === 'ObjectExpression') {
                declaration.init?.properties.forEach(prop => {
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
                    if(graph.spread.has(name)) {
                      graph.spread.get(name)?.add(keyName);
                    } else {
                      graph.spread.set(name, new Set([keyName]));
                    }
                  } else if(prop.type === 'SpreadElement') {
                    console.warn('not support spread in spread');
                  }
                });
              }
              if(
                declaration.init?.type === 'CallExpression'
                && declaration.init?.callee.type === 'Identifier'
                && declaration.init?.callee.name === 'reactive'
              ) {
                const arg = declaration.init?.arguments[0];
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
                      if(graph.spread.has(name)) {
                        graph.spread.get(name)?.add(keyName);
                      } else {
                        graph.spread.set(name, new Set([keyName]));
                      }
                    } else if(prop.type === 'SpreadElement') {
                      console.warn('not support spread in spread');
                    }
                  });
                }
              }
            }
          }
        }
      });
    },
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      if(name) {
        const binding = path.scope.getBinding(name);
        if(binding && (path.parent.type === 'Program'
        || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
        )) {
          graph.nodes.add(name);
          nodeCollection.addNode(name, path.node.id!, {isMethod: true});
          if(!graph.edges.get(name)) {
            graph.edges.set(name, new Set());
          }
        }
      }
    },
  }, parentScope, parentPath);

  // get the relation between the variable and the function

  traverse(ast, {
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      if(name && graph.nodes.has(name)) {
        traverse(path.node.body, {
          Identifier(path1) {
            const binding = path1.scope.getBinding(path1.node.name);
            if(
              graph.nodes.has(path1.node.name) 
              && (
                path1.parent.type !== 'MemberExpression'
                || path1.parent.object === path1.node
              )
              && (binding?.scope.block.type === 'Program'
                || (parentScope === binding?.scope)
              )
            ) {
              graph.edges.get(name)?.add(path1.node.name);
            }
          },
          MemberExpression(path1) {
            if(
              path1.node.object.type === 'Identifier' 
              && spread.includes(path1.node.object.name)
            ) {
              const binding = path1.scope.getBinding(path1.node.object.name);
              if(
                spread.includes(path1.node.object.name)
                && path1.node.property.type === 'Identifier'
                && (binding?.scope.block.type === 'Program'
                  || (parentScope === binding?.scope)
                )
              ) {
                graph.edges.get(name)?.add(path1.node.property.name);
              }
            }
          },
        }, path.scope, path);
      }
    },

    VariableDeclarator(path) {
      if(path.node.init) {
        if(path.node.id.type === 'ArrayPattern'){
          path.node.id.elements.forEach((element) => {
            if(element?.type === 'Identifier') {
              const name = element.name;
              if(name && graph.nodes.has(name) && path.node.init?.type === 'CallExpression') {
                traverse(path.node.init, {
                  Identifier(path1) {
                    const binding = path1.scope.getBinding(path1.node.name);
                    if(
                      graph.nodes.has(path1.node.name) 
                      && (
                        path1.parent.type !== 'MemberExpression'
                        || path1.parent.object === path1.node
                      )
                      && (binding?.scope.block.type === 'Program'
                        || (parentScope === binding?.scope)
                      )
                    ) {
                      graph.edges.get(name)?.add(path1.node.name);
                    }
                  },
                  MemberExpression(path1) {
                    if(
                      path1.node.object.type === 'Identifier' 
                      && spread.includes(path1.node.object.name)
                    ) {
                      const binding = path1.scope.getBinding(path1.node.object.name);
                      if(
                        spread.includes(path1.node.object.name)
                        && path1.node.property.type === 'Identifier'
                        && (binding?.scope.block.type === 'Program'
                          || (parentScope === binding?.scope)
                        )
                      ) {
                        graph.edges.get(name)?.add(path1.node.property.name);
                      }
                    }
                  },
                }, path.scope, path);
              }
            }
          });
        }
        if(path.node.id.type === 'ObjectPattern'){
          path.node.id.properties.forEach((property) => {
            if(property.type === 'ObjectProperty' && property.value.type === 'Identifier') {
              const name = property.value.name;
              if(name && graph.nodes.has(name) && path.node.init) {
                traverse(path.node.init, {
                  Identifier(path1) {
                    const binding = path1.scope.getBinding(path1.node.name);
                    if(
                      graph.nodes.has(path1.node.name) 
                      && (
                        path1.parent.type !== 'MemberExpression'
                        || path1.parent.object === path1.node
                      )
                      && (binding?.scope.block.type === 'Program'
                        || (parentScope === binding?.scope)
                      )
                    ) {
                      graph.edges.get(name)?.add(path1.node.name);
                    }
                  },
                  MemberExpression(path1) {
                    if(
                      path1.node.object.type === 'Identifier' 
                      && spread.includes(path1.node.object.name)
                    ) {
                      const binding = path1.scope.getBinding(path1.node.object.name);
                      if(
                        spread.includes(path1.node.object.name)
                        && path1.node.property.type === 'Identifier'
                        && (binding?.scope.block.type === 'Program'
                          || (parentScope === binding?.scope)
                        )
                      ) {
                        graph.edges.get(name)?.add(path1.node.property.name);
                      }
                    }
                  },
                }, path.scope, path);
              }
            }
          });
        }
        if([
          'CallExpression', 
          'ArrowFunctionExpression', 
          'FunctionDeclaration',
        ].includes(path.node.init.type) 
          && path.node.id.type === 'Identifier'
        ) {

          const name = path.node.id?.name;
          if(name && graph.nodes.has(name)) {
            traverse(path.node.init, {
              Identifier(path1) {
                const binding = path1.scope.getBinding(path1.node.name);
                if(
                  graph.nodes.has(path1.node.name) 
                  && (
                    path1.parent.type !== 'MemberExpression'
                    || path1.parent.object === path1.node
                  )
                  && (binding?.scope.block.type === 'Program'
                    || (parentScope === binding?.scope)
                  )
                ) {
                  graph.edges.get(name)?.add(path1.node.name);
                }
              },
              MemberExpression(path1) {
                if(
                  path1.node.object.type === 'Identifier' 
                  && spread.includes(path1.node.object.name)
                ) {
                  const binding = path1.scope.getBinding(path1.node.object.name);
                  if(
                    spread.includes(path1.node.object.name)
                    && path1.node.property.type === 'Identifier'
                    && (binding?.scope.block.type === 'Program'
                      || (parentScope === binding?.scope)
                    )
                  ) {
                    graph.edges.get(name)?.add(path1.node.property.name);
                  }
                }
              },
            }, path.scope, path);
          }
        }
      }
    },

    ObjectMethod(path) {
      if(path.node.key.type === 'Identifier' && graph.nodes.has(path.node.key.name)) {
        const name = path.node.key.name;
        
        traverse(path.node.body, {
          Identifier(path1) {
            const binding = path1.scope.getBinding(path1.node.name);
            if(
              graph.nodes.has(path1.node.name)
              && (
                path1.parent.type !== 'MemberExpression'
                || path1.parent.object === path1.node
              )
              && (binding?.scope.block.type === 'Program'
                || (parentScope === binding?.scope)
              )
            ) {
              graph.edges.get(name)?.add(path1.node.name);
            }
          },
          MemberExpression(path1) {
            if(
              path1.node.object.type === 'Identifier' 
              && spread.includes(path1.node.object.name)
            ) {
              const binding = path1.scope.getBinding(path1.node.object.name);
              if(
                spread.includes(path1.node.object.name)
                && path1.node.property.type === 'Identifier'
                && (binding?.scope.block.type === 'Program'
                  || (parentScope === binding?.scope)
                )
              ) {
                graph.edges.get(name)?.add(path1.node.property.name);
              }
            }
          },
        }, path.scope, path);
      }
    },
  }, parentScope, parentPath);

  return {
    graph,
    nodeCollection,
  };
}

export function analyze(
  content: string,
  lineOffset = 0,
) {
  // console.log(content);
  const ast = babelParse(content, { sourceType: 'module',
    plugins: [
      'typescript',
    ],
  });

  // ---
  const { graph, nodeCollection } = processSetup(ast, undefined, undefined, undefined, lineOffset);
  return nodeCollection.map(graph);
}
