import type { TypedNode } from '@/analyze/utils';
import { NodeType } from '@/analyze/utils';
import { splitGraph } from '@/suggest/split';

describe('suggest tests', () => {
  it('split graph 1', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: 'get' | 'set' }>>();
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
    graph.set(node1, new Set([{ node: node1, type: 'get' }]));
    graph.set(node1, new Set([{ node: node2, type: 'get' }]));
    graph.set(node2, new Set([{ node: node1, type: 'get' }, { node: node3, type: 'get' }]));
    graph.set(node3, new Set([{ node: node4, type: 'get' }]));

    expect(splitGraph(graph)).toEqual([graph]);
  });
  it('split graph 2', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: 'get' | 'set' }>>();
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
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: 'get' | 'set' }>>();
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
    graph.set(node1, new Set([{ node: node2, type: 'get' }, { node: node4, type: 'get' }]));
    graph.set(node2, new Set([{ node: node4, type: 'get' }]));
    graph.set(node3, new Set([]));

    expect(splitGraph(graph)).toEqual([
      new Map([[node3, new Set()]]),
      new Map([
        [node1, new Set([{ node: node2, type: 'get' }, { node: node4, type: 'get' }])],
        [node2, new Set([{ node: node4, type: 'get' }])],
      ]),
    ]);
  });
  it('split graph 4', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: 'get' | 'set' }>>();
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
    graph.set(node1, new Set([{ node: node2, type: 'get' }, { node: node4, type: 'get' }]));
    graph.set(node2, new Set([{ node: node1, type: 'get' }]));
    graph.set(node3, new Set([]));

    expect(splitGraph(graph)).toEqual([
      new Map([[node3, new Set()]]),
      new Map([
        [node1, new Set([{ node: node2, type: 'get' }, { node: node4, type: 'get' }])],
        [node2, new Set([{ node: node1, type: 'get' }])],
      ]),
    ]);
  });
  it('split graph 5', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: 'get' | 'set' }>>();
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
    graph.set(node1, new Set([{ node: node4, type: 'get' }]));
    graph.set(node2, new Set([{ node: node4, type: 'get' }]));
    graph.set(node3, new Set([{ node: node4, type: 'get' }]));

    expect(splitGraph(graph)).toEqual([graph]);
  });
});
