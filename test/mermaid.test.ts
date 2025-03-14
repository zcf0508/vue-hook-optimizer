import type { TypedNode } from '@/analyze/utils';
import { NodeType } from '@/analyze/utils';
import { getMermaidText } from '@/mermaid';

describe('getMermaidText', () => {
  it('应该生成正确的 Mermaid 流程图文本', () => {
    const node1: TypedNode = {
      label: 'count',
      type: NodeType.var,
      info: { used: new Set() },
    };
    const node2: TypedNode = {
      label: 'increment',
      type: NodeType.fun,
      info: { used: new Set() },
    };

    const nodes: Set<TypedNode> = new Set([node1, node2]);
    const edges: Map<TypedNode, Set<TypedNode>> = new Map();
    edges.set(node2, new Set([node1]));

    const nodesUsedInTemplate: Set<string> = new Set(['count']);
    const nodesUsedInStyle: Set<string> = new Set();

    const result: string = getMermaidText(
      { nodes, edges },
      nodesUsedInTemplate,
      nodesUsedInStyle,
      { direction: 'LR' },
    );

    const expected: string = [
      'flowchart LR',
      '    count((count))',
      '    style count fill:#e1f5fe',
      '    increment{increment}',
      '    increment --> count',
      '',
    ].join('\n');

    expect(result).toBe(expected);
  });
});
