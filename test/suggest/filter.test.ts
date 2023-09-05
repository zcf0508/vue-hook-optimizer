import { NodeType, TypedNode } from '@/analyze/utils';
import { noIndegreeFilter } from '@/suggest/filter';

describe('suggest tests', () => {
  it('graph filter noIndegree 1', () => {
    const graph = new Map<TypedNode, Set<TypedNode>>();
    const node1: TypedNode = {
      label: 'node1',
      type: NodeType.var,
    };
    const node2: TypedNode = {
      label: 'node2',
      type: NodeType.fun,
    };
    const node3: TypedNode = {
      label: 'node3',
      type: NodeType.fun,
    };
    const node4: TypedNode = {
      label: 'node4',
      type: NodeType.fun,
    };
    graph.set(node1, new Set([node2]));
    graph.set(node2, new Set([node1, node3]));
    graph.set(node3, new Set([node4]));

    expect(noIndegreeFilter(graph)).toEqual([]);
  });
  it('graph filter noIndegree 2', () => {
    const graph = new Map<TypedNode, Set<TypedNode>>();
    const node1: TypedNode = {
      label: 'node1',
      type: NodeType.var,
    };
    const node2: TypedNode = {
      label: 'node2',
      type: NodeType.fun,
    };
    const node3: TypedNode = {
      label: 'node3',
      type: NodeType.fun,
    };
    const node4: TypedNode = {
      label: 'node4',
      type: NodeType.fun,
    };
    graph.set(node1, new Set([node2]));
    graph.set(node2, new Set([node1]));
    graph.set(node3, new Set([node4]));

    expect(noIndegreeFilter(graph)).toEqual([node3]);
  });
});