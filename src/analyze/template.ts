import { babelParse, compileTemplate } from '@vue/compiler-sfc';
import _traverse from '@babel/traverse';

const traverse: typeof _traverse
  // @ts-expect-error unwarp default
  = _traverse.default?.default || _traverse.default || _traverse;

export function analyze(
  content: string,
) {
  const id = 'template';
  const { code } = compileTemplate({
    id,
    source: content,
    filename: `${id}.js`,
  });

  // console.log(code);
  const ast = babelParse(code, { sourceType: 'module', plugins: [
    'typescript',
  ] });

  // ----

  const nodes = new Set<string>();

  traverse(ast, {
    MemberExpression(path) {
      if (path.type === 'MemberExpression') {
        if (path.node.object && path.node.object.type === 'Identifier' && path.node.object.name === '_ctx') {
          if (path.node.property && path.node.property.type === 'Identifier') {
            nodes.add(path.node.property.name);
          }
        }
      }
    },
    ObjectProperty(path) {
      if (path.node.key.type === 'Identifier' && path.node.key.name === 'ref') {
        if (path.node.value.type === 'StringLiteral') {
          const name = path.node.value.value;
          name && nodes.add(name);
        }
      }
    },
    // component
    CallExpression(path) {
      if (path.node.callee.type === 'Identifier' && path.node.callee.name === '_resolveComponent') {
        if (path.node.arguments[0].type === 'StringLiteral') {
          const name = path.node.arguments[0].value;
          name && nodes.add(name);
        }
      }
    },
  });

  return nodes;
}
