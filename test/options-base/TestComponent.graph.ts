import { NodeType, TypedNode } from '@/analyze/utils';

const edges = new Map<TypedNode, Set<TypedNode>>();

const number: TypedNode = {label: 'number', type: NodeType.var, info: {line: 65, column: 8}};
const count: TypedNode = {label: 'count', type: NodeType.var, info: {line: 69, column: 6}};
const plus: TypedNode = {label: 'plus', type: NodeType.fun, info: {line: 74, column: 6}};
const add: TypedNode = {label: 'add', type: NodeType.fun, info: {line: 77, column: 6}};

edges.set(number, new Set([]));
edges.set(count, new Set([]));
edges.set(plus, new Set([]));
edges.set(add, new Set([number]));

export const graph = {
  nodes: new Set([number, count, plus, add]),
  edges,
};
