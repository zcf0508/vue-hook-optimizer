const edges = new Map<string, Set<string>>();

edges.set('number', new Set([]));
edges.set('count', new Set(['number']));
edges.set('double', new Set(['number']));
edges.set('plus', new Set([]));
edges.set('add', new Set(['number']));

export const graph = {
  nodes: new Set(['number', 'count', 'double', 'plus', 'add']),
  edges,
};