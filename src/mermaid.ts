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

  let mermaidText: string = `flowchart ${direction}
    %% Legend:
    %% () = variable node
    %% [] = function node
    %% * suffix = unused in template/style
    %% A --> B means A depends on B\n`;

  graph.nodes.forEach((node: TypedNode) => {
    const shape: string = node.type === 'var'
      ? '('
      : '[';
    const closeShape: string = node.type === 'var'
      ? ')'
      : ']';
    const unusedSuffix: string = !(usedNodes.has(node.label) || node.info?.used?.size)
      ? '*'
      : '';
    mermaidText += `    ${node.label}${shape}${node.label}${unusedSuffix}${closeShape}\n`;
  });

  graph.edges.forEach((edge: Set<TypedNode>, key: TypedNode) => {
    edge.forEach((to: TypedNode | undefined) => {
      if (!to) { return; }
      mermaidText += `    ${key.label} --> ${to.label}\n`;
    });
  });

  return mermaidText;
}
