import { NodeType, TypedNode } from '@/analyze/utils';
import { splitGraph } from '@/suggest/split';


describe('suggest tests', () => {
  it('split graph 1', () => {
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
    graph.set(node1, new Set([node1]));
    graph.set(node1, new Set([node2]));
    graph.set(node2, new Set([node1, node3]));
    graph.set(node3, new Set([node4]));

    expect(splitGraph(graph)).toEqual([graph]);
  });
  it('split graph 2', () => {
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
    graph.set(node1, new Set([]));
    graph.set(node2, new Set([]));
    graph.set(node3, new Set([]));

    expect(splitGraph(graph)).toEqual([
      new Map([[node1, new Set()]]),
      new Map([[node2, new Set()]]),
      new Map([[node3, new Set()]]),
    ]);
  });
  it('split graph 3', () => {
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
    graph.set(node1, new Set([node2, node4]));
    graph.set(node2, new Set([node4]));
    graph.set(node3, new Set([]));

    expect(splitGraph(graph)).toEqual([
      new Map([[node3, new Set()]]),
      new Map([
        [node1, new Set([node2, node4])],
        [node2, new Set([node4])],
      ]),
    ]);
  });
  it('split graph 4', () => {
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
    graph.set(node1, new Set([node2, node4]));
    graph.set(node2, new Set([node1]));
    graph.set(node3, new Set([]));

    expect(splitGraph(graph)).toEqual([
      new Map([[node3, new Set()]]),
      new Map([
        [node1, new Set([node2, node4])],
        [node2, new Set([node1])],
      ]),
    ]);
  });
  it('split graph 5', () => {
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
    graph.set(node1, new Set([node4]));
    graph.set(node2, new Set([node4]));
    graph.set(node3, new Set([node4]));

    expect(splitGraph(graph)).toEqual([graph]);
  });
});