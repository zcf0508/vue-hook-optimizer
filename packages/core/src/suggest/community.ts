import type { RelationType, TypedNode } from '../analyze/utils';

export interface Community {
  id: number
  nodes: Set<TypedNode>
}

export interface CommunityResult {
  communities: Community[]
  nodeToCommuntiy: Map<TypedNode, number>
}

function buildUndirectedGraph(
  graph: Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>,
): Map<TypedNode, Set<TypedNode>> {
  const undirected = new Map<TypedNode, Set<TypedNode>>();

  for (const [node, edges] of graph) {
    if (!undirected.has(node)) {
      undirected.set(node, new Set());
    }
    for (const edge of edges) {
      undirected.get(node)!.add(edge.node);
      if (!undirected.has(edge.node)) {
        undirected.set(edge.node, new Set());
      }
      undirected.get(edge.node)!.add(node);
    }
  }

  return undirected;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Label Propagation Algorithm for community detection.
 *
 * Each node starts with its own unique label. In each iteration,
 * nodes adopt the most frequent label among their neighbors.
 * The algorithm converges when labels no longer change.
 *
 * This helps identify groups of nodes that are tightly connected
 * and could potentially be extracted into separate hooks.
 */
export function detectCommunities(
  graph: Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>,
  maxIterations: number = 100,
): CommunityResult {
  const undirectedGraph = buildUndirectedGraph(graph);
  const nodes = Array.from(undirectedGraph.keys());

  if (nodes.length === 0) {
    return { communities: [], nodeToCommuntiy: new Map() };
  }

  const labels = new Map<TypedNode, number>();
  nodes.forEach((node, index) => {
    labels.set(node, index);
  });

  let changed = true;
  let iterations = 0;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    const shuffledNodes = shuffleArray(nodes);

    for (const node of shuffledNodes) {
      const neighbors = undirectedGraph.get(node);
      if (!neighbors || neighbors.size === 0) {
        continue;
      }

      const labelCounts = new Map<number, number>();
      for (const neighbor of neighbors) {
        const neighborLabel = labels.get(neighbor)!;
        labelCounts.set(neighborLabel, (labelCounts.get(neighborLabel) || 0) + 1);
      }

      let maxCount = 0;
      let maxLabels: number[] = [];
      for (const [label, count] of labelCounts) {
        if (count > maxCount) {
          maxCount = count;
          maxLabels = [label];
        }
        else if (count === maxCount) {
          maxLabels.push(label);
        }
      }

      const currentLabel = labels.get(node)!;
      if (maxLabels.includes(currentLabel)) {
        continue;
      }

      const newLabel = maxLabels[Math.floor(Math.random() * maxLabels.length)];
      if (newLabel !== currentLabel) {
        labels.set(node, newLabel);
        changed = true;
      }
    }
  }

  const communityMap = new Map<number, Set<TypedNode>>();
  for (const [node, label] of labels) {
    if (!communityMap.has(label)) {
      communityMap.set(label, new Set());
    }
    communityMap.get(label)!.add(node);
  }

  const communities: Community[] = [];
  const nodeToCommuntiy = new Map<TypedNode, number>();
  let communityId = 0;

  for (const [_, nodeSet] of communityMap) {
    communities.push({
      id: communityId,
      nodes: nodeSet,
    });
    for (const node of nodeSet) {
      nodeToCommuntiy.set(node, communityId);
    }
    communityId++;
  }

  communities.sort((a, b) => b.nodes.size - a.nodes.size);

  const reindexedCommunities: Community[] = [];
  const newNodeToCommunity = new Map<TypedNode, number>();

  communities.forEach((community, newId) => {
    reindexedCommunities.push({
      id: newId,
      nodes: community.nodes,
    });
    for (const node of community.nodes) {
      newNodeToCommunity.set(node, newId);
    }
  });

  return {
    communities: reindexedCommunities,
    nodeToCommuntiy: newNodeToCommunity,
  };
}

/**
 * Generate HSL colors for communities.
 * Uses golden ratio to distribute hues evenly.
 */
export function generateCommunityColors(communityCount: number): string[] {
  const colors: string[] = [];
  const goldenRatio = 0.618033988749895;
  let hue = 0.1;

  for (let i = 0; i < communityCount; i++) {
    hue = (hue + goldenRatio) % 1;
    const h = Math.floor(hue * 360);
    const s = 65 + (i % 3) * 10;
    const l = 45 + (i % 2) * 10;
    colors.push(`hsl(${h}, ${s}%, ${l}%)`);
  }

  return colors;
}

/**
 * Generate RGBA colors for VS Code decorations.
 * Returns both background (low opacity) and foreground (high opacity) colors.
 */
export function generateCommunityColorsRGBA(communityCount: number): Array<{
  background: string
  foreground: string
  border: string
}> {
  const colors: Array<{ background: string, foreground: string, border: string }> = [];
  const goldenRatio = 0.618033988749895;
  let hue = 0.1;

  for (let i = 0; i < communityCount; i++) {
    hue = (hue + goldenRatio) % 1;
    const h = hue * 360;
    const s = 0.45;
    const l = 0.55;

    const { r, g, b } = hslToRgb(h, s, l);

    colors.push({
      background: `rgba(${r}, ${g}, ${b}, 0.15)`,
      foreground: `rgba(${r}, ${g}, ${b}, 0.9)`,
      border: `rgba(${r}, ${g}, ${b}, 0.5)`,
    });
  }

  return colors;
}

function hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
  h = h / 360;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) { t += 1; }
      if (t > 1) { t -= 1; }
      if (t < 1 / 6) { return p + (q - p) * 6 * t; }
      if (t < 1 / 2) { return q; }
      if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
      return p;
    };

    const q = l < 0.5
      ? l * (1 + s)
      : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}
