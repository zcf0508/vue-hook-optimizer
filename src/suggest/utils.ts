import { TypedNode } from '../analyze/utils';

export function hasCycle(graph: Map<TypedNode, Set<TypedNode>>): { hasCycle: boolean, cycleNodes: TypedNode[] } {
  const visited: Set<TypedNode> = new Set();
  const onStack: Set<TypedNode> = new Set();
  const stack: TypedNode[] = [];

  function dfs(node: TypedNode): boolean {
    if (visited.has(node)) {
      if (onStack.has(node)) {
        // Find the start of the cycle.
        while (stack[0] !== node) {
          onStack.delete(stack.shift()!);
        }
        return true;
      }
      return false;
    }

    visited.add(node);
    onStack.add(node);
    stack.push(node);

    for (const neighbor of (graph.get(node) || new Set())) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    onStack.delete(node);
    stack.pop();
    return false;
  }

  for (const [node, targets] of graph) {
    if (dfs(node)) {
      return { hasCycle: true, cycleNodes: [...stack] };
    }
  }

  return { hasCycle: false, cycleNodes: [] };
}