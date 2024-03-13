import { babelParse } from '@vue/compiler-sfc';
import type { NodePath } from '@babel/traverse';
import _traverse from '@babel/traverse';
import type * as t from '@babel/types';
import { processSetup } from './setupScript';
import { NodeCollection, getComment } from './utils';
const traverse: typeof _traverse
  // @ts-expect-error unwarp default
  = _traverse.default?.default || _traverse.default || _traverse;

const vueLifeCycleHooks = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'renderTracked',
  'renderTriggered',
];

export function analyze(
  content: string,
  lineOffset = 0,
  jsx = false,
) {
  // console.log({lineOffset});
  // console.log(content);
  const ast = babelParse(content, { sourceType: 'module', plugins: [
    'typescript',
    ...jsx
      ? ['jsx' as const]
      : [],
  ] });

  // ---

  let nodeCollection = new NodeCollection(lineOffset);

  const tNodes = new Map<string, t.Identifier>();
  const graph = {
    nodes: new Set<string>(),
    edges: new Map<string, Set<string>>(),
  };

  /** used in render block or setup return */
  const nodesUsedInTemplate = new Set<string>();

  function process(node: t.ObjectExpression, path: NodePath<t.ExportDefaultDeclaration>) {
    traverse(node, {
      ObjectProperty(path1) {
        if (
          (
            path.node.declaration.type === 'ObjectExpression'
            && path1.parent === path.node.declaration
          ) || (
            path.node.declaration.type === 'CallExpression'
            && path1.parent === path.node.declaration.arguments[0]
          )
        ) {
          // data
          if (
            path1.node.key.type === 'Identifier'
            && path1.node.key.name === 'data'
            && (
              path1.node.value.type === 'ArrowFunctionExpression'
              || path1.node.value.type === 'FunctionExpression'
            )
          ) {
            const dataNode = path1.node.value;

            traverse(dataNode, {
              ReturnStatement(path2) {
                if (path2.parent === dataNode.body) {
                  if (path2.node.argument?.type === 'ObjectExpression') {
                    path2.node.argument.properties.forEach((prop) => {
                      if (prop.type === 'ObjectProperty') {
                        if (prop.key.type === 'Identifier') {
                          const name = prop.key.name;
                          graph.nodes.add(name);
                          tNodes.set(name, prop.key);
                          nodeCollection.addNode(name, prop, {
                            comment: getComment(prop),
                          });
                          if (!graph.edges.get(name)) {
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
          if (path1.node.key.type === 'Identifier' && path1.node.key.name === 'computed') {
            const computedNode = path1.node;
            if (computedNode.value.type === 'ObjectExpression') {
              computedNode.value.properties.forEach((prop) => {
                if (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod') {
                  if (prop.key.type === 'Identifier') {
                    const name = prop.key.name;
                    graph.nodes.add(name);
                    tNodes.set(name, prop.key);
                    nodeCollection.addNode(name, prop, {
                      isComputed: true,
                      comment: getComment(prop),
                    });
                    if (!graph.edges.get(name)) {
                      graph.edges.set(name, new Set());
                    }
                  }
                }
              });
            }
          }

          // methods
          if (path1.node.key.type === 'Identifier' && path1.node.key.name === 'methods') {
            const methodsNode = path1.node;
            if (methodsNode.value.type === 'ObjectExpression') {
              methodsNode.value.properties.forEach((prop) => {
                if (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod') {
                  if (prop.key.type === 'Identifier') {
                    const name = prop.key.name;
                    graph.nodes.add(name);
                    tNodes.set(name, prop.key);
                    nodeCollection.addNode(name, prop, {
                      isMethod: true,
                      comment: getComment(prop),
                    });
                    if (!graph.edges.get(name)) {
                      graph.edges.set(name, new Set());
                    }
                  }
                }
              });
            }
          }

          if (
            path1.node.key.type === 'Identifier'
            && path1.node.key.name === 'render'
            && (
              path1.node.value.type === 'ArrowFunctionExpression'
              || path1.node.value.type === 'FunctionExpression'
            )
          ) {
            traverse(path1.node.value, {
              ReturnStatement(path2) {
                const templateNode = path2.node;
                traverse(templateNode, {
                  MemberExpression(path3) {
                    if (path3.node.object && path3.node.object.type === 'ThisExpression') {
                      if (path3.node.property && path3.node.property.type === 'Identifier') {
                        nodesUsedInTemplate.add(path3.node.property.name);
                      }
                    }
                  },
                }, path2.scope, path2);
              },
            }, path1.scope, path1);
          }
        }
      },
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
          // setup
          if (path1.node.key.type === 'Identifier' && path1.node.key.name === 'setup') {
            const setupNode = path1.node;

            const spread: string[] = [];

            traverse(setupNode, {
              ReturnStatement(path2) {
                if (path2.node.argument?.type === 'ObjectExpression') {
                  const returnNode = path2.node.argument;
                  traverse(returnNode, {
                    SpreadElement(path3) {
                      // ...toRefs(xxx)
                      if (
                        path3.node.argument.type === 'CallExpression'
                        && path3.node.argument.callee.type === 'Identifier'
                        && path3.node.argument.callee.name === 'toRefs'
                        && path3.node.argument.arguments[0].type === 'Identifier'
                      ) {
                        spread.push(path3.node.argument.arguments[0].name);
                      }
                      // ...xxx
                      else if (
                        path3.node.argument.type === 'Identifier'
                      ) {
                        spread.push(path3.node.argument.name);
                      }
                    },
                  }, path2.scope, path2);
                }
                if (
                  path2.node.argument?.type === 'FunctionExpression'
                  || path2.node.argument?.type === 'ArrowFunctionExpression'
                ) {
                  const templateNode = path2.node.argument.body;
                  traverse(templateNode, {
                    Identifier(path3) {
                      const binding = path3.scope.getBinding(path3.node.name);
                      if (binding?.scope === path1.scope) {
                        nodesUsedInTemplate.add(path3.node.name);
                      }
                    },
                    JSXIdentifier(path3) {
                      const binding = path3.scope.getBinding(path3.node.name);
                      if (binding?.scope === path1.scope) {
                        nodesUsedInTemplate.add(path3.node.name);
                      }
                    },
                  }, path2.scope, path2);
                }
              },
            }, path1.scope, path1);

            const {
              graph: {
                nodes: tempNodes,
                edges: tempEdges,
                spread: tempSpread,
              },
              nodeCollection: tempNodeCollection,
            } = processSetup(setupNode, path1.scope, setupNode, spread, lineOffset);

            // 3 filter data by return
            traverse(setupNode, {
              ReturnStatement(path2) {
                // only process return in setupNode scope
                if (path2.scope !== path1.scope) {
                  return;
                }

                if (path2.node.argument?.type === 'ObjectExpression') {
                  const returnNode = path2.node.argument;
                  traverse(returnNode, {
                    ObjectProperty(path3) {
                      if (path3.parent === returnNode) {
                        if (
                          path3.node.key.type === 'Identifier'
                          && path3.node.value.type === 'Identifier'
                          && tempNodes.has(path3.node.value.name)
                        ) {
                          const valName = path3.node.value.name;
                          if (!graph.nodes.has(valName)) {
                            graph.nodes.add(valName);
                            tNodes.set(valName, path3.node.value);
                            nodeCollection.addTypedNode(
                              valName,
                              tempNodeCollection.nodes.get(valName)!,
                            );
                          }
                          if (!graph.edges.has(valName)) {
                            graph.edges.set(valName, new Set([...Array.from(
                              tempEdges.get(valName) || new Set<string>(),
                            )]));
                          }

                          const name = path3.node.key.name;
                          if (name !== valName) {
                            graph.nodes.add(name);
                            tNodes.set(name, path3.node.key);
                            nodeCollection.addNode(name, path3.node.key, {
                              comment: getComment(path3.node),
                            });
                            graph.edges.set(name, new Set([valName]));
                          }
                        }
                      }
                    },
                    SpreadElement(path3) {
                      // ...toRefs(xxx)
                      if (
                        path3.node.argument.type === 'CallExpression'
                        && path3.node.argument.callee.type === 'Identifier'
                        && path3.node.argument.callee.name === 'toRefs'
                        && path3.node.argument.arguments[0].type === 'Identifier'
                        && tempSpread.get(path3.node.argument.arguments[0].name)
                      ) {
                        tempSpread.get(path3.node.argument.arguments[0].name)?.forEach((name) => {
                          graph.nodes.add(name);
                          // @ts-expect-error Identifier
                          tNodes.set(name, path3.node.argument.arguments[0]);
                          nodeCollection.addTypedNode(name, tempNodeCollection.nodes.get(name)!);
                          if (!graph.edges.get(name)) {
                            graph.edges.set(name, new Set());
                            tempEdges.get(name)?.forEach((edge) => {
                              graph.edges.get(name)?.add(edge);
                            });
                          }
                        });
                      }
                      // ...xxx
                      else if (
                        path3.node.argument.type === 'Identifier'
                        && tempSpread.get(path3.node.argument.name)
                      ) {
                        tempSpread.get(path3.node.argument.name)?.forEach((name) => {
                          graph.nodes.add(name);
                          // @ts-expect-error Identifier
                          tNodes.set(name, path3.node.argument);
                          nodeCollection.addTypedNode(name, tempNodeCollection.nodes.get(name)!);
                          if (!graph.edges.get(name)) {
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
                else {
                  graph.edges = tempEdges;
                  graph.nodes = tempNodes;
                  nodeCollection = tempNodeCollection;
                }
              },
            }, path1.scope, path1);
          }

          // data
          if (path1.node.key.type === 'Identifier' && path1.node.key.name === 'data') {
            const dataNode = path1.node;

            traverse(dataNode, {
              ReturnStatement(path2) {
                if (path2.parent === dataNode.body) {
                  if (path2.node.argument?.type === 'ObjectExpression') {
                    path2.node.argument.properties.forEach((prop) => {
                      if (prop.type === 'ObjectProperty') {
                        if (prop.key.type === 'Identifier') {
                          const name = prop.key.name;
                          graph.nodes.add(name);
                          tNodes.set(name, prop.key);
                          nodeCollection.addNode(name, prop, {
                            comment: getComment(prop),
                          });
                          if (!graph.edges.get(name)) {
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

          // render
          if (path1.node.key.type === 'Identifier' && path1.node.key.name === 'render') {
            traverse(path1.node, {
              ReturnStatement(path2) {
                const templateNode = path2.node;
                traverse(templateNode, {
                  MemberExpression(path3) {
                    if (path3.node.object && path3.node.object.type === 'ThisExpression') {
                      if (path3.node.property && path3.node.property.type === 'Identifier') {
                        nodesUsedInTemplate.add(path3.node.property.name);
                      }
                    }
                  },
                }, path2.scope, path2);
              },
            }, path1.scope, path1);
          }
        }
      },
    }, path.scope, path);

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
          if (path1.node.key.type === 'Identifier' && vueLifeCycleHooks.includes(path1.node.key.name)) {
            const hookName = path1.node.key.name;

            traverse(path1.node.body, {
              MemberExpression(path2) {
                if (path2.node.object.type === 'ThisExpression' && path2.node.property.type === 'Identifier') {
                  const _node = nodeCollection.getNode(path2.node.property.name);
                  if (_node?.info?.used) {
                    _node?.info?.used?.add(hookName);
                  }
                  else if (_node) {
                    _node.info = {
                      ..._node?.info,
                      used: new Set([hookName]),
                    };
                  }
                }
              },
            }, path1.scope, path1);
          }
        }
      },
      ObjectProperty(path1) {
        if (
          (
            path.node.declaration.type === 'ObjectExpression'
            && path1.parent === path.node.declaration
          ) || (
            path.node.declaration.type === 'CallExpression'
            && path1.parent === path.node.declaration.arguments[0]
          )
        ) {
          if (path1.node.key.type === 'Identifier' && path1.node.key.name === 'computed') {
            const computedNode = path1.node;
            if (computedNode.value.type === 'ObjectExpression') {
              computedNode.value.properties.forEach((prop) => {
                if (prop.type === 'ObjectMethod' && prop.key.type === 'Identifier') {
                  const name = prop.key.name;
                  traverse(prop, {
                    MemberExpression(path2) {
                      if (path2.node.object.type === 'ThisExpression' && path2.node.property.type === 'Identifier') {
                        graph.edges.get(name)?.add(path2.node.property.name);
                      }
                    },
                  }, path1.scope, path1);
                }

                if (
                  prop.type === 'ObjectProperty'
                  && prop.key.type === 'Identifier'
                  && prop.value.type === 'ObjectExpression'
                ) {
                  const name = prop.key.name;
                  prop.value.properties.forEach((prop1) => {
                    if (
                      prop1.type === 'ObjectProperty'
                      && prop1.key.type === 'Identifier'
                      && prop1.key.name === 'get'
                    ) {
                      traverse(prop1, {
                        MemberExpression(path2) {
                          if (
                            path2.node.object.type === 'ThisExpression'
                            && path2.node.property.type === 'Identifier'
                          ) {
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

          if (path1.node.key.type === 'Identifier' && path1.node.key.name === 'methods') {
            const methodsNode = path1.node;
            if (methodsNode.value.type === 'ObjectExpression') {
              methodsNode.value.properties.forEach((prop) => {
                if (
                  (prop.type === 'ObjectMethod'
                  || prop.type === 'ObjectProperty')
                  && prop.key.type === 'Identifier'
                ) {
                  const name = prop.key.name;
                  traverse(prop, {
                    MemberExpression(path2) {
                      if (path2.node.object.type === 'ThisExpression' && path2.node.property.type === 'Identifier') {
                        graph.edges.get(name)?.add(path2.node.property.name);
                      }
                    },
                  }, path1.scope, path1);
                }
              });
            }
          }

          if (path1.node.key.type === 'Identifier' && ['watch', ...vueLifeCycleHooks].includes(path1.node.key.name)) {
            const hookName = path1.node.key.name;

            if (hookName === 'watch' && path1.node.value.type === 'ObjectExpression') {
              path1.node.value.properties.forEach((prop) => {
                if ((prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod') && (
                  prop.key.type === 'Identifier' || prop.key.type === 'StringLiteral'
                )) {
                  const keyName = prop.key.type === 'Identifier'
                    ? prop.key.name
                    : prop.key.type === 'StringLiteral'
                      ? prop.key.value.split('.')[0]
                      : '';
                  const watchArg = tNodes.get(keyName);

                  const _node = nodeCollection.getNode(keyName);
                  if (_node?.info?.used) {
                    _node?.info?.used?.add(hookName);
                  }
                  else if (_node) {
                    _node.info = {
                      ..._node?.info,
                      used: new Set([hookName]),
                    };
                  }

                  traverse(path1.node.value, {
                    MemberExpression(path2) {
                      if (path2.node.object.type === 'ThisExpression' && path2.node.property.type === 'Identifier') {
                        if (watchArg && watchArg.name !== path2.node.property.name) {
                          graph.edges.get(watchArg.name)?.add(path2.node.property.name);
                        }
                      }
                    },
                  }, path1.scope, path1);
                }
              });
            }
            else {
              traverse(path1.node.value, {
                MemberExpression(path2) {
                  if (path2.node.object.type === 'ThisExpression' && path2.node.property.type === 'Identifier') {
                    const _node = nodeCollection.getNode(path2.node.property.name);
                    if (_node?.info?.used) {
                      _node?.info?.used?.add(hookName);
                    }
                    else if (_node) {
                      _node.info = {
                        ..._node?.info,
                        used: new Set([hookName]),
                      };
                    }
                  }
                },
              }, path1.scope, path1);
            }
          }
        }
      },
    }, path.scope, path);
  }

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      // export default {}
      if (path.node.declaration.type === 'ObjectExpression') {
        process(path.node.declaration, path);
      }
      // export default defineComponent({})
      else if (path.node.declaration.type === 'CallExpression'
        && path.node.declaration.callee.type === 'Identifier'
        && path.node.declaration.callee.name === 'defineComponent'
        && path.node.declaration.arguments[0].type === 'ObjectExpression'
      ) {
        process(path.node.declaration.arguments[0], path);
      }
    },
  });

  return {
    graph: nodeCollection.map(graph),
    nodesUsedInTemplate,
  };
}
