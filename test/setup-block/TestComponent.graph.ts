import { NodeType } from '@/analyze/utils';

const edges = new Map<{label: string, type: NodeType}, Set<{label: string, type: NodeType}>>();

const route = {label: 'route', type: NodeType.var};
const path = {label: 'path', type: NodeType.var};
const lmsg = {label: 'lmsg', type: NodeType.var};
const data = {label: 'data', type: NodeType.var};
const age = {label: 'age', type: NodeType.var};
const addAge = {label: 'addAge', type: NodeType.fun};
const updateName = {label: 'updateName', type: NodeType.fun};
const funA = {label: 'funA', type: NodeType.fun};
const varB = {label: 'varB', type: NodeType.var};
const funC = {label: 'funC', type: NodeType.fun};
const varD = {label: 'varD', type: NodeType.var};
const varE = {label: 'varE', type: NodeType.var};


edges.set(route, new Set([]));
edges.set(route, new Set([]));
edges.set(path, new Set([route]));
edges.set(lmsg, new Set([]));
edges.set(data, new Set([]));
edges.set(age, new Set([]));
edges.set(addAge, new Set([age]));
edges.set(updateName, new Set([data]));
edges.set(funA, new Set([]));
edges.set(varB, new Set([funA]));
edges.set(funC, new Set([]));
edges.set(varD, new Set([funC, varB]));
edges.set(varE, new Set([funC, varB]));

export const graph = {
  nodes: new Set([route, path, lmsg, data, age, addAge, updateName, funA, varB, funC, varD, varE]),
  edges,
};