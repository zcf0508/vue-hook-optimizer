import type { TypedNode } from '@/analyze/utils';
import { NodeType } from '@/analyze/utils';

const edges = new Map<TypedNode, Set<TypedNode>>();

const number: TypedNode = { label: 'number', type: NodeType.var, info: { line: 65, column: 8 } };
const count: TypedNode = { label: 'count', type: NodeType.var, info: { line: 69, column: 6, used: new Set(['watch', 'created']) } };
const plus: TypedNode = { label: 'plus', type: NodeType.fun, info: { line: 74, column: 6 } };
const add: TypedNode = { label: 'add', type: NodeType.fun, info: { line: 78, column: 6 } };

edges.set(number, new Set([]));
edges.set(count, new Set([number]));
edges.set(plus, new Set([plus]));
edges.set(add, new Set([number, add]));

export const graph = {
  nodes: new Set([number, count, plus, add]),
  edges,
};
