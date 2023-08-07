const edges = new Map<string, Set<string>>();

edges.set('props', new Set([]));
edges.set('data', new Set([]));
edges.set('count', new Set([]));
edges.set('plus', new Set([]));
edges.set('add', new Set(['data']));

export const graph = {
  nodes: new Set(['props', 'data', 'count', 'plus', 'add']),
  edges,
};