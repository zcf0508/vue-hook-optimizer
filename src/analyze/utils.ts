import * as t from '@babel/types';

export enum NodeType {
	var='var',
	fun='fun',
}

export class NodeCollection {
  nodes = new Map<string, {label: string, type: NodeType}>();
  addNode(label: string, node: t.Node, isComputed = false) {
    if(this.nodes.has(label)) {
      return;
    }
    if(
      !isComputed && (
        (node.type === 'VariableDeclarator' && [
          'ArrowFunctionExpression', 
          'FunctionDeclaration',
        ].includes(node.init?.type || '')) 
        || node.type === 'FunctionDeclaration'
        || node.type === 'ObjectMethod'
      )
    ) {
      this.nodes.set(label, {
        label,
        type: NodeType.fun,
      });
    } else {
      this.nodes.set(label, {
        label,
        type: NodeType.var,
      });
    }
  }

  addTypedNode(label: string, type: NodeType) {
    this.nodes.set(label, {
      label,
      type,
    });
  }

  map(graph: {
    nodes: Set<string>;
    edges: Map<string, Set<string>>;
  }) {

    const nodes = new Set(Array.from(graph.nodes).map((node) => {
      return this.nodes.get(node)!;
    }));

    const edges = new Map(Array.from(graph.edges).map(([from, to]) => {
      return [this.nodes.get(from)!, new Set(Array.from(to).map((node) => {
        return this.nodes.get(node)!;
      }))];
    }));
    
    return {
      nodes,
      edges,
    };
  }
}