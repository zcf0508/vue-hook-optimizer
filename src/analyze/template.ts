import { v4 as uuid } from 'uuid';
import { compileTemplate, babelParse } from '@vue/compiler-sfc';
import traverse from '@babel/traverse';

export function analyze(
  content: string
) {
  const id = uuid();
  const { code } = compileTemplate({
    id: id,
    source: content,
    filename: `${id}.js`,
  });

  // console.log(code);
  const ast = babelParse(code, { sourceType: 'module',
    plugins: [
      'typescript',
    ],
  });

  // ----

  const nodes = new Set<string>();
  
  traverse(ast, {
    MemberExpression(path) {
      if(path.type === 'MemberExpression') {
        if(path.node.object && path.node.object.type === 'Identifier' && path.node.object.name === '_ctx') {
          if(path.node.property && path.node.property.type === 'Identifier') {
            nodes.add(path.node.property.name);
          }
        }
      }
    },
    VariableDeclarator(path) {
      if(path.node.init) {
        if(path.node.init.type === 'ObjectExpression') {
          path.node.init.properties.forEach((property) => {
            if(property.type === 'ObjectProperty') {
              if(property.key.type === 'Identifier' && property.key.name === 'ref') {
                // @ts-ignore
                nodes.add(property.value.value);
              }
            }
          });
        }
      }
    },
  });

  return nodes;
}
