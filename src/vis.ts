import type { Data } from 'vis-network';

export function getVisData(
  graph: {
    nodes: Set<{
      label: string;
      type: string;
  }>;
    edges: Map<{
      label: string;
      type: string;
  }, Set<{
      label: string;
      type: string;
  }>>;
  },
  usedNodes: Set<string>
) {
  const nodes: Data['nodes'] = [];
  const edges: Data['edges'] = [];

  graph.nodes.forEach((node) => {
    nodes.push({
      id: node.label,
      label: node.label,
      shape: node.type === 'var' ? 'dot' : 'diamond',
      group: usedNodes.has(node.label) ? 'used' : 'normal',
    });
  });

  graph.edges.forEach((edge, key) => {
    edge.forEach((to) => {
      if(!to) return;
      edges.push({
        from: key.label,
        to: to.label,
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
