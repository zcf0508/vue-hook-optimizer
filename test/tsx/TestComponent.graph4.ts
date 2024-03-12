import { NodeType } from '@/analyze/utils';

const edges = new Map<{
  label: string
  type: NodeType
}, Set<{ label: string, type: NodeType }>>();

const open = { label: 'open', type: NodeType.var };
const setOpen = { label: 'setOpen', type: NodeType.var };
const xx = { label: 'xx', type: NodeType.var };
const processInfo = { label: 'processInfo', type: NodeType.fun };
const writeBaseInfo = { label: 'writeBaseInfo', type: NodeType.fun };

edges.set(open, new Set([]));
edges.set(setOpen, new Set([]));
edges.set(xx, new Set([]));
edges.set(processInfo, new Set([open]));
edges.set(writeBaseInfo, new Set([xx]));

export const graph = {
  nodes: new Set([
    open,
    setOpen,
    xx,
    processInfo,
    writeBaseInfo,
  ]),
  edges,
};
