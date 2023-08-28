const edges = new Map<string, Set<string>>();

edges.set('route', new Set([]));
edges.set('path', new Set(['route']));
edges.set('lmsg', new Set([]));
edges.set('data', new Set([]));
edges.set('age', new Set([]));
edges.set('addAge', new Set(['age']));
edges.set('updateName', new Set(['data']));
edges.set('funA', new Set([]));
edges.set('varB', new Set(['funA']));

export const graph = {
  nodes: new Set(['route', 'path', 'lmsg', 'data', 'age', 'addAge', 'updateName', 'funA', 'varB']),
  edges,
};