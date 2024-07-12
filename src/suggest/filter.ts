import type { TypedNode } from '../analyze/utils';
import { NodeType } from '../analyze/utils';

/**
 * Filter out nodes that have no indegree.
 */
export function noIndegreeFilter(
  graph: Map<TypedNode, Set<TypedNode>>,
) {
  const nodes = Array.from(graph.keys());
  const indegree = new Map<TypedNode, number>();
  nodes.forEach((node) => {
    indegree.set(node, 0);
  });
  graph.forEach((targets, node) => {
    targets.forEach((target) => {
      indegree.set(target, (indegree.get(target) || 0) + 1);
    });
  });
  return nodes.filter(node => indegree.get(node) === 0);
}

/**
 * Filter out nodes that have no outdegree.
 */
export function noOutdegreeFilter(
  graph: Map<TypedNode, Set<TypedNode>>,
) {
  const zeroOutdegreeNodes = [];

  for (const [node, edges] of graph.entries()) {
    if (edges.size === 0) {
      zeroOutdegreeNodes.push(node);
    }
  }

  return zeroOutdegreeNodes;
}

// ---

function removeVariable(
  graph: Map<TypedNode, Set<TypedNode>>,
  targets: Set<TypedNode>,
) {
  const newTarget = new Set<TypedNode>();
  targets.forEach((target) => {
    if (target.type === NodeType.var) {
      const nodes = graph.get(target);
      nodes?.forEach((node) => {
        newTarget.add(node);
      });
    }
    if (target.type === NodeType.fun) {
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
    if (node.type === NodeType.fun) {
      const nodes = removeVariable(graph, targets);
      result.set(node, nodes);
    }
  });
  return result;
}

// ---

export function findLinearPaths(graph: Map<TypedNode, Set<TypedNode>>) {
  const linearPaths = [] as TypedNode[][];
  const visitedNodes = new Set<TypedNode>();
  const nodeInDegrees = new Map<TypedNode, number>();

  // 计算每个节点的入度
  for (const [node, edges] of graph.entries()) {
    for (const edge of edges) {
      const inDegree = nodeInDegrees.get(edge) || 0;
      nodeInDegrees.set(edge, inDegree + 1);
    }
  }

  function dfs(node: TypedNode, path: TypedNode[]) {
    if (visitedNodes.has(node)) {
      return;
    }

    path.push(node);
    visitedNodes.add(node);

    const edges = graph.get(node) || new Set();

    if (edges.size === 0 || edges.size > 1) {
      if (path.length > 1) {
        addOrUpdatePath([...path]);
      }
    }
    else {
      const nextNode = Array.from(edges)[0];
      const nextNodeInDegree = nodeInDegrees.get(nextNode) || 0;

      // 确保下一个节点只有一个入度
      if (nextNodeInDegree === 1) {
        dfs(nextNode, path);
      }
    }

    path.pop();
    visitedNodes.delete(node);
  }

  function addOrUpdatePath(newPath: TypedNode[]) {
    let shouldAddNewPath = true;

    for (let i = linearPaths.length - 1; i >= 0; i--) {
      const existingPath = linearPaths[i];
      if (isSubpath(existingPath, newPath)) {
        linearPaths.splice(i, 1); // remove the shorter path
      }
      else if (isSubpath(newPath, existingPath)) {
        shouldAddNewPath = false;
        break;
      }
    }

    if (shouldAddNewPath && newPath.length > 2) {
      linearPaths.push(newPath);
    }
  }

  function isSubpath(shortPath: TypedNode[], longPath: TypedNode[]) {
    if (shortPath.length >= longPath.length) { return false; }

    for (let i = 0; i <= longPath.length - shortPath.length; i++) {
      let isSub = true;
      for (let j = 0; j < shortPath.length; j++) {
        if (shortPath[j] !== longPath[i + j]) {
          isSub = false;
          break;
        }
      }
      if (isSub) {
        return true;
      }
    }
    return false;
  }

  for (const node of graph.keys()) {
    dfs(node, []);
  }

  return linearPaths;
}

// ---

export function findArticulationPoints(graph: Map<TypedNode, Set<TypedNode>>) {
  const noIndegreeNodes = noIndegreeFilter(graph);
  let time = 0;
  const low = new Map<TypedNode, number>();
  const disc = new Map<TypedNode, number>();
  const parent = new Map<TypedNode, TypedNode | null>();
  const ap = new Set<TypedNode>();
  const visited = new Set<TypedNode>();

  function APUtil(graph: Map<TypedNode, Set<TypedNode>>, node: TypedNode) {
    let children = 0;
    disc.set(node, time);
    low.set(node, time);
    time++;
    visited.add(node);

    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        children++;
        parent.set(neighbor, node);
        APUtil(graph, neighbor);
        low.set(node, Math.min(low.get(node)!, low.get(neighbor)!));
        if (parent.get(node) === null && children > 1) {
          ap.add(node);
        }
        if (parent.get(node) !== null && low.get(neighbor)! >= disc.get(node)!) {
          ap.add(node);
        }
      }
      else if (neighbor !== parent.get(node)) {
        low.set(node, Math.min(low.get(node)!, disc.get(neighbor)!));
      }
    }
  }

  for (const node of graph.keys()) {
    if (!visited.has(node) && !noIndegreeNodes.includes(node)) {
      APUtil(graph, node);
    }
  }
  return ap;
}
