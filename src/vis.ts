import type { Data, Edge, Node } from 'vis-network';
import type { TypedNode } from './analyze/utils';

type CustomNode = Node & {
  info: TypedNode['info']
};

function filterNodeUserd(used: Set<string> | undefined) {
  const usedArray = Array.from(used || []);
  return new Set(usedArray.filter(u => ![
    'Assignment Expression',
    'Call Expression',
  ].includes(u)));
}

export function getVisData(
  graph: {
    nodes: Set<TypedNode>
    edges: Map<TypedNode, Set<{ node: TypedNode, type: 'get' | 'set' }>>
  },
  nodesUsedInTemplate: Set<string>,
  nodesUsedInStyle: Set<string> = new Set(),
) {
  const usedNodes = new Set([...nodesUsedInTemplate, ...nodesUsedInStyle]);

  const nodes: CustomNode[] = [];
  const edges: Edge[] = [];

  const inDegreeMap: Record<string, number> = {};
  const outDegreeMap: Record<string, number> = {};
  graph.edges.forEach((edge) => {
    edge.forEach((to) => {
      if (to) {
        inDegreeMap[to.node.label] = (inDegreeMap[to.node.label] || 0) + 1;
      }
    });
  });
  graph.edges.forEach((edge, key) => {
    outDegreeMap[key.label] = edge.size;
  });

  graph.nodes.forEach((node) => {
    const inDegree = inDegreeMap[node.label] || 0;
    const outDegree = outDegreeMap[node.label] || 0;

    nodes.push({
      id: node.label,
      label: node.label,
      shape: node.type === 'var'
        ? 'dot'
        : 'diamond',
      group: usedNodes.has(node.label) || node.info?.used?.size
        ? 'used'
        : 'normal',
      size: 20 + 1.6 ** ((inDegree * 0.75 + outDegree * 0.25)),
      title: `${
        filterNodeUserd(node.info?.used).size
          ? `used by ${Array.from(filterNodeUserd(node.info?.used))?.map(i => `\`${i}\``).join(',')}\n\n`
          : ''
      }${
        usedNodes.has(node.label)
          ? `used in ${
            [
              nodesUsedInStyle.has(node.label)
                ? 'style'
                : '',
              nodesUsedInTemplate.has(node.label)
                ? 'template'
                : '',
            ].filter(Boolean).join(' and ')
          }\n\n`
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
        to: to.node.label,
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
