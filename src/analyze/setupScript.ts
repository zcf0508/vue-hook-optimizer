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
    VariableDeclaration(path){
      path.node.declarations.forEach((declaration) => {
        if(declaration.id?.type === 'Identifier') {
          const name = declaration.id.name;
          const binding = path.scope.getBinding(name);
          if(
            binding 
            && path.parent.type === 'Program'
            && !(declaration.init?.type === 'CallExpression'
              && declaration.init?.callee.type === 'Identifier'
              && ['defineProps', 'defineEmits'].includes(declaration.init?.callee.name)
            )
          ) {
            graph.nodes.add(name);
            if(!graph.edges.get(name)) {
              graph.edges.set(name, new Set());
            }
          }
        }
      });
    },
    FunctionDeclaration(path) {
      const name = path.node.id?.name;
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

  // get the relation between the variable and the function

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
