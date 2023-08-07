import { babelParse } from '@vue/compiler-sfc';
import traverse from '@babel/traverse';

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
    Identifier(path) {
      const name = path.node.name;
      const scopeParent = path.scope.parent;
      const binding = path.scope.getBinding(name);

      if (binding) {
        if (!scopeParent && ['const', 'let', 'var'].includes(binding.kind)) {
          graph.nodes.add(name);
          if(!graph.edges.get(name)) {
            graph.edges.set(name, new Set());
          }
        }
      }
    },
    FunctionDeclaration(path) {
      const name = path.node.id?.name
      if(name) {
        const binding = path.scope.getBinding(name);
        if(binding && path.parent.type === 'Program') {
          graph.nodes.add(name);
          if(!graph.edges.get(name)) {
            graph.edges.set(name, new Set());
          }
        }
      }
    },
  });

  traverse(ast, {
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
      if(name && graph.nodes.has(name)) {
        path.traverse({
          Identifier(path) {
            if(graph.nodes.has(path.node.name) && path.node.name !== name) {
              graph.edges.get(name)?.add(path.node.name);
            }
          },
        });
      }
    },

    // get the relation between the variable and the function
    VariableDeclarator(path) {
      if(path.node.init) {
        if(['CallExpression', 'ArrowFunctionExpression', 'FunctionDeclaration'].includes(path.node.init.type)) {
          //  @ts-ignore
          const name = path.node.id?.name;
          if(name && graph.nodes.has(name)) {
            path.traverse({
              Identifier(path) {
                if(graph.nodes.has(path.node.name) && path.node.name !== name) {
                  graph.edges.get(name)?.add(path.node.name);
                }
              },
            });
          }
        }
      }
    },

  });

  return graph;
}
