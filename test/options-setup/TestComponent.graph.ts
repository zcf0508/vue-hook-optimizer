import { NodeType, TypedNode } from '@/analyze/utils';

const edges = new Map<TypedNode, Set<TypedNode>>();

const number: TypedNode = {label: 'number', type: NodeType.var, info: {line: 66, column: 6}};
const count: TypedNode = {label: 'count', type: NodeType.var, info: {line: 68, column: 10}};
const plus: TypedNode = {label: 'plus', type: NodeType.fun, info: {line: 71, column: 6}};
const add: TypedNode = {label: 'add', type: NodeType.fun, info: {line: 75, column: 6}};
// const a: TypedNode = {label: 'a', type: NodeType.var, info: {line: 82, column: 10}};
const b: TypedNode = {label: 'b', type: NodeType.var, info: {line: 83, column: 10}};
const c: TypedNode = {label: 'c', type: NodeType.var, info: {line: 91, column: 6}};
const ComponentD: TypedNode = { label: 'ComponentD', type: NodeType.var, info: {line: 84, column: 10}};
const msgRef: TypedNode = { label: 'msgRef', type: NodeType.var, info: {line: 86, column: 10}};

edges.set(number, new Set([]));
edges.set(b, new Set([count]));
edges.set(c, new Set([count]));
edges.set(count, new Set([]));
edges.set(plus, new Set([plus]));
edges.set(add, new Set([number, add, count]));
edges.set(ComponentD, new Set([]));
// edges.set(a, new Set([count]));
edges.set(msgRef, new Set([]));

export const graph = {
  nodes: new Set([number, b, count, c, plus, add, ComponentD, msgRef]),
  edges,
};
