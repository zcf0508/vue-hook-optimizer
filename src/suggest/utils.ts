import type { TypedNode } from '../analyze/utils';

export function hasCycle(graph: Map<TypedNode, Set<{ node: TypedNode, type: 'get' | 'set' }>>): { hasCycle: boolean, cycleNodes: TypedNode[] } {
  const visited: Set<TypedNode> = new Set();
  const onStack: Set<TypedNode> = new Set();
  const stack: TypedNode[] = [];

  function dfs(node: TypedNode): boolean {
    if (visited.has(node)) {
      if (onStack.has(node)) {
        // 只有当环中所有边都是写(set)才算循环
        const idx = stack.indexOf(node);
        const cycle = stack.slice(idx);
        const allSet = cycle.every((curr, i) => {
          const next = cycle[(i + 1) % cycle.length];
          return Array.from(graph.get(curr) || []).some(
            edge => edge.node === next && edge.type === 'set',
          );
        });
        return allSet;
      }
      return false;
    }

    visited.add(node);
    onStack.add(node);
    stack.push(node);

    for (const neighbor of (graph.get(node) || new Set())) {
      if (dfs(neighbor.node)) {
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
