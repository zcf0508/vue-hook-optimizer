import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

export interface TypedNode {
  label: string
  type: NodeType
  info?: Partial<{
    line: number
    column: number
    comment: string
    used: Set<string>
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

export type RelationType = 'get' | 'set' | 'call';

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

  getNode(label: string) {
    return this.nodes.get(label);
  }

  map(graph: {
    nodes: Set<string>
    edges: Map<string, Set<{ label: string, type: RelationType }>>
  }) {
    const nodes = new Set(Array.from(graph.nodes).map((node) => {
      return this.nodes.get(node)!;
    }).filter(node => !!node));

    const edges = new Map(Array.from(graph.edges).map(([from, to]) => {
      // dedupe by node label, preferring 'set' over 'get'
      const labelMap = new Map<string, { node: TypedNode, type: RelationType }>();
      for (const item of to) {
        const node = this.nodes.get(item.label)!;
        if (!node) {
          continue;
        }
        const existing = labelMap.get(item.label);
        if (!existing || (existing.type === 'get' && item.type === 'set')) {
          labelMap.set(item.label, { node, type: item.type });
        }
      }
      const items = Array.from(labelMap.values());
      return [this.nodes.get(from)!, new Set(items)];
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
    if (_comment.loc!.end.line > node.loc!.start.line) {
      return;
    }
    if (_comment.value.trim().startsWith('*')) {
      comment += `${_comment.value.trim().replace(/^\s*\*+\s*\**/gm, '').trim()}\n`;
    }
  });

  node.trailingComments?.forEach((_comment) => {
    if (_comment.loc!.end.line > node.loc!.start.line) {
      return;
    }
    if (_comment.value.trim().startsWith('*')) {
      comment += `${_comment.value.trim().replace(/^\s*\*+\s*\**/gm, '').trim()}\n`;
    }
    else {
      comment += `${_comment.value.trim()}\n`;
    }
  });

  return comment.trim();
}

export function isWritingNode(path: NodePath<t.Node>) {
  // Check if the current node is inside an assignment expression (including nested MemberExpression)
  const assignParent = path.findParent(p => p.isAssignmentExpression()) as NodePath<t.AssignmentExpression> | null;
  if (assignParent) {
    const leftNode = assignParent.node.left;
    if (
      leftNode.start != null
      && path.node.start! >= leftNode.start
      && path.node.end! <= (leftNode.end as number)
    ) {
      return true;
    }
  }

  // Check if the current node is inside an update expression (including nested MemberExpression)
  const updateParent = path.findParent(p => p.isUpdateExpression()) as NodePath<t.UpdateExpression> | null;
  if (updateParent) {
    const argNode = updateParent.node.argument as t.Node;
    if (
      argNode.start != null
      && path.node.start! >= argNode.start
      && path.node.end! <= (argNode.end as number)
    ) {
      return true;
    }
  }

  return false;
}

export function isCallingNode(path: NodePath<t.Identifier>) {
  const parent = path.parentPath;
  // 判断父节点是否为 CallExpression，并且当前节点是 callee
  if (parent && parent.isCallExpression()) {
    return parent.node.callee === path.node;
  }
  return false;
}

export function getRelationType(path: NodePath<t.Node>) {
  if (path.node.type === 'Identifier' && isCallingNode(path as NodePath<t.Identifier>)) {
    return 'call';
  }
  if (isWritingNode(path)) {
    return 'set';
  }
  return 'get';
}
