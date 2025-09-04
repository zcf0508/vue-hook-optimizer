import type { RelationType, TypedNode } from './analyze/utils';

interface MermaidOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL'
}

export function getMermaidText(
  graph: {
    nodes: Set<TypedNode>
    edges: Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>
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

  graph.edges.forEach((edge, key) => {
    edge.forEach((to) => {
      if (!to || !to.node.label) {
        return;
      }
      mermaidText += `    ${key.label} --> ${to.node.label}\n`;
    });
  });

  return mermaidText;
}
