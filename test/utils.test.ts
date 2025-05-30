import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { isCallingNode, isWritingNode } from '../src/analyze/utils';

function findIdentifierPath(code: string, name: string) {
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });
  const found: NodePath<t.Identifier>[] = [];
  traverse(ast, {
    Identifier(path) {
      if (path.node.name === name) {
        found.push(path);
        // path.stop();
      }
    },
  });
  return found;
}

describe('isWritingNode', () => {
  it('should return true for identifier in left side of assignment', () => {
    const path = findIdentifierPath('obj.a.b.c = 3;', 'obj');
    expect(isWritingNode(path[0])).toBe(true);
  });

  it('should return false for identifier in right side of assignment', () => {
    const path = findIdentifierPath('a = b;', 'b');
    expect(isWritingNode(path[0])).toBe(false);
  });

  it('should return true for identifier in update expression argument', () => {
    const path = findIdentifierPath('++count;', 'count');
    expect(isWritingNode(path[0])).toBe(true);
  });

  it('should return true for identifier in update expression argument 2', () => {
    const path = findIdentifierPath('count++', 'count');
    expect(isWritingNode(path[0])).toBe(true);
  });

  it('should return false for identifier not in writing context', () => {
    const path = findIdentifierPath('const y = z;', 'z');
    expect(isWritingNode(path[0])).toBe(false);
  });
});

describe('isCallingNode', () => {
  it('should return true for identifier in call expression argument', () => {
    const path = findIdentifierPath(`const test = () => {
  console.log(test())
}`, 'test');
    expect(isCallingNode(path[1])).toBe(true);
  });
});
