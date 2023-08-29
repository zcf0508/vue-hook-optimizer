import { NodeType } from '@/analyze/utils';

const edges = new Map<{label: string, type: NodeType}, Set<{label: string, type: NodeType}>>();

const number = {label: 'number', type: NodeType.var};
const count = {label: 'count', type: NodeType.var};
const double = {label: 'double', type: NodeType.var};
const plus = {label: 'plus', type: NodeType.fun};
const add = {label: 'add', type: NodeType.fun};

edges.set(number, new Set([]));
edges.set(count, new Set([number]));
edges.set(double, new Set([number]));
edges.set(plus, new Set([]));
edges.set(add, new Set([number]));

export const graph = {
  nodes: new Set([number, count, double, plus, add]),
  edges,
};