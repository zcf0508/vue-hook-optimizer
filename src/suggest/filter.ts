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

/**
 * Filter out nodes that have no outdegree.
 */
export function noOutdegreeFilter(
  graph: Map<TypedNode, Set<TypedNode>>,
) {
  const zeroOutdegreeNodes = [];

  for (let [node, edges] of graph.entries()) {
    if (edges.size === 0) {
      zeroOutdegreeNodes.push(node);
    }
  }

  return zeroOutdegreeNodes;
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


// ---

export function findLinearPaths(graph: Map<TypedNode, Set<TypedNode>>) {
  let linearPaths = [];

  let visitedNodes = new Set();

  for (let [node, edges] of graph.entries()) {
    if (edges.size === 1 && !visitedNodes.has(node)) {
      let path = [node];
      let nextNode = Array.from(edges)[0];
      
      visitedNodes.add(node);

      while (graph.get(nextNode)?.size === 1) {
        path.push(nextNode);
        visitedNodes.add(nextNode);
        nextNode = Array.from(graph.get(nextNode)!)[0];
      }

      if (path.length > 1) {
        linearPaths.push(path);
      }
    }
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

    for (let neighbor of graph.get(node) || []) {
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
      } else if (neighbor !== parent.get(node)) {
        low.set(node, Math.min(low.get(node)!, disc.get(neighbor)!));
      }
    }
  }

  for (let node of graph.keys()) {
    if (!visited.has(node) && !noIndegreeNodes.includes(node)) {
      APUtil(graph, node);
    }
  }
  return ap;
}