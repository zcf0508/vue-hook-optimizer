import { TypedNode } from '@/analyze/utils';

export function noIndegreeFilter(
  graph: Map<TypedNode, Set<TypedNode>>,
) {
  // graph： Map<A, Sst<B, C>> A->B A->C
  // 找出所有入度为0 的点
  const nodes = Array.from(graph.keys());
  const indegree = new Map<TypedNode, number>();
  nodes.forEach(node => {
    indegree.set(node, 0);
  });
  graph.forEach((targets, node) => {
    targets.forEach(target => {
      indegree.set(target, (indegree.get(target) || 0) + 1);
    });
  });
  return nodes.filter(node => indegree.get(node) === 0);
}