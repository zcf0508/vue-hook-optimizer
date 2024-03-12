import type * as t from '@babel/types';

export interface TypedNode {
  label: string
  type: NodeType
  info?: Partial<{
    line: number
    column: number
    comment: string
  }>
};

export enum NodeType {
  var = 'var',
  fun = 'fun',
}

interface Options {
  isComputed: boolean
  isMethod: boolean
  comment: string
};

export class NodeCollection {
  lineOffset = 0;
  addInfo = true;
  constructor(_lineOffset = 0, _addInfo = true) {
    this.lineOffset = _lineOffset;
    this.addInfo = _addInfo;
  }

  nodes = new Map<string, TypedNode>();

  addNode(
    label: string,
    node: t.Node,
    options: Partial<Options> = { isComputed: false, isMethod: false, comment: '' },
  ) {
    if (this.nodes.has(label)) {
      return;
    }
    if (
      (!options.isComputed && (
        (node.type === 'VariableDeclarator' && [
          'ArrowFunctionExpression',
          'FunctionDeclaration',
          'FunctionExpression',
        ].includes(node.init?.type || ''))
        || (node.type === 'ObjectProperty' && [
          'ArrowFunctionExpression',
          'FunctionDeclaration',
          'FunctionExpression',
        ].includes(node.value?.type || ''))
        || node.type === 'FunctionDeclaration'
        || node.type === 'ObjectMethod'
        || node.type === 'ArrowFunctionExpression'
        || node.type === 'FunctionExpression'
      ))
      || options.isMethod
    ) {
      this.nodes.set(label, {
        label,
        type: NodeType.fun,
        ...(this.addInfo
          ? {
            info: {
              line: (node.loc?.start.line || 1) - 1 + this.lineOffset,
              column: node.loc?.start.column || 0,
              ...options.comment
                ? { comment: options.comment }
                : {},
            },
          }
          : {}),
      });
    }
    else {
      this.nodes.set(label, {
        label,
        type: NodeType.var,
        ...(this.addInfo
          ? {
            info: {
              line: (node.loc?.start.line || 1) - 1 + this.lineOffset,
              column: node.loc?.start.column || 0,
              ...options.comment
                ? { comment: options.comment }
                : {},
            },
          }
          : {}),
      });
    }
  }

  addTypedNode(label: string, node: TypedNode) {
    this.nodes.set(label, {
      label,
      type: node.type,
      ...(this.addInfo
        ? {
          info: {
            ...(node.info || {}),
          },
        }
        : {}),
    });
  }

  map(graph: {
    nodes: Set<string>
    edges: Map<string, Set<string>>
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

export function getComment(node: t.Node) {
  let comment = '';

  node.leadingComments?.forEach((_comment) => {
    if (_comment.value.trim().startsWith('*')) {
      comment += `${_comment.value.trim().replace(/^[\s]*\*+[\s]*\**/gm, '').trim()}\n`;
    }
  });

  node.trailingComments?.forEach((_comment) => {
    if (_comment.value.trim().startsWith('*')) {
      comment += `${_comment.value.trim().replace(/^[\s]*\*+[\s]*\**/gm, '').trim()}\n`;
    }
    else {
      comment += `${_comment.value.trim()}\n`;
    }
  });

  return comment.trim();
}
