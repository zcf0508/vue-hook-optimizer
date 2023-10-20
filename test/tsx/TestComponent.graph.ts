import { NodeType } from '@/analyze/utils';

const edges = new Map<{
  label: string, type: NodeType}, 
  Set<{label: string, type: NodeType}>
>();

const open = {label: 'open', type: NodeType.var};
const dds = {label: 'dds', type: NodeType.fun};
const dds2 = {label: 'dds2', type: NodeType.fun};
const dds3 = {label: 'dds3', type: NodeType.var};
const delayTime = {label: 'delayTime', type: NodeType.var};
const d2 = {label: 'd2', type: NodeType.var};
const route = {label: 'route', type: NodeType.var};
const infoOpen = {label: 'infoOpen', type: NodeType.var};
const writeBaseInfo = {label: 'writeBaseInfo', type: NodeType.fun};
const processInfo = {label: 'processInfo', type: NodeType.fun};
const a = {label: 'a', type: NodeType.var};
const b = {label: 'b', type: NodeType.var};
const aa = {label: 'aa', type: NodeType.var};
const rest = {label: 'rest', type: NodeType.var};
const xq = {label: 'xq', type: NodeType.var};
const loc = {label: 'loc', type: NodeType.var};
const locd = {label: 'locd', type: NodeType.var};
const start = {label: 'start', type: NodeType.var};
const end = {label: 'end', type: NodeType.var};
const line = {label: 'line', type: NodeType.var};
const arr = {label: 'arr', type: NodeType.var};
const brr = {label: 'brr', type: NodeType.var};
const foo = {label: 'foo', type: NodeType.var};
const bar = {label: 'bar', type: NodeType.var};
const baz = {label: 'baz', type: NodeType.var};
const third = {label: 'third', type: NodeType.var};
const xx = {label: 'xx', type: NodeType.var};
const yy = {label: 'yy', type: NodeType.var};
const arr2 = {label: 'arr2', type: NodeType.var};
const rest2 = {label: 'rest2', type: NodeType.var};
const c = {label: 'c', type: NodeType.var};
const xyz = {label: 'xyz', type: NodeType.fun};


edges.set(open, new Set([]));
edges.set(dds, new Set([]));
edges.set(dds2, new Set([]));
edges.set(dds3, new Set([dds2]));
edges.set(delayTime, new Set([]));
edges.set(d2, new Set([]));
edges.set(route, new Set([]));
edges.set(infoOpen, new Set([]));
edges.set(writeBaseInfo, new Set([aa, infoOpen, writeBaseInfo]));
edges.set(processInfo, new Set([processInfo, aa, xq, infoOpen]));
edges.set(a, new Set([arr]));
edges.set(b, new Set([arr]));
edges.set(aa, new Set([brr, line]));
edges.set(rest, new Set([brr, line]));
edges.set(xq, new Set([]));
edges.set(loc, new Set([]));
edges.set(locd, new Set([]));
edges.set(start, new Set([]));
edges.set(end, new Set([]));
edges.set(line, new Set([]));
edges.set(arr, new Set([]));
edges.set(brr, new Set([]));
edges.set(foo, new Set([xq, writeBaseInfo]));
edges.set(bar, new Set([xq, writeBaseInfo]));
edges.set(baz, new Set([xq, writeBaseInfo]));
edges.set(third, new Set([]));
edges.set(xx, new Set([]));
edges.set(yy, new Set([]));
edges.set(arr2, new Set([foo, bar, baz]));
edges.set(rest2, new Set([foo, bar, baz]));
edges.set(c, new Set([loc, start]));
edges.set(xyz, new Set([xyz]));

export const graph = {
  nodes: new Set([
    open, 
    dds, 
    dds2, 
    dds3, 
    delayTime, 
    d2,
    route, 
    infoOpen,
    writeBaseInfo,
    processInfo,
    a,
    b,
    aa,
    rest,
    xq,
    loc,
    locd,
    start,
    end,
    line,
    arr,
    brr,
    foo,
    bar,
    baz,
    third,
    xx,
    yy,
    arr2,
    rest2,
    c,
    xyz,
  ]),
  edges,
};