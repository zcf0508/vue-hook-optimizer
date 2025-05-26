import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { isWritingNode } from '../src/analyze/utils';

function findIdentifierPath(code: string, name: string) {
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });
  let found: NodePath<t.Identifier> | null = null;
  traverse(ast, {
    Identifier(path) {
      if (path.node.name === name) {
        found = path;
        path.stop();
      }
    },
  });
  return found!;
}

describe('isWritingNode', () => {
  it('should return true for identifier in left side of assignment', () => {
    const path = findIdentifierPath('obj.a.b.c = 3;', 'obj');
    expect(isWritingNode(path)).toBe(true);
  });

  it('should return false for identifier in right side of assignment', () => {
    const path = findIdentifierPath('a = b;', 'b');
    expect(isWritingNode(path)).toBe(false);
  });

  it('should return true for identifier in update expression argument', () => {
    const path = findIdentifierPath('++count;', 'count');
    expect(isWritingNode(path)).toBe(true);
  });

  it('should return true for identifier in update expression argument 2', () => {
    const path = findIdentifierPath('count++', 'count');
    expect(isWritingNode(path)).toBe(true);
  });

  it('should return false for identifier not in writing context', () => {
    const path = findIdentifierPath('const y = z;', 'z');
    expect(isWritingNode(path)).toBe(false);
  });
});
