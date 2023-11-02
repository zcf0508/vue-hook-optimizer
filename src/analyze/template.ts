import { v4 as uuid } from 'uuid';
import { compileTemplate } from '@vue/compiler-sfc';
import * as acorn from 'acorn';
import { simple as simpleWalk } from 'acorn-walk';

export function analyze(
  content: string
) {
  const id = uuid();
  const { code } = compileTemplate({
    id: id,
    source: content,
    filename: `${id}.js`,
  });

  const ast = acorn.parse(code, { sourceType: 'module', ecmaVersion: 'latest' });

  const nodes = new Set<string>();

  simpleWalk(ast, {
    MemberExpression(node) {
      if(node.type === 'MemberExpression') {
        if(node.object && node.object.type === 'Identifier' && node.object.name === '_ctx') {
          if(node.property && node.property.type === 'Identifier') {
            nodes.add(node.property.name);
          }
        }
      }
    },
    Property(node) {
      if(node.type === 'Property') {
        if(node.key.type === 'Identifier' && node.key.name === 'ref') {
          if(node.value.type === 'Literal') {
            const name = node.value.value; 
            name && nodes.add(`${name}`);
          }
        }
      }
    },
    CallExpression(node) {
      if(node.type === 'CallExpression') {
        if(node.callee.type === 'Identifier' && node.callee.name === '_resolveComponent') {
          if(node.arguments[0].type === 'Literal') {
            const name = node.arguments[0].value; 
            name && nodes.add(`${name}`);
          }
        }
      }
    },
  });

  return nodes;
}
