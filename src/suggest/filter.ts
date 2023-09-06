import { NodeType, TypedNode } from '../analyze/utils';

/**
 * Filter out nodes that have no indegree.
 */
export function noIndegreeFilter(
  graph: Map<TypedNode, Set<TypedNode>>,
) {
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

// --- 

function removeVariable(
  graph: Map<TypedNode, Set<TypedNode>>,
  targets: Set<TypedNode>
) {
  const newTarget = new Set<TypedNode>();
  targets.forEach(target => {
    if(target.type === NodeType.var) {
      const nodes = graph.get(target);
      nodes?.forEach(node => {
        newTarget.add(node);
      });
    }
    if(target.type === NodeType.fun) {
      newTarget.add(target);
    }
  });
  return newTarget;
}

/**
 * only save function nodes
 */
export function onlyFunctions(
  graph: Map<TypedNode, Set<TypedNode>>,
): Map<TypedNode, Set<TypedNode>> {
  const result = new Map<TypedNode, Set<TypedNode>>();
  graph.forEach((targets, node) => {
    if(node.type === NodeType.fun) {
      const nodes = removeVariable(graph, targets);
      result.set(node, nodes);
    }
  });
  return result;
}