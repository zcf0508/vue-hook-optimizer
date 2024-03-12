import type { TypedNode } from '../analyze/utils';

function dfs(
  graph: Map<TypedNode, Set<TypedNode>>,
  node: TypedNode,
  targets: Set<TypedNode>,
  visited: Set<TypedNode>,
  component: Set<TypedNode>,
) {
  component.add(node);
  visited.add(node);
  targets.forEach((target) => {
    if (!visited.has(target)) {
      dfs(graph, target, graph.get(target) || new Set(), visited, component);
    }
  });
}

function haveIntersection(setA: Set<TypedNode>, setB: Set<TypedNode>): boolean {
  for (const item of setA) {
    if (setB.has(item)) {
      return true;
    }
  }
  return false;
}

function mergeSets(arr: Set<TypedNode>[]): Set<TypedNode>[] {
  let result: Set<TypedNode>[] = [...arr];
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (haveIntersection(result[i], result[j])) {
        const newSet = new Set([...result[i], ...result[j]]);
        result.splice(j, 1);
        result.splice(i, 1);
        result = [...result, newSet];
        return mergeSets(result);
      }
    }
  }
  return result;
}

export function splitGraph(
  graph: Map<TypedNode, Set<TypedNode>>,
) {
  const components = [] as Set<TypedNode>[];

  const sorted = Array.from(graph).sort((a, b) => b[1].size - a[1].size);

  (new Map(sorted)).forEach((targets, node) => {
    const visited = new Set<TypedNode>();
    if (!visited.has(node)) {
      const component = new Set<TypedNode>();
      dfs(graph, node, targets, visited, component);
      components.push(component);
    }
  });

  return mergeSets(components).map((component) => {
    const subGraph = new Map<TypedNode, Set<TypedNode>>();
    component.forEach((node) => {
      const targets = graph.get(node);
      if (targets) {
        subGraph.set(node, targets);
      }
    });
    return subGraph;
  });
}
