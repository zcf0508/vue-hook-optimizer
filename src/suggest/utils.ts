import { TypedNode } from '../analyze/utils';

export function hasCycle(graph: Map<TypedNode, Set<TypedNode>>): boolean {
  const visited: Set<TypedNode> = new Set();

  function dfs(node: TypedNode): boolean {
    if (visited.has(node)) {
      return true;
    }

    visited.add(node);
    for (const neighbor of (graph.get(node) || new Set())) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    visited.delete(node);
    return false;
  }

  for (const [node, targets] of graph) {
    if (dfs(node)) {
      return true;
    }
  }

  return false;
}
