import type { Data } from 'vis-network';
import { TypedNode } from './analyze/utils';

export function getVisData(
  graph: {
    nodes: Set<TypedNode>;
    edges: Map<TypedNode, Set<TypedNode>>;
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
