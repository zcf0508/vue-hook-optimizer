import type { Data, Edge, Node } from 'vis-network';
import type { TypedNode } from './analyze/utils';

type CustomNode = Node & {
  info: TypedNode['info']
};

export function getVisData(
  graph: {
    nodes: Set<TypedNode>
    edges: Map<TypedNode, Set<TypedNode>>
  },
  usedNodes: Set<string>,
) {
  const nodes: CustomNode[] = [];
  const edges: Edge[] = [];

  graph.nodes.forEach((node) => {
    nodes.push({
      id: node.label,
      label: node.label,
      shape: node.type === 'var'
        ? 'dot'
        : 'diamond',
      group: usedNodes.has(node.label) || node.info?.used?.size
        ? 'used'
        : 'normal',
      title: `${
        node.info?.used?.size
          ? `used by ${Array.from(node.info?.used || [])?.map(i => `\`${i}\``).join(',')}\n\n`
          : ''
      }${
        usedNodes.has(node.label)
          ? 'used in template\n\n'
          : ''
      }${node.info?.comment || ''}`.trim() || undefined,
      info: node.info,
    });
  });

  graph.edges.forEach((edge, key) => {
    edge.forEach((to) => {
      if (!to) {
        return;
      }
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
