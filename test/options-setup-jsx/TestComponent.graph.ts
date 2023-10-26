import { NodeType, TypedNode } from '@/analyze/utils';

const edges = new Map<TypedNode, Set<TypedNode>>();

const data: TypedNode = {label: 'data', type: NodeType.var, info: {line: 10, column: 10}};
const count: TypedNode = {label: 'count', type: NodeType.var, info: {line: 13, column: 10}};
const methods: TypedNode = {label: 'methods', type: NodeType.var, info: {line: 15, column: 10}};

const a: TypedNode = {label: 'a', type: NodeType.var, info: {line: 27, column: 10}};
const b: TypedNode = {label: 'b', type: NodeType.var, info: {line: 28, column: 10}};
const ComponentD: TypedNode = { label: 'ComponentD', type: NodeType.fun, info: {line: 29, column: 10}};
const msgRef: TypedNode = { label: 'msgRef', type: NodeType.var, info: {line: 31, column: 10}};

edges.set(data, new Set([]));
edges.set(count, new Set([]));
edges.set(methods, new Set([methods, data, count]));
edges.set(a, new Set([count]));
edges.set(b, new Set([count]));
edges.set(ComponentD, new Set([]));
// edges.set(a, new Set([count]));
edges.set(msgRef, new Set([]));

export const graph = {
  nodes: new Set([data, count, methods, a, b, ComponentD, msgRef]),
  edges,
};
