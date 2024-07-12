import type { TypedNode } from '@/analyze/utils';
import { NodeType } from '@/analyze/utils';
import {
  findArticulationPoints,
  findLinearPaths,
  noIndegreeFilter,
  noOutdegreeFilter,
  onlyFunctions,
} from '@/suggest/filter';

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
    graph.set(node1, new Set([node1]));
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
  it('graph filter noOutdegree 1', () => {
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
    graph.set(node4, new Set([]));

    expect(noOutdegreeFilter(graph)).toEqual([node4]);
  });
  it('graph filter noOutdegree 2', () => {
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
    graph.set(node4, new Set([]));

    expect(noOutdegreeFilter(graph)).toEqual([node4]);
  });
  it('graph filter onlyFunctions 1', () => {
    const graph = new Map<TypedNode, Set<TypedNode>>();
    const node1: TypedNode = {
      label: 'node1',
      type: NodeType.fun,
    };
    const node2: TypedNode = {
      label: 'node2',
      type: NodeType.var,
    };
    const node3: TypedNode = {
      label: 'node3',
      type: NodeType.fun,
    };
    const node4: TypedNode = {
      label: 'node4',
      type: NodeType.fun,
    };
    const node5: TypedNode = {
      label: 'node5',
      type: NodeType.fun,
    };
    graph.set(node1, new Set([node1]));
    graph.set(node1, new Set([node2, node5]));
    graph.set(node2, new Set([node3, node4]));

    expect(onlyFunctions(graph)).toEqual(new Map([
      [node1, new Set([node3, node4, node5])],
    ]));
  });
  it('graph filter onlyFunctions 2', () => {
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
    const node5: TypedNode = {
      label: 'node5',
      type: NodeType.fun,
    };
    graph.set(node2, new Set([node1, node5]));
    graph.set(node1, new Set([node3, node4]));

    expect(onlyFunctions(graph)).toEqual(new Map([
      [node2, new Set([node3, node4, node5])],
    ]));
  });
  it('graph linear paths 1', () => {
    const graph = new Map<TypedNode, Set<TypedNode>>();
    const node1: TypedNode = {
      label: 'node1',
      type: NodeType.var,
    };
    const node2: TypedNode = {
      label: 'node2',
      type: NodeType.var,
    };
    const node3: TypedNode = {
      label: 'node3',
      type: NodeType.var,
    };
    const node4: TypedNode = {
      label: 'node4',
      type: NodeType.var,
    };
    const node5: TypedNode = {
      label: 'node5',
      type: NodeType.fun,
    };
    graph.set(node1, new Set([node2]));
    graph.set(node2, new Set([node3]));
    graph.set(node3, new Set([node4]));
    graph.set(node4, new Set([]));
    graph.set(node5, new Set([node5]));

    expect(findLinearPaths(graph)).toEqual([
      [node1, node2, node3, node4],
    ]);
  });
  it('graph linear paths 2', () => {
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
    graph.set(node2, new Set([node3]));
    graph.set(node3, new Set([]));
    graph.set(node4, new Set([node3]));

    expect(findLinearPaths(graph)).toEqual([]);
  });
  it('graph linear paths 3', () => {
    const graph = new Map<TypedNode, Set<TypedNode>>();
    const node1: TypedNode = {
      label: 'node1',
      type: NodeType.var,
    };
    const node2: TypedNode = {
      label: 'node2',
      type: NodeType.var,
    };
    const node3: TypedNode = {
      label: 'node3',
      type: NodeType.var,
    };
    const node4: TypedNode = {
      label: 'node4',
      type: NodeType.var,
    };
    const node5: TypedNode = {
      label: 'node5',
      type: NodeType.var,
    };

    graph.set(node1, new Set([]));
    graph.set(node2, new Set([node1]));
    graph.set(node3, new Set([node2]));
    graph.set(node4, new Set([node3]));
    graph.set(node5, new Set([]));

    expect(findLinearPaths(graph)).toEqual([
      [node4, node3, node2, node1],
    ]);
  });
  it('graph articulation points 1', () => {
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
    const node5: TypedNode = {
      label: 'node5',
      type: NodeType.fun,
    };
    graph.set(node1, new Set([node1]));
    graph.set(node1, new Set([node3]));
    graph.set(node2, new Set([node3]));
    graph.set(node3, new Set([node4, node5]));
    graph.set(node4, new Set([]));
    graph.set(node5, new Set([]));

    expect(findArticulationPoints(graph)).toEqual(new Set([node3]));
  });
});
