import type { RelationType, TypedNode } from '../analyze/utils';

export function hasCycle(graph: Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>): { hasCycle: boolean, cycleNodes: TypedNode[] } {
  const visited: Set<TypedNode> = new Set();
  const onStack: Set<TypedNode> = new Set();
  const stack: TypedNode[] = [];
  let cycleNodes: TypedNode[] = [];

  function dfs(node: TypedNode): boolean {
    if (visited.has(node)) {
      if (onStack.has(node)) {
        // 只有当环中所有边都是写(set) 或全是 调用(call) 才算循环
        const idx = stack.indexOf(node);
        const cycle = stack.slice(idx);
        const allNotGet = cycle.every((curr, i) => {
          const next = cycle[(i + 1) % cycle.length];
          return Array.from(graph.get(curr) || []).some(
            edge => edge.node === next && edge.type !== 'get',
          );
        });

        if (allNotGet) {
          cycleNodes = cycle;
          return true;
        }
        return false;
      }
      return false;
    }

    visited.add(node);
    onStack.add(node);
    stack.push(node);

    for (const neighbor of (graph.get(node) || new Set())) {
      // 检查自环：自己依赖自己且 type 为 'set' 也算环
      if (neighbor.node === node && neighbor.type !== 'get') {
        cycleNodes = [node];
        return true;
      }
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
      return { hasCycle: true, cycleNodes };
    }
  }

  return { hasCycle: false, cycleNodes: [] };
}
