import type { TypedNode } from '@/analyze/utils';
import { NodeType } from '@/analyze/utils';
import { hasCycle } from '@/suggest/utils';

describe('utils tests', () => {
  it('test hasCycle 1', () => {
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
    graph.set(node1, new Set([{ node: node1, type: 'set' }]));
    graph.set(node1, new Set([{ node: node2, type: 'set' }]));
    graph.set(node2, new Set([{ node: node1, type: 'set' }]));
    graph.set(node3, new Set([{ node: node4, type: 'set' }]));
    expect(hasCycle(graph).hasCycle).toEqual(true);
  });
  it('test hasCycle 2', () => {
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
    graph.set(node1, new Set([{ node: node2, type: 'get' }]));
    graph.set(node2, new Set([{ node: node3, type: 'get' }]));
    graph.set(node3, new Set([{ node: node4, type: 'get' }]));
    expect(hasCycle(graph).hasCycle).toEqual(false);
  });
  it('test hasCycle 3', () => {
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
    graph.set(node1, new Set([{ node: node1, type: 'set' }]));
    graph.set(node1, new Set([{ node: node2, type: 'get' }]));
    graph.set(node2, new Set([{ node: node1, type: 'set' }]));
    graph.set(node3, new Set([{ node: node4, type: 'set' }]));
    expect(hasCycle(graph).hasCycle).toEqual(false);
  });
});
