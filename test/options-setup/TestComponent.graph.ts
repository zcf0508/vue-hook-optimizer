import { NodeType } from '@/analyze/utils';

const edges = new Map<{label: string, type: NodeType}, Set<{label: string, type: NodeType}>>();

const data = {label: 'data', type: NodeType.var};
const count = {label: 'count', type: NodeType.var};
const plus = {label: 'plus', type: NodeType.fun};
const add = {label: 'add', type: NodeType.fun};

edges.set(data, new Set([]));
edges.set(count, new Set([]));
edges.set(plus, new Set([]));
edges.set(add, new Set([data]));

export const graph = {
  nodes: new Set([data, count, plus, add]),
  edges,
};