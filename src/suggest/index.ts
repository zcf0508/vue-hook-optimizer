import { TypedNode } from '@/analyze/utils';
import { splitGraph } from './split';
import { noIndegreeFilter } from './filter';

export function gen(
  graph: {
    nodes: Set<TypedNode>;
    edges: Map<TypedNode, Set<TypedNode>>;
  },
  usedNodes: Set<string>
) {
  const suggestions: string[] = [];
  const splitedGraph = splitGraph(graph.edges);
  // console.log(splitedGraph);
  splitedGraph.forEach(g => {
    const nodes = Array.from(g.keys());
    if(splitedGraph.length > 1) {
      if (nodes.length > 2 && nodes.some(node => !usedNodes.has(node.label))) {
        suggestions.push(`Nodes [${
          nodes.length > 10 
            ? nodes.slice(0, 10).map(node => node.label).join(',') + '...('+nodes.length+')'
            : nodes.map(node => node.label).join(',')
        }] are isolated, perhaps you can refactor them to an isolated file.`);
      }
    }
    if(nodes.every(node => !usedNodes.has(node.label))) {
      suggestions.push(`Node${
        nodes.length> 1 ? 's': ''
      } [${
        nodes.length > 10 
          ? nodes.slice(0, 10).map(node => node.label).join(',') + '...'
          : nodes.map(node => node.label).join(',')
      }] ${
        nodes.length> 1 ? 'are': 'is'
      } not used, perhaps you can remove ${
        nodes.length> 1 ? 'them': 'it'
      }.`);
    }
  });

  const noIndegreeNodes = noIndegreeFilter(graph.edges);
  noIndegreeNodes.forEach(node => {
    if(!usedNodes.has(node.label)) {
      suggestions.push(`Node [${node.label}] is not used, perhaps you can remove it.`);
    }
  });
  
  return suggestions;
}