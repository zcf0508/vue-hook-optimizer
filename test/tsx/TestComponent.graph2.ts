import { NodeType } from '@/analyze/utils';

const edges = new Map<{
  label: string
  type: NodeType
}, Set<{ label: string, type: NodeType }>>();

const focus = { label: 'focus', type: NodeType.fun };
const open = { label: 'open', type: NodeType.fun };
const AA = { label: 'AA', type: NodeType.var };
const aa = { label: 'aa', type: NodeType.var };
const x = { label: 'x', type: NodeType.var };
const y = { label: 'y', type: NodeType.var };

edges.set(focus, new Set([aa, x]));
edges.set(aa, new Set([]));
edges.set(AA, new Set([aa]));
edges.set(x, new Set([]));
edges.set(y, new Set([]));
edges.set(open, new Set([]));

export const graph = {
  nodes: new Set([
    focus,
    aa,
    AA,
    x,
    y,
    open,
  ]),
  edges,
};
