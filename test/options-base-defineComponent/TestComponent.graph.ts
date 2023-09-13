import { NodeType, TypedNode } from '@/analyze/utils';

const edges = new Map<TypedNode, Set<TypedNode>>();

const number: TypedNode = {label: 'number', type: NodeType.var, info: {line: 65, column: 8}};
const count: TypedNode = {label: 'count', type: NodeType.var, info:{line: 69, column: 6}};
const double: TypedNode = {label: 'double', type: NodeType.var, info:{line: 72, column: 6}};
const plus: TypedNode = {label: 'plus', type: NodeType.fun, info: {line: 82, column: 6}};
const add: TypedNode = {label: 'add', type: NodeType.fun, info: {line: 86, column: 6}};

edges.set(number, new Set([]));
edges.set(count, new Set([number]));
edges.set(double, new Set([number]));
edges.set(plus, new Set([add]));
edges.set(add, new Set([number, plus]));

export const graph = {
  nodes: new Set([number, count, double, plus, add]),
  edges,
};
