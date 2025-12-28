import type { RelationType, TypedNode } from '../analyze/utils';
import { NodeType } from '../analyze/utils';
import { detectCommunities } from './community';
import { findArticulationPoints, findLinearPaths, noIndegreeFilter } from './filter';
import { splitGraph } from './split';
import { hasCycle } from './utils';

export enum SuggestionType {
  info = 'info',
  warning = 'warning',
  error = 'error',
}

export interface Suggestion {
  type: SuggestionType
  message: string
  nodeInfo?: TypedNode | Array<TypedNode>
};

export function gen(
  graph: {
    nodes: Set<TypedNode>
    edges: Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>
  },
  nodesUsedInTemplate: Set<string>,
  nodesUsedInStyle: Set<string> = new Set(),
  options?: Partial<{
    ellipsis: boolean
  }>,
) {
  const {
    ellipsis = true,
  } = options ?? {};

  const usedNodes = new Set([...nodesUsedInTemplate, ...nodesUsedInStyle]);

  const suggestions: Suggestion[] = [];
  const splitedGraph = splitGraph(graph.edges);
  splitedGraph.forEach((g) => {
    const nodes = Array.from(g.keys());

    if (splitedGraph.length > 1) {
      if (nodes.length > 2 && nodes.some(node => !usedNodes.has(node.label))) {
        suggestions.push({
          type: SuggestionType.info,
          message: `Nodes [${
            (ellipsis && nodes.length > 10)
              ? `${nodes.slice(0, 10).map(node => node.label).join(',')}...(${nodes.length})`
              : nodes.map(node => node.label).join(',')
          }] are isolated, perhaps you can refactor them to an isolated file.`,
          nodeInfo: nodes,
        });
      }
    }

    if (nodes.length > 1 && nodes.every(node => !usedNodes.has(node.label) && !node.info?.used?.size)) {
      suggestions.push({
        type: SuggestionType.info,
        message: `Nodes [${
          (ellipsis && nodes.length > 10)
            ? `${nodes.slice(0, 10).map(node => node.label).join(',')}...`
            : nodes.map(node => node.label).join(',')
        }] are not used, perhaps you can remove them.`,
        nodeInfo: nodes,
      });
    }
    const hasCycleResult = hasCycle(g);
    if (hasCycleResult.hasCycle) {
      suggestions.push({
        type: SuggestionType.error,
        message: `There is a loop call in nodes [${
          hasCycleResult.cycleNodes.map(node => node.label).join(',')
        }], perhaps you can refactor it.`,
        nodeInfo: hasCycleResult.cycleNodes,
      });
    }

    const paths = findLinearPaths(g);
    paths.forEach((path) => {
      const firstUsedNodeIndex = path.findIndex(node => usedNodes.has(node.label));
      const reverseLastNotUsedNodeIndex = path.slice().reverse().findIndex(node => !usedNodes.has(node.label));
      const lastNotUsedNodeIndex = reverseLastNotUsedNodeIndex !== -1
        ? path.length - 1 - reverseLastNotUsedNodeIndex
        : -1;

      if (firstUsedNodeIndex > -1 && firstUsedNodeIndex < lastNotUsedNodeIndex) {
        suggestions.push({
          type: SuggestionType.warning,
          message: `Nodes [${
            (ellipsis && path.length > 10)
              ? `${path.slice(0, 10).map(node => node.label).join(',')}...(${path.length})`
              : path.map(node => node.label).join(',')
          }] are have function chain calls, perhaps you can refactor it.`,
          nodeInfo: path,
        });
      }
    });

    if (g.size > 5) {
      const ap = findArticulationPoints(g);
      ap.forEach((node) => {
        if (node.type === NodeType.fun) {
          suggestions.push({
            type: SuggestionType.info,

            message: `Node [${
              node.label
            }] is an articulation point, perhaps you need to pay special attention to this node.`,
            nodeInfo: node,
          });
        }
      });
    }
  });

  const noIndegreeNodes = noIndegreeFilter(graph.edges);
  noIndegreeNodes.forEach((node) => {
    if (!usedNodes.has(node.label) && !node.info?.used?.size) {
      suggestions.push({
        type: SuggestionType.info,
        message: `Node [${node.label}] is not used, perhaps you can remove it.`,
        nodeInfo: node,
      });
    }
  });

  const communityResult = detectCommunities(graph.edges);
  const { communities } = communityResult;

  const extractableCommunities = communities.filter((community) => {
    const nodes = Array.from(community.nodes);
    if (nodes.length < 3 || nodes.length > 15) {
      return false;
    }

    const hasUsedNode = nodes.some(node => usedNodes.has(node.label));
    const hasUnusedNode = nodes.some(node => !usedNodes.has(node.label));

    return hasUsedNode && hasUnusedNode;
  });

  extractableCommunities.forEach((community) => {
    const nodes = Array.from(community.nodes);
    const unusedNodes = nodes.filter(node => !usedNodes.has(node.label));

    if (unusedNodes.length >= 2) {
      suggestions.push({
        type: SuggestionType.info,
        message: `Nodes [${
          (ellipsis && nodes.length > 10)
            ? `${nodes.slice(0, 10).map(node => node.label).join(',')}...(${nodes.length})`
            : nodes.map(node => node.label).join(',')
        }] form a tightly coupled group, consider extracting them into a composable/hook.`,
        nodeInfo: nodes,
      });
    }
  });

  if (communities.length > 3) {
    const independentCommunities = communities.filter((community) => {
      const nodes = Array.from(community.nodes);
      return nodes.length >= 2 && nodes.every(node => !usedNodes.has(node.label) && !node.info?.used?.size);
    });

    if (independentCommunities.length >= 2) {
      const allNodes = independentCommunities.flatMap(c => Array.from(c.nodes));
      suggestions.push({
        type: SuggestionType.info,
        message: `Found ${independentCommunities.length} independent variable groups that are not used in template. Consider removing or extracting them.`,
        nodeInfo: allNodes,
      });
    }
  }

  const largeCommunities = communities.filter(c => c.nodes.size > 10);
  largeCommunities.forEach((community) => {
    const nodes = Array.from(community.nodes);
    const functionNodes = nodes.filter(n => n.type === NodeType.fun);

    if (functionNodes.length > 5) {
      suggestions.push({
        type: SuggestionType.warning,
        message: `Community with ${nodes.length} nodes has ${functionNodes.length} functions. This group is complex, consider splitting into smaller composables.`,
        nodeInfo: nodes,
      });
    }
  });

  return suggestions;
}
