import type { RelationType, TypedNode } from '../analyze/utils';

export interface Community {
  id: number
  nodes: Set<TypedNode>
}

export interface CommunityResult {
  communities: Community[]
  nodeToCommuntiy: Map<TypedNode, number>
}

const COMMON_PREFIXES = ['handle', 'on', 'is', 'has', 'can', 'should', 'get', 'set', 'update', 'toggle', 'reset', 'clear', 'init', 'fetch', 'load', 'save', 'delete', 'remove', 'add', 'create', 'show', 'hide', 'open', 'close', 'enable', 'disable', 'validate', 'check', 'use'];
const COMMON_SUFFIXES = ['change', 'changed', 'handler', 'callback', 'listener', 'state', 'value', 'data', 'list', 'items', 'count', 'index', 'id', 'name', 'type', 'status', 'error', 'loading', 'visible', 'disabled', 'enabled', 'active', 'selected', 'checked', 'open', 'closed'];

/**
 * Extract the base/root word from an identifier by removing common prefixes/suffixes.
 * Only removes prefixes at the start and suffixes at the end.
 * e.g., "handleOpenChange" -> ["open"]
 *       "isVisible" -> ["visible"]
 *       "userName" -> ["user", "name"]
 */
export function extractBaseWords(identifier: string): string[] {
  const tokens = identifier
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
    .split(/[_\-\s]+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return [];
  }

  if (tokens.length === 1) {
    return tokens;
  }

  let start = 0;
  if (COMMON_PREFIXES.includes(tokens[0])) {
    start = 1;
  }

  let end = tokens.length;
  if (COMMON_SUFFIXES.includes(tokens[tokens.length - 1])) {
    end = tokens.length - 1;
  }

  const words = tokens.slice(start, end);

  if (words.length === 0) {
    return tokens.slice(start > 0
      ? start
      : 0);
  }

  return words;
}

/**
 * Calculate semantic similarity between two identifiers.
 * Returns a value between 0 and 1.
 *
 * Considers:
 * 1. Shared base words (e.g., "open" in "isOpen" and "handleOpenChange")
 * 2. One identifier contains the other as a substring
 * 3. Common naming patterns (handler/state pairs)
 */
export function calculateSemanticSimilarity(labelA: string, labelB: string): number {
  if (labelA === labelB) {
    return 1;
  }

  const lowerA = labelA.toLowerCase();
  const lowerB = labelB.toLowerCase();

  if (lowerA.includes(lowerB) || lowerB.includes(lowerA)) {
    const shorter = lowerA.length < lowerB.length
      ? lowerA
      : lowerB;
    const longer = lowerA.length < lowerB.length
      ? lowerB
      : lowerA;
    return shorter.length / longer.length;
  }

  const wordsA = extractBaseWords(labelA);
  const wordsB = extractBaseWords(labelB);

  if (wordsA.length === 0 || wordsB.length === 0) {
    return 0;
  }

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let sharedCount = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      sharedCount++;
    }
  }

  if (sharedCount === 0) {
    return 0;
  }

  const jaccardSimilarity = sharedCount / (setA.size + setB.size - sharedCount);

  return jaccardSimilarity;
}

interface BuildWeightedGraphOptions {
  semanticWeight?: number
  similarityThreshold?: number
}

/**
 * Calculate semantic similarity using cached base words.
 * Returns a value between 0 and 1.
 */
function calculateSemanticSimilarityCached(
  labelA: string,
  labelB: string,
  wordsA: string[],
  wordsB: string[],
): number {
  if (labelA === labelB) {
    return 1;
  }

  const lowerA = labelA.toLowerCase();
  const lowerB = labelB.toLowerCase();

  if (lowerA.includes(lowerB) || lowerB.includes(lowerA)) {
    const shorter = lowerA.length < lowerB.length
      ? lowerA
      : lowerB;
    const longer = lowerA.length < lowerB.length
      ? lowerB
      : lowerA;
    return shorter.length / longer.length;
  }

  if (wordsA.length === 0 || wordsB.length === 0) {
    return 0;
  }

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let sharedCount = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      sharedCount++;
    }
  }

  if (sharedCount === 0) {
    return 0;
  }

  return sharedCount / (setA.size + setB.size - sharedCount);
}

/**
 * Build a weighted graph that combines structural connections with semantic similarity.
 *
 * Optimized algorithm:
 * 1. Cache extractBaseWords results to avoid repeated computation
 * 2. Build word-to-nodes bucket map, only compare nodes within same bucket
 *    This reduces O(N²) to O(B × K²) where B = number of buckets, K = avg nodes per bucket
 */
function buildWeightedGraph(
  graph: Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>,
  options: BuildWeightedGraphOptions = {},
): Map<TypedNode, Map<TypedNode, number>> {
  const { semanticWeight = 1.0, similarityThreshold = 0.3 } = options;

  const weighted = new Map<TypedNode, Map<TypedNode, number>>();
  const allNodes = new Set<TypedNode>();
  const connectedPairs = new Set<string>();

  for (const [node, edges] of graph) {
    allNodes.add(node);
    for (const edge of edges) {
      allNodes.add(edge.node);
    }
  }

  for (const node of allNodes) {
    weighted.set(node, new Map());
  }

  const structuralWeight = 0.85;

  for (const [node, edges] of graph) {
    for (const edge of edges) {
      const currentWeight = weighted.get(node)!.get(edge.node) || 0;
      weighted.get(node)!.set(edge.node, Math.max(currentWeight, structuralWeight));

      const reverseWeight = weighted.get(edge.node)!.get(node) || 0;
      weighted.get(edge.node)!.set(node, Math.max(reverseWeight, structuralWeight));

      const pairKey = [node.label, edge.node.label].sort().join('|');
      connectedPairs.add(pairKey);
    }
  }

  if (semanticWeight > 0) {
    const nodeWordsCache = new Map<TypedNode, string[]>();
    const wordToBucket = new Map<string, Set<TypedNode>>();

    for (const node of allNodes) {
      const words = extractBaseWords(node.label);
      nodeWordsCache.set(node, words);

      for (const word of words) {
        if (!wordToBucket.has(word)) {
          wordToBucket.set(word, new Set());
        }
        wordToBucket.get(word)!.add(node);
      }
    }

    const comparedPairs = new Set<string>();

    for (const [_, bucket] of wordToBucket) {
      if (bucket.size < 2) {
        continue;
      }

      const bucketNodes = Array.from(bucket);
      for (let i = 0; i < bucketNodes.length; i++) {
        for (let j = i + 1; j < bucketNodes.length; j++) {
          const nodeA = bucketNodes[i];
          const nodeB = bucketNodes[j];

          const comparedKey = [nodeA.label, nodeB.label].sort().join('|');
          if (comparedPairs.has(comparedKey)) {
            continue;
          }
          comparedPairs.add(comparedKey);

          const wordsA = nodeWordsCache.get(nodeA)!;
          const wordsB = nodeWordsCache.get(nodeB)!;
          const similarity = calculateSemanticSimilarityCached(
            nodeA.label,
            nodeB.label,
            wordsA,
            wordsB,
          );

          if (similarity > similarityThreshold) {
            const isConnected = connectedPairs.has(comparedKey);
            const semanticEdgeWeight = similarity * semanticWeight;

            const currentAB = weighted.get(nodeA)!.get(nodeB) || 0;
            const newWeightAB = isConnected
              ? Math.max(currentAB, semanticEdgeWeight)
              : currentAB + semanticEdgeWeight;
            weighted.get(nodeA)!.set(nodeB, Math.min(newWeightAB, 2.0));

            const currentBA = weighted.get(nodeB)!.get(nodeA) || 0;
            const newWeightBA = isConnected
              ? Math.max(currentBA, semanticEdgeWeight)
              : currentBA + semanticEdgeWeight;
            weighted.get(nodeB)!.set(nodeA, Math.min(newWeightBA, 2.0));
          }
        }
      }
    }
  }

  return weighted;
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

function createSeededRandom(seed?: number): () => number {
  if (seed === undefined) {
    return Math.random;
  }
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7FFFFFFF;
    return state / 0x7FFFFFFF;
  };
}

function shuffleArray<T>(array: T[], random: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface DetectCommunitiesOptions {
  maxIterations?: number
  seed?: number
  /**
   * Weight for semantic similarity (0-1).
   * Higher values give more importance to naming patterns.
   * Default: 1.0
   */
  semanticWeight?: number
  /**
   * Minimum semantic similarity threshold to create an edge (0-1).
   * Only node pairs with similarity above this threshold will be connected.
   * Default: 0.3
   */
  similarityThreshold?: number
}

/**
 * Label Propagation Algorithm for community detection with semantic awareness.
 *
 * Each node starts with its own unique label. In each iteration,
 * nodes adopt the most frequent label among their neighbors,
 * weighted by both structural connections and semantic similarity.
 *
 * Semantic similarity considers:
 * - Shared base words (e.g., "open" in "isOpen" and "handleOpenChange")
 * - Substring relationships
 * - Common naming patterns (handler/state pairs)
 *
 * This helps identify groups of nodes that are tightly connected
 * and could potentially be extracted into separate hooks.
 */
export function detectCommunities(
  graph: Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>,
  options: DetectCommunitiesOptions = {},
): CommunityResult {
  const { maxIterations = 100, semanticWeight = 1.0, similarityThreshold = 0.3 } = options;
  const random = createSeededRandom(options.seed);
  const weightedGraph = buildWeightedGraph(graph, { semanticWeight, similarityThreshold });
  const nodes = Array.from(weightedGraph.keys());

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

    const shuffledNodes = shuffleArray(nodes, random);

    for (const node of shuffledNodes) {
      const neighbors = weightedGraph.get(node);
      if (!neighbors || neighbors.size === 0) {
        continue;
      }

      const labelWeights = new Map<number, number>();
      for (const [neighbor, weight] of neighbors) {
        const neighborLabel = labels.get(neighbor)!;
        labelWeights.set(neighborLabel, (labelWeights.get(neighborLabel) || 0) + weight);
      }

      let maxWeight = 0;
      let maxLabels: number[] = [];
      for (const [label, weight] of labelWeights) {
        if (weight > maxWeight) {
          maxWeight = weight;
          maxLabels = [label];
        }
        else if (weight === maxWeight) {
          maxLabels.push(label);
        }
      }

      const currentLabel = labels.get(node)!;
      if (maxLabels.includes(currentLabel)) {
        continue;
      }

      const newLabel = maxLabels[Math.floor(random() * maxLabels.length)];
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
