import type { TypedNode } from './analyze/utils';

interface MermaidOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL'
}

export function getMermaidText(
  graph: {
    nodes: Set<TypedNode>
    edges: Map<TypedNode, Set<TypedNode>>
  },
  nodesUsedInTemplate: Set<string>,
  nodesUsedInStyle: Set<string> = new Set(),
  options: MermaidOptions = {},
): string {
  const direction: 'TB' | 'BT' | 'LR' | 'RL' = options.direction || 'TB';
  const usedNodes: Set<string> = new Set([...nodesUsedInTemplate, ...nodesUsedInStyle]);

  let mermaidText: string = `flowchart ${direction}\n`;

  graph.nodes.forEach((node: TypedNode) => {
    const shape: string = node.type === 'var'
      ? `((${node.label}))`
      : `{${node.label}}`;
    const style: string = usedNodes.has(node.label) || node.info?.used?.size
      ? `style ${node.label} fill:#e1f5fe`
      : '';

    mermaidText += `    ${node.label}${shape}\n`;
    if (style) {
      mermaidText += `    ${style}\n`;
    }
  });

  graph.edges.forEach((edge: Set<TypedNode>, key: TypedNode) => {
    edge.forEach((to: TypedNode | undefined) => {
      if (!to) {
        return;
      }
      mermaidText += `    ${key.label} --> ${to.label}\n`;
    });
  });

  return mermaidText;
}
