import { NodeType, TypedNode } from '@/analyze/utils';

const edges = new Map<TypedNode, Set<TypedNode>>();

const number: TypedNode = {label: 'number', type: NodeType.var, info: {line: 65, column: 6}};
const count: TypedNode = {label: 'count', type: NodeType.var, info: {line: 67, column: 10}};
const plus: TypedNode = {label: 'plus', type: NodeType.fun, info: {line: 70, column: 6}};
const add: TypedNode = {label: 'add', type: NodeType.fun, info: {line: 74, column: 6}};
const a: TypedNode = {label: 'a', type: NodeType.var, info: {line: 81, column: 10}};
const b: TypedNode = {label: 'b', type: NodeType.var, info: {line: 82, column: 10}};
const c: TypedNode = {label: 'c', type: NodeType.var, info: {line: 87, column: 6}};

edges.set(number, new Set([]));
edges.set(b, new Set([count]));
edges.set(c, new Set([count]));
edges.set(count, new Set([]));
edges.set(plus, new Set([plus]));
edges.set(add, new Set([number, add, count]));
// edges.set(a, new Set([count]));

export const graph = {
  nodes: new Set([number, b, count, c, plus, add]),
  edges,
};
