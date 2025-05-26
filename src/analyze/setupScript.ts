import type { NodePath, Scope, VisitNode } from '@babel/traverse';
import type * as t from '@babel/types';
import _traverse from '@babel/traverse';
import { babelParse } from '@vue/compiler-sfc';
import { getComment, isWritingNode, NodeCollection, NodeType } from './utils';

const traverse: typeof _traverse
  // @ts-expect-error unwarp default
  = _traverse.default?.default || _traverse.default || _traverse;

const ignoreFunctionsName = ['defineProps', 'defineEmits', 'withDefaults'];

export function processSetup(
  ast: t.Node,
  parentScope?: Scope,
  parentPath?: t.Node,
  _spread?: string[],
  _lineOffset = 0,
) {
  const spread = _spread || [];

  const nodeCollection = new NodeCollection(_lineOffset);

  const graph = {
    nodes: new Set<string>(),
    edges: new Map<string, Set<{ label: string, type: 'get' | 'set' }>>(),
    spread: new Map<string, Set<string>>(),
  };

  traverse(ast, {
    VariableDeclaration(path) {
      path.node.declarations.forEach((declaration) => {
        if (declaration.id.type === 'ArrayPattern') {
          declaration.id.elements.forEach((element) => {
            if (element?.type === 'Identifier') {
              const name = element.name;
              const binding = path.scope.getBinding(name);

              if (
                binding
                && (path.parent.type === 'Program'
                  || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
                )
                && !(declaration.init?.type === 'CallExpression'
                  && declaration.init?.callee.type === 'Identifier'
                  && ignoreFunctionsName.includes(declaration.init?.callee.name)
                )
              ) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, element, {
                  comment: getComment(path.node),
                });
                if (!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }
            if (element?.type === 'RestElement' && element.argument.type === 'Identifier') {
              const name = element.argument.name;
              const binding = path.scope.getBinding(name);

              if (
                binding
                && (path.parent.type === 'Program'
                  || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
                )
                && !(declaration.init?.type === 'CallExpression'
                  && declaration.init?.callee.type === 'Identifier'
                  && ignoreFunctionsName.includes(declaration.init?.callee.name)
                )
              ) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, element.argument, {
                  comment: getComment(path.node),
                });
                if (!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }
          });
        }
        if (declaration.id.type === 'ObjectPattern') {
          declaration.id.properties.forEach((property) => {
            if (property.type === 'ObjectProperty' && property.value.type === 'Identifier') {
              const name = property.value.name;
              const binding = path.scope.getBinding(name);
              if (
                binding
                && (path.parent.type === 'Program'
                  || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
                )
                && !(declaration.init?.type === 'CallExpression'
                  && declaration.init?.callee.type === 'Identifier'
                  && ignoreFunctionsName.includes(declaration.init?.callee.name)
                )
              ) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, property.value, {
                  comment: getComment(property),
                });
                if (!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }

            if (property.type === 'RestElement' && property.argument.type === 'Identifier') {
              const name = property.argument.name;
              const binding = path.scope.getBinding(name);
              if (
                binding
                && (path.parent.type === 'Program'
                  || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
                )
                && !(declaration.init?.type === 'CallExpression'
                  && declaration.init?.callee.type === 'Identifier'
                  && ignoreFunctionsName.includes(declaration.init?.callee.name)
                )
              ) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, property.argument, {
                  comment: getComment(property),
                });
                if (!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }
          });
        }
        if (declaration.id?.type === 'Identifier') {
          const name = declaration.id.name;
          const binding = path.scope.getBinding(name);
          if (
            binding
            && (path.parent.type === 'Program'
              || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
            )
            && !(declaration.init?.type === 'CallExpression'
              && declaration.init?.callee.type === 'Identifier'
              && ignoreFunctionsName.includes(declaration.init?.callee.name)
            )
          ) {
            graph.nodes.add(name);
            nodeCollection.addNode(name, declaration, {
              comment: getComment(path.node),
            });
            if (!graph.edges.get(name)) {
              graph.edges.set(name, new Set());
            }

            if (spread.includes(name)) {
              if (declaration.init?.type === 'ObjectExpression') {
                declaration.init?.properties.forEach((prop) => {
                  if (
                    (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod')
                    && prop.key.type === 'Identifier'
                  ) {
                    const keyName = prop.key.name;
                    graph.nodes.add(keyName);
                    nodeCollection.addNode(keyName, prop, {
                      comment: getComment(prop),
                    });
                    if (!graph.edges.get(keyName)) {
                      graph.edges.set(keyName, new Set());
                    }
                    if (graph.spread.has(name)) {
                      graph.spread.get(name)?.add(keyName);
                    }
                    else {
                      graph.spread.set(name, new Set([keyName]));
                    }
                  }
                  else if (prop.type === 'SpreadElement') {
                    console.warn('not support spread in spread');
                  }
                });
              }
              if (
                declaration.init?.type === 'CallExpression'
                && declaration.init?.callee.type === 'Identifier'
                && declaration.init?.callee.name === 'reactive'
              ) {
                const arg = declaration.init?.arguments[0];
                if (arg.type === 'ObjectExpression') {
                  arg.properties.forEach((prop) => {
                    if (
                      (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod')
                      && prop.key.type === 'Identifier'
                    ) {
                      const keyName = prop.key.name;
                      graph.nodes.add(keyName);
                      nodeCollection.addNode(keyName, prop, {
                        comment: getComment(prop),
                      });
                      if (!graph.edges.get(keyName)) {
                        graph.edges.set(keyName, new Set());
                      }
                      if (graph.spread.has(name)) {
                        graph.spread.get(name)?.add(keyName);
                      }
                      else {
                        graph.spread.set(name, new Set([keyName]));
                      }
                    }
                    else if (prop.type === 'SpreadElement') {
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
      if (name) {
        const binding = path.scope.getBinding(name);
        if (binding && (path.parent.type === 'Program'
          || (parentPath?.type === 'ObjectMethod' && parentPath.body === path.parent)
        )) {
          graph.nodes.add(name);
          nodeCollection.addNode(name, path.node.id!, {
            isMethod: true,
            comment: getComment(path.node),
          });
          if (!graph.edges.get(name)) {
            graph.edges.set(name, new Set());
          }
        }
      }
    },
  }, parentScope, parentPath);

  function traverseHooks(node: t.ExpressionStatement | t.CallExpression, patentScope: Scope) {
    if (
      (
        node.type === 'ExpressionStatement'
        && node.expression.type === 'CallExpression'
        && node.expression.callee.type === 'Identifier'
      ) || (
        node.type === 'CallExpression'
        && node.callee.type === 'Identifier'
      )
    ) {
      const hookName = (() => {
        if (node.type === 'ExpressionStatement'
          && node.expression.type === 'CallExpression'
          && node.expression.callee.type === 'Identifier') {
          return node.expression.callee.name;
        }
        if (node.type === 'CallExpression'
          && node.callee.type === 'Identifier') {
          return node.callee.name;
        }
      })() || '';

      if (!hookName) {
        return;
      }

      const hookBinding = patentScope.getBinding(hookName);
      if (!(hookBinding === undefined || hookBinding?.scope.block.type === 'Program'
        || parentScope === hookBinding?.scope)) {
        return;
      }

      const expression = (node.type === 'ExpressionStatement'
        ? node.expression
        : node) as t.CallExpression;

      const watchArgs = new Set<t.Identifier>();

      if (hookName === 'provide') {
        traverse(expression, {
          Identifier(path1) {
            const binding = path1.scope.getBinding(path1.node.name);
            if (
              graph.nodes.has(path1.node.name)
              && (
                (path1.parent.type !== 'MemberExpression'
                  && path1.parent.type !== 'OptionalMemberExpression')
                || path1.parent.object === path1.node
              )
              && (binding?.scope.block.type === 'Program'
                || parentScope === binding?.scope)
            ) {
              const _node = nodeCollection.getNode(path1.node.name);
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
        }, patentScope, node);
      }
      else if (hookName === 'watch') {
        if (expression.arguments[0].type === 'Identifier') {
          const binding = patentScope.getBinding(expression.arguments[0].name);
          if (
            graph.nodes.has(expression.arguments[0].name)
            && (binding?.scope.block.type === 'Program'
              || parentScope === binding?.scope)
          ) {
            watchArgs.add(expression.arguments[0]);
          }
        }
        else {
          traverse(expression.arguments[0], {
            Identifier(path1) {
              const binding = path1.scope.getBinding(path1.node.name);
              if (
                graph.nodes.has(path1.node.name)
                && (
                  (path1.parent.type !== 'MemberExpression'
                    && path1.parent.type !== 'OptionalMemberExpression')
                  || path1.parent.object === path1.node
                )
                && (binding?.scope.block.type === 'Program'
                  || parentScope === binding?.scope)
              ) {
                watchArgs.add(path1.node);
              }
            },
          }, patentScope, node);
        }
      }
      else if (hookName === 'useEffect' && expression.arguments[1].type === 'ArrayExpression') {
        traverse(expression.arguments[1], {
          Identifier(path1) {
            const binding = path1.scope.getBinding(path1.node.name);
            if (
              graph.nodes.has(path1.node.name)
              && (
                (path1.parent.type !== 'MemberExpression'
                  && path1.parent.type !== 'OptionalMemberExpression')
                || path1.parent.object === path1.node
              )
              && (binding?.scope.block.type === 'Program'
                || parentScope === binding?.scope)
            ) {
              watchArgs.add(path1.node);
            }
          },
        }, patentScope, node);
      }
      expression.arguments.forEach((argNode, index) => {
        if (hookName === 'watch' && index === 0 && argNode.type === 'Identifier') {
          const _node = nodeCollection.getNode(argNode.name);
          if (_node?.info?.used) {
            _node?.info?.used?.add(hookName);
          }
          else if (_node) {
            _node.info = {
              ..._node?.info,
              used: new Set([hookName]),
            };
          }
          return;
        }
        if (argNode.type === 'Identifier') {
          const binding = patentScope.getBinding(argNode.name);
          if (
            graph.nodes.has(argNode.name)
            && (binding?.scope.block.type === 'Program'
              || parentScope === binding?.scope)
          ) {
            const _node = nodeCollection.getNode(argNode.name);
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
        }
        else {
          traverse(argNode, {
            Identifier(path1) {
              const binding = path1.scope.getBinding(path1.node.name);
              if (
                graph.nodes.has(path1.node.name)
                && (
                  (path1.parent.type !== 'MemberExpression'
                    && path1.parent.type !== 'OptionalMemberExpression')
                  || path1.parent.object === path1.node
                )
                && (binding?.scope.block.type === 'Program'
                  || parentScope === binding?.scope)
              ) {
                if (['watch', 'useEffect'].includes(hookName) && watchArgs.size > 0) {
                  const watchArgsNames = Array.from(watchArgs).map(arg => arg.name);
                  watchArgs.forEach((watchArg) => {
                    if (!watchArgsNames.includes(path1.node.name)) {
                      graph.edges.get(watchArg.name)?.add({
                        label: path1.node.name,
                        type: isWritingNode(path1)
                          ? 'set'
                          : 'get',
                      });
                    }
                  });
                }
                const _node = nodeCollection.getNode(path1.node.name);
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
          }, patentScope, node);
        }
      });
    }
  }

  // get the relation between the variable and the function
  traverse(ast, {
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      if (name && graph.nodes.has(name)) {
        traverse(path.node.body, {
          Identifier(path1) {
            const binding = path1.scope.getBinding(path1.node.name);
            if (
              graph.nodes.has(path1.node.name)
              && (
                (path1.parent.type !== 'MemberExpression'
                  && path1.parent.type !== 'OptionalMemberExpression')
                || path1.parent.object === path1.node
              )
              && (binding?.scope.block.type === 'Program'
                || (parentScope === binding?.scope)
              )
            ) {
              graph.edges.get(name)?.add({
                label: path1.node.name,
                type: isWritingNode(path1)
                  ? 'set'
                  : 'get',
              });
            }
          },
          MemberExpression(path1) {
            if (
              path1.node.object.type === 'Identifier'
              && spread.includes(path1.node.object.name)
            ) {
              const binding = path1.scope.getBinding(path1.node.object.name);
              if (
                spread.includes(path1.node.object.name)
                && path1.node.property.type === 'Identifier'
                && (binding?.scope.block.type === 'Program'
                  || (parentScope === binding?.scope)
                )
              ) {
                graph.edges.get(name)?.add({
                  label: path1.node.property.name,
                  type: isWritingNode(path1)
                    ? 'set'
                    : 'get',
                });
              }
            }
          },
        }, path.scope, path);
      }
    },

    VariableDeclarator(path) {
      if (path.node.init) {
        if (path.node.id.type === 'ArrayPattern') {
          path.node.id.elements.forEach((element) => {
            if (element?.type === 'Identifier') {
              const name = element.name;
              if (name && graph.nodes.has(name) && path.node.init?.type === 'CallExpression') {
                traverse(path.node.init, {
                  Identifier(path1) {
                    const binding = path1.scope.getBinding(path1.node.name);
                    if (
                      graph.nodes.has(path1.node.name)
                      && (
                        (path1.parent.type !== 'MemberExpression'
                          && path1.parent.type !== 'OptionalMemberExpression')
                        || path1.parent.object === path1.node
                      )
                      && (binding?.scope.block.type === 'Program'
                        || (parentScope === binding?.scope)
                      )
                    ) {
                      graph.edges.get(name)?.add({
                        label: path1.node.name,
                        type: isWritingNode(path1)
                          ? 'set'
                          : 'get',
                      });
                    }
                  },
                  MemberExpression(path1) {
                    if (
                      path1.node.object.type === 'Identifier'
                      && spread.includes(path1.node.object.name)
                    ) {
                      const binding = path1.scope.getBinding(path1.node.object.name);
                      if (
                        spread.includes(path1.node.object.name)
                        && path1.node.property.type === 'Identifier'
                        && (binding?.scope.block.type === 'Program'
                          || (parentScope === binding?.scope)
                        )
                      ) {
                        graph.edges.get(name)?.add({
                          label: path1.node.property.name,
                          type: isWritingNode(path1)
                            ? 'set'
                            : 'get',
                        });
                      }
                    }
                  },
                }, path.scope, path);
              }
            }
          });
        }
        else if (path.node.id.type === 'ObjectPattern') {
          path.node.id.properties.forEach((property) => {
            if (property.type === 'ObjectProperty' && property.value.type === 'Identifier') {
              const name = property.value.name;
              if (name && graph.nodes.has(name) && path.node.init) {
                traverse(path.node.init, {
                  Identifier(path1) {
                    const binding = path1.scope.getBinding(path1.node.name);
                    if (
                      graph.nodes.has(path1.node.name)
                      && (
                        (path1.parent.type !== 'MemberExpression'
                          && path1.parent.type !== 'OptionalMemberExpression')
                        || path1.parent.object === path1.node
                      )
                      && (binding?.scope.block.type === 'Program'
                        || (parentScope === binding?.scope)
                      )
                    ) {
                      graph.edges.get(name)?.add({
                        label: path1.node.name,
                        type: isWritingNode(path1)
                          ? 'set'
                          : 'get',
                      });
                    }
                  },
                  MemberExpression(path1) {
                    if (
                      path1.node.object.type === 'Identifier'
                      && spread.includes(path1.node.object.name)
                    ) {
                      const binding = path1.scope.getBinding(path1.node.object.name);
                      if (
                        spread.includes(path1.node.object.name)
                        && path1.node.property.type === 'Identifier'
                        && (binding?.scope.block.type === 'Program'
                          || (parentScope === binding?.scope)
                        )
                      ) {
                        graph.edges.get(name)?.add({
                          label: path1.node.property.name,
                          type: isWritingNode(path1)
                            ? 'set'
                            : 'get',
                        });
                      }
                    }
                  },
                }, path.scope, path);
              }
            }
          });
        }
        else if ([
          'CallExpression',
          'ArrowFunctionExpression',
          'FunctionDeclaration',
        ].includes(path.node.init.type)
        && path.node.id.type === 'Identifier'
        ) {
          if (path.node.init.type === 'CallExpression' && path.node.init.callee.type === 'Identifier' && ['watch', 'watchEffect'].includes(path.node.init.callee.name)) {
            traverseHooks(path.node.init, path.scope);
          }
          const name = path.node.id?.name;
          if (name && graph.nodes.has(name)) {
            traverse(path.node.init, {
              Identifier(path1) {
                const binding = path1.scope.getBinding(path1.node.name);
                if (
                  graph.nodes.has(path1.node.name)
                  && (
                    (path1.parent.type !== 'MemberExpression'
                      && path1.parent.type !== 'OptionalMemberExpression')
                    || path1.parent.object === path1.node
                  )
                  && (binding?.scope.block.type === 'Program'
                    || (parentScope === binding?.scope)
                  )
                ) {
                  graph.edges.get(name)?.add({
                    label: path1.node.name,
                    type: isWritingNode(path1)
                      ? 'set'
                      : 'get',
                  });
                }
              },
              MemberExpression(path1) {
                if (
                  path1.node.object.type === 'Identifier'
                  && spread.includes(path1.node.object.name)
                ) {
                  const binding = path1.scope.getBinding(path1.node.object.name);
                  if (
                    spread.includes(path1.node.object.name)
                    && path1.node.property.type === 'Identifier'
                    && (binding?.scope.block.type === 'Program'
                      || (parentScope === binding?.scope)
                    )
                  ) {
                    graph.edges.get(name)?.add({
                      label: path1.node.property.name,
                      type: isWritingNode(path1)
                        ? 'set'
                        : 'get',
                    });
                  }
                }
              },
            }, path.scope, path);
          }
        }
        else if (path.node.id.type === 'Identifier') {
          const name = path.node.id.name;
          if (path.node.init.type === 'Identifier') {
            const binding = path.scope.getBinding(path.node.init.name);
            if (
              graph.nodes.has(path.node.init.name)
              && (binding?.scope.block.type === 'Program'
                || (parentScope === binding?.scope)
              )
            ) {
              graph.edges.get(name)?.add({
                label: path.node.init.name,
                type: isWritingNode(path)
                  ? 'set'
                  : 'get',
              });
            }
          }
          else {
            traverse(path.node.init, {
              Identifier(path1) {
                const binding = path1.scope.getBinding(path1.node.name);
                if (
                  graph.nodes.has(path1.node.name)
                  && (
                    (path1.parent.type !== 'MemberExpression'
                      && path1.parent.type !== 'OptionalMemberExpression')
                    || path1.parent.object === path1.node
                  )
                  && (binding?.scope.block.type === 'Program'
                    || (parentScope === binding?.scope)
                  )
                ) {
                  graph.edges.get(name)?.add({
                    label: path1.node.name,
                    type: isWritingNode(path1)
                      ? 'set'
                      : 'get',
                  });
                }
              },
            }, path.scope, path);
          }
        }
      }
    },

    ObjectMethod(path) {
      if (path.node.key.type === 'Identifier' && graph.nodes.has(path.node.key.name)) {
        const name = path.node.key.name;

        traverse(path.node.body, {
          Identifier(path1) {
            const binding = path1.scope.getBinding(path1.node.name);
            if (
              graph.nodes.has(path1.node.name)
              && (
                (path1.parent.type !== 'MemberExpression'
                  && path1.parent.type !== 'OptionalMemberExpression')
                || path1.parent.object === path1.node
              )
              && (binding?.scope.block.type === 'Program'
                || (parentScope === binding?.scope)
              )
            ) {
              graph.edges.get(name)?.add({
                label: path1.node.name,
                type: isWritingNode(path1)
                  ? 'set'
                  : 'get',
              });
            }
          },
          MemberExpression(path1) {
            if (
              path1.node.object.type === 'Identifier'
              && spread.includes(path1.node.object.name)
            ) {
              const binding = path1.scope.getBinding(path1.node.object.name);
              if (
                spread.includes(path1.node.object.name)
                && path1.node.property.type === 'Identifier'
                && (binding?.scope.block.type === 'Program'
                  || (parentScope === binding?.scope)
                )
              ) {
                graph.edges.get(name)?.add({
                  label: path1.node.property.name,
                  type: isWritingNode(path1)
                    ? 'set'
                    : 'get',
                });
              }
            }
          },
        }, path.scope, path);
      }
    },

    ObjectProperty(path) {
      if (path.node.key.type === 'Identifier' && graph.nodes.has(path.node.key.name)) {
        const name = path.node.key.name;

        traverse(path.node.value, {
          MemberExpression(path1) {
            if (
              path1.node.object.type === 'Identifier'
              && spread.includes(path1.node.object.name)
            ) {
              const binding = path1.scope.getBinding(path1.node.object.name);
              if (
                spread.includes(path1.node.object.name)
                && path1.node.property.type === 'Identifier'
                && (binding?.scope.block.type === 'Program'
                  || (parentScope === binding?.scope)
                )
              ) {
                graph.edges.get(name)?.add({
                  label: path1.node.property.name,
                  type: isWritingNode(path1)
                    ? 'set'
                    : 'get',
                });
              }
            }
          },
        }, path.scope, path);
      }
    },
    ExpressionStatement(path) {
      if (path.type === 'ExpressionStatement'
        && path.node.expression.type === 'CallExpression'
        && path.node.expression.callee.type === 'Identifier'
      ) {
        const name = path.node.expression.callee.name;
        if (
          graph.nodes.has(name)
          && (path.scope.block.type === 'Program')
        ) {
          const _node = nodeCollection.getNode(name);
          if (_node?.info?.used) {
            _node?.info?.used?.add('Call Expression');
          }
          else if (_node) {
            _node.info = {
              ..._node?.info,
              used: new Set(['Call Expression']),
            };
          }
        }
        else {
          traverseHooks(path.node.expression, path.scope);
        }
      }
      if (path.type === 'ExpressionStatement'
        && path.node.expression.type === 'AssignmentExpression'
        && path.node.expression.right.type === 'CallExpression'
        && path.node.expression.right.callee.type === 'Identifier'
      ) {
        traverseHooks(path.node.expression.right, path.scope);
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
  jsx = false,
) {
  // console.log(content);
  const ast = babelParse(content, { sourceType: 'module', plugins: [
    'typescript',
    ...jsx
      ? ['jsx' as const]
      : [],
  ] });

  // ---
  const { graph, nodeCollection } = processSetup(ast, undefined, undefined, undefined, lineOffset);
  return nodeCollection.map(graph);
}
