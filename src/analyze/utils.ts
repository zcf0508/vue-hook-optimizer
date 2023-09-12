import * as t from '@babel/types';

export type TypedNode = {
  label: string
  type: NodeType
}

export enum NodeType {
	var='var',
	fun='fun',
}

type Options = {
  isComputed: boolean
  isMethod: boolean
}

export class NodeCollection {
  nodes = new Map<string, TypedNode>();
  addNode(label: string, node: t.Node, options: Partial<Options> = {isComputed: false, isMethod: false}) {
    if(this.nodes.has(label)) {
      return;
    }
    if(
      !options.isComputed && (
        (node.type === 'VariableDeclarator' && [
          'ArrowFunctionExpression', 
          'FunctionDeclaration',
        ].includes(node.init?.type || '')) 
        || node.type === 'FunctionDeclaration'
        || node.type === 'ObjectMethod'
      )
      || options.isMethod
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

  addTypedNode(label: string, node: TypedNode) {
    this.nodes.set(label, {
      label,
      type: node.type,
    });
  }

  map(graph: {
    nodes: Set<string>;
    edges: Map<string, Set<string>>;
  }) {

    const nodes = new Set(Array.from(graph.nodes).map((node) => {
      return this.nodes.get(node)!;
    }).filter(node => !!node));

    const edges = new Map(Array.from(graph.edges).map(([from, to]) => {
      return [this.nodes.get(from)!, new Set(Array.from(to).map((node) => {
        return this.nodes.get(node)!;
      }).filter(node => !!node))];
    }));
    
    return {
      nodes,
      edges,
    };
  }
}