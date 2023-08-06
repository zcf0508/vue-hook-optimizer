import type { Data } from 'vis-network';

export function getVisData(
  graph: {
    nodes: Set<string>;
    edges: Map<string, Set<string>>;
  },
  usedNodes: Set<string>
) {
  const nodes: Data['nodes'] = [];
  const edges: Data['edges'] = [];

  graph.nodes.forEach((node) => {
    nodes.push({
      id: node,
      label: node,
      group: usedNodes.has(node) ? 'used' : 'normal',
    });
  });

  graph.edges.forEach((edge, key) => {
    edge.forEach((to) => {
      edges.push({
        from: key,
        to: to,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8,
          },
        },
      });
    });
  });

  return {
    nodes,
    edges,
  };
}
