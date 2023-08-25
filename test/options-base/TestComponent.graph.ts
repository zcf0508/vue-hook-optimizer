const edges = new Map<string, Set<string>>();

edges.set('number', new Set([]));
edges.set('count', new Set([]));
edges.set('plus', new Set([]));
edges.set('add', new Set(['number']));

export const graph = {
  nodes: new Set(['number', 'count', 'plus', 'add']),
  edges,
};