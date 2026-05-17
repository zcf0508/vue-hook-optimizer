import type { NodePath, Scope } from '@babel/traverse';
import type * as t from '@babel/types';
import type { RelationType } from './utils';
import _traverse from '@babel/traverse';
import { babelParse } from '@vue/compiler-sfc';
import { getComment, getRelationType, NodeCollection } from './utils';

const traverse: typeof _traverse
  // @ts-expect-error unwarp default
  = _traverse.default?.default || _traverse.default || _traverse;

const watchHooks = [
  'watch',
  'watchArray',
  'watchAtMost',
  'watchDebounced',
  'watchDeep',
  'watchIgnorable',
  'watchImmediate',
  'watchOnce',
  'watchPausable',
  'watchThrottled',
  'watchTriggerable',
  'watchWithFilter',
];

interface HookAnalysisResult {
  graph: {
    nodes: Set<string>
    edges: Map<string, Set<{ label: string, type: RelationType }>>
  }
  nodeCollection: NodeCollection
  nodesUsedInReturn: Set<string>
  hookName: string
}

function processHookFunction(
  functionPath: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression>,
  lineOffset = 0,
  externalHookName = '',
): HookAnalysisResult {
  const nodeCollection = new NodeCollection(lineOffset);
  const nodesUsedInReturn = new Set<string>();

  const graph = {
    nodes: new Set<string>(),
    edges: new Map<string, Set<{ label: string, type: RelationType }>>(),
  };

  const functionNode = functionPath.node;
  const hookName = externalHookName
    || (functionNode.type === 'FunctionDeclaration' && functionNode.id
      ? functionNode.id.name
      : '');

  const bodyNode = functionNode.body;
  if (bodyNode.type !== 'BlockStatement') {
    return { graph, nodeCollection, nodesUsedInReturn, hookName };
  }

  const functionScope = functionPath.scope;

  // Collect function parameters as graph nodes (they are the "inputs" like props in setup)
  if (functionNode.params) {
    functionNode.params.forEach((param) => {
      if (param.type === 'Identifier') {
        graph.nodes.add(param.name);
        nodeCollection.addNode(param.name, param, { comment: '' });
        if (!graph.edges.get(param.name)) {
          graph.edges.set(param.name, new Set());
        }
      }
      else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
        graph.nodes.add(param.left.name);
        nodeCollection.addNode(param.left.name, param.left, { comment: '' });
        if (!graph.edges.get(param.left.name)) {
          graph.edges.set(param.left.name, new Set());
        }
      }
      else if (param.type === 'ObjectPattern') {
        param.properties.forEach((prop) => {
          if (prop.type === 'ObjectProperty' && prop.value.type === 'Identifier') {
            graph.nodes.add(prop.value.name);
            nodeCollection.addNode(prop.value.name, prop.value, { comment: '' });
            if (!graph.edges.get(prop.value.name)) {
              graph.edges.set(prop.value.name, new Set());
            }
          }
          else if (prop.type === 'RestElement' && prop.argument.type === 'Identifier') {
            graph.nodes.add(prop.argument.name);
            nodeCollection.addNode(prop.argument.name, prop.argument, { comment: '' });
            if (!graph.edges.get(prop.argument.name)) {
              graph.edges.set(prop.argument.name, new Set());
            }
          }
        });
      }
      else if (param.type === 'ArrayPattern') {
        param.elements.forEach((element) => {
          if (element?.type === 'Identifier') {
            graph.nodes.add(element.name);
            nodeCollection.addNode(element.name, element, { comment: '' });
            if (!graph.edges.get(element.name)) {
              graph.edges.set(element.name, new Set());
            }
          }
        });
      }
    });
  }

  // First pass: collect all variable and function declarations as nodes
  traverse(bodyNode, {
    VariableDeclaration(path) {
      path.node.declarations.forEach((declaration) => {
        if (declaration.id.type === 'Identifier') {
          const name = declaration.id.name;
          const binding = path.scope.getBinding(name);
          if (binding && binding.scope === functionScope) {
            graph.nodes.add(name);
            nodeCollection.addNode(name, declaration, {
              comment: getComment(path.node),
            });
            if (!graph.edges.get(name)) {
              graph.edges.set(name, new Set());
            }
          }
        }
        else if (declaration.id.type === 'ObjectPattern') {
          declaration.id.properties.forEach((property) => {
            if (property.type === 'ObjectProperty' && property.value.type === 'Identifier') {
              const name = property.value.name;
              const binding = path.scope.getBinding(name);
              if (binding && binding.scope === functionScope) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, property.value, {
                  comment: getComment(property),
                });
                if (!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }
            else if (property.type === 'RestElement' && property.argument.type === 'Identifier') {
              const name = property.argument.name;
              const binding = path.scope.getBinding(name);
              if (binding && binding.scope === functionScope) {
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
        else if (declaration.id.type === 'ArrayPattern') {
          declaration.id.elements.forEach((element) => {
            if (element?.type === 'Identifier') {
              const name = element.name;
              const binding = path.scope.getBinding(name);
              if (binding && binding.scope === functionScope) {
                graph.nodes.add(name);
                nodeCollection.addNode(name, element, {
                  comment: getComment(path.node),
                });
                if (!graph.edges.get(name)) {
                  graph.edges.set(name, new Set());
                }
              }
            }
          });
        }
      });
    },
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      if (name) {
        const binding = path.scope.getBinding(name);
        if (binding && binding.scope === functionScope) {
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
  }, functionScope, functionPath);

  // Helper to traverse hooks (watch, watchEffect, etc.)
  function traverseHooks(node: t.ExpressionStatement | t.CallExpression, parentScope: Scope) {
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

      const hookBinding = parentScope.getBinding(hookName);
      if (!(hookBinding === undefined || hookBinding?.scope === functionScope)) {
        return;
      }

      const expression = (node.type === 'ExpressionStatement'
        ? node.expression
        : node) as t.CallExpression;

      const watchArgs = new Set<t.Identifier>();

      if (watchHooks.includes(hookName)) {
        if (expression.arguments[0]?.type === 'Identifier') {
          const binding = parentScope.getBinding(expression.arguments[0].name);
          if (binding && graph.nodes.has(expression.arguments[0].name) && binding.scope === functionScope) {
            watchArgs.add(expression.arguments[0]);
          }
        }
        else if (expression.arguments[0]) {
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
                && binding?.scope === functionScope
              ) {
                watchArgs.add(path1.node);
              }
            },
          }, parentScope, node);
        }
      }

      expression.arguments.forEach((argNode, index) => {
        if (watchHooks.includes(hookName) && index === 0 && argNode.type === 'Identifier') {
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
          const binding = parentScope.getBinding(argNode.name);
          if (binding && graph.nodes.has(argNode.name) && binding.scope === functionScope) {
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
                && binding?.scope === functionScope
              ) {
                if ([...watchHooks].includes(hookName) && watchArgs.size > 0) {
                  const watchArgsNames = Array.from(watchArgs).map(arg => arg.name);
                  watchArgs.forEach((watchArg) => {
                    if (!watchArgsNames.includes(path1.node.name)) {
                      graph.edges.get(watchArg.name)?.add({
                        label: path1.node.name,
                        type: getRelationType(path1),
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
          }, parentScope, node);
        }
      });
    }
  }

  // Second pass: collect edges (dependencies between nodes)
  traverse(bodyNode, {
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      if (name && graph.nodes.has(name) && path.scope.getBinding(name)?.scope === functionScope) {
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
              && binding?.scope === functionScope
            ) {
              graph.edges.get(name)?.add({
                label: path1.node.name,
                type: getRelationType(path1),
              });
            }
          },
        }, path.scope, path);
      }
    },

    VariableDeclarator(path) {
      if (path.node.init) {
        if (path.node.id.type === 'Identifier') {
          const name = path.node.id.name;
          if (name && graph.nodes.has(name) && path.scope.getBinding(name)?.scope === functionScope) {
            if (path.node.init.type === 'CallExpression' && path.node.init.callee.type === 'Identifier' && [...watchHooks, 'watchEffect'].includes(path.node.init.callee.name)) {
              traverseHooks(path.node.init, path.scope);
            }
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
                  && binding?.scope === functionScope
                ) {
                  graph.edges.get(name)?.add({
                    label: path1.node.name,
                    type: getRelationType(path1),
                  });
                }
              },
            }, path.scope, path);
          }
        }
        else if (path.node.id.type === 'ObjectPattern') {
          path.node.id.properties.forEach((property) => {
            if (property.type === 'ObjectProperty' && property.value.type === 'Identifier') {
              const name = property.value.name;
              const isValidNode = name && graph.nodes.has(name) && path.node.init
                && path.scope.getBinding(name)?.scope === functionScope;
              if (isValidNode) {
                traverse(path.node.init!, {
                  Identifier(path1) {
                    const binding = path1.scope.getBinding(path1.node.name);
                    if (
                      graph.nodes.has(path1.node.name)
                      && (
                        (path1.parent.type !== 'MemberExpression'
                          && path1.parent.type !== 'OptionalMemberExpression')
                        || path1.parent.object === path1.node
                      )
                      && binding?.scope === functionScope
                    ) {
                      graph.edges.get(name)?.add({
                        label: path1.node.name,
                        type: getRelationType(path1),
                      });
                    }
                  },
                }, path.scope, path);
              }
            }
          });
        }
        else if (path.node.id.type === 'ArrayPattern') {
          path.node.id.elements.forEach((element) => {
            if (element?.type === 'Identifier') {
              const name = element.name;
              const isValidNode = name && graph.nodes.has(name) && path.node.init
                && path.scope.getBinding(name)?.scope === functionScope;
              if (isValidNode) {
                traverse(path.node.init!, {
                  Identifier(path1) {
                    const binding = path1.scope.getBinding(path1.node.name);
                    if (
                      graph.nodes.has(path1.node.name)
                      && (
                        (path1.parent.type !== 'MemberExpression'
                          && path1.parent.type !== 'OptionalMemberExpression')
                        || path1.parent.object === path1.node
                      )
                      && binding?.scope === functionScope
                    ) {
                      graph.edges.get(name)?.add({
                        label: path1.node.name,
                        type: getRelationType(path1),
                      });
                    }
                  },
                }, path.scope, path);
              }
            }
          });
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
              && binding?.scope === functionScope
            ) {
              graph.edges.get(name)?.add({
                label: path1.node.name,
                type: getRelationType(path1),
              });
            }
          },
        }, path.scope, path);
      }
    },

    ObjectProperty(path) {
      if (path.node.key.type === 'Identifier' && graph.nodes.has(path.node.key.name)) {
        const name = path.node.key.name;
        traverse(path.node.value, {
          Identifier(path1) {
            if (path1.node.name === name) {
              return;
            }
            const binding = path1.scope.getBinding(path1.node.name);
            if (
              graph.nodes.has(path1.node.name)
              && (
                (path1.parent.type !== 'MemberExpression'
                  && path1.parent.type !== 'OptionalMemberExpression')
                || path1.parent.object === path1.node
              )
              && binding?.scope === functionScope
            ) {
              graph.edges.get(name)?.add({
                label: path1.node.name,
                type: getRelationType(path1),
              });
            }
          },
        }, path.scope, path);
      }
    },

    ExpressionStatement(path) {
      if (path.node.expression.type === 'CallExpression'
        && path.node.expression.callee.type === 'Identifier'
      ) {
        const name = path.node.expression.callee.name;
        if (graph.nodes.has(name) && path.scope.getBinding(name)?.scope === functionScope) {
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
      if (path.node.expression.type === 'AssignmentExpression'
        && path.node.expression.right.type === 'CallExpression'
        && path.node.expression.right.callee.type === 'Identifier'
      ) {
        traverseHooks(path.node.expression.right, path.scope);
      }
    },
  }, functionScope, functionPath);

  // Third pass: collect return statement nodes (public API)
  traverse(bodyNode, {
    ReturnStatement(path) {
      if (path.node.argument?.type === 'ObjectExpression') {
        const returnNode = path.node.argument;
        traverse(returnNode, {
          ObjectProperty(path3) {
            if (path3.parent === returnNode) {
              if (path3.node.key.type === 'Identifier' && path3.node.value.type === 'Identifier') {
                nodesUsedInReturn.add(path3.node.value.name);
              }
              else if (path3.node.key.type === 'Identifier' && path3.node.value.type === 'Identifier') {
                nodesUsedInReturn.add(path3.node.key.name);
              }
            }
          },
          SpreadElement(path3) {
            if (path3.node.argument.type === 'Identifier') {
              nodesUsedInReturn.add(path3.node.argument.name);
            }
          },
        }, path.scope, path);
      }
    },
  }, functionScope, functionPath);

  return { graph, nodeCollection, nodesUsedInReturn, hookName };
}

export function analyzeHook(
  content: string,
  lineOffset = 0,
) {
  const ast = babelParse(content, { sourceType: 'module', plugins: [
    'typescript',
    'jsx',
  ] });

  const results: HookAnalysisResult[] = [];

  function walkCallExpressionChain(
    node: t.Expression,
    path: NodePath<t.VariableDeclarator>,
    pathSegments: (string | number)[],
  ): NodePath<t.ArrowFunctionExpression | t.FunctionExpression> | undefined {
    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
      try {
        return path.get(pathSegments.join('.')) as any;
      }
      catch {
        return undefined;
      }
    }
    if (node.type === 'CallExpression') {
      for (let i = 0; i < node.arguments.length; i++) {
        const arg = node.arguments[i];
        if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
          try {
            return path.get([...pathSegments, 'arguments', i].join('.')) as any;
          }
          catch {
          }
        }
        else if (arg.type === 'CallExpression') {
          const result = walkCallExpressionChain(arg, path, [...pathSegments, 'arguments', i]);
          if (result) {
            return result;
          }
        }
      }
    }
    return undefined;
  }

  function extractHookFromDeclarator(decl: t.VariableDeclarator, varPath: NodePath<t.VariableDeclarator>) {
    const init = decl.init;
    const hookName = decl.id.type === 'Identifier'
      ? decl.id.name
      : '';
    if (!init) {
      return;
    }

    const funcPath = walkCallExpressionChain(init, varPath, ['init']);
    if (funcPath) {
      results.push(processHookFunction(funcPath, lineOffset, hookName));
    }
  }

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const declaration = path.node.declaration;
      if (declaration.type === 'FunctionDeclaration' && declaration.id?.name.startsWith('use')) {
        const funcPath = path.get('declaration') as NodePath<t.FunctionDeclaration>;
        results.push(processHookFunction(funcPath, lineOffset));
      }
    },
    ExportNamedDeclaration(path) {
      const declaration = path.node.declaration;
      if (declaration?.type === 'FunctionDeclaration' && declaration.id?.name.startsWith('use')) {
        const funcPath = path.get('declaration') as NodePath<t.FunctionDeclaration>;
        results.push(processHookFunction(funcPath, lineOffset));
      }
      else if (declaration?.type === 'VariableDeclaration') {
        declaration.declarations.forEach((decl) => {
          if (decl.id.type === 'Identifier' && decl.id.name.startsWith('use')) {
            const varPath = path.get('declaration.declarations').find((p) => {
              const node = p.node as t.VariableDeclarator;
              const nodeId = node.id as t.Identifier;
              return nodeId.type === 'Identifier' && nodeId.name === (decl.id as t.Identifier).name;
            }) as NodePath<t.VariableDeclarator> | undefined;
            if (varPath) {
              extractHookFromDeclarator(decl, varPath);
            }
          }
        });
      }
    },
    FunctionDeclaration(path) {
      if (path.node.id?.name.startsWith('use') && path.parent.type === 'Program') {
        results.push(processHookFunction(path, lineOffset));
      }
    },
    VariableDeclaration(path) {
      if (path.parent.type === 'Program') {
        path.node.declarations.forEach((decl) => {
          if (decl.id.type === 'Identifier' && decl.id.name.startsWith('use')) {
            const declName = (decl.id as t.Identifier).name;
            const varPath = path.get('declarations').find((p) => {
              const node = p.node as t.VariableDeclarator;
              const nodeId = node.id as t.Identifier;
              return nodeId.type === 'Identifier' && nodeId.name === declName;
            }) as NodePath<t.VariableDeclarator> | undefined;
            if (varPath) {
              extractHookFromDeclarator(decl, varPath);
            }
          }
        });
      }
    },
  });

  return results.map(result => ({
    graph: result.nodeCollection.map(result.graph),
    nodesUsedInReturn: result.nodesUsedInReturn,
    hookName: result.hookName,
  }));
}
