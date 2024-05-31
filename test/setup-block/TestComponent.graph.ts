import type { TypedNode } from '@/analyze/utils';
import { NodeType } from '@/analyze/utils';

const edges = new Map<TypedNode, Set<TypedNode>>();

const route: TypedNode = { label: 'route', type: NodeType.var, info: { line: 7, column: 6, comment: 'route' } };
const path: TypedNode = { label: 'path', type: NodeType.var, info: { line: 9, column: 6, used: new Set(['watch']), comment: 'path' } };
const lmsg: TypedNode = { label: 'lmsg', type: NodeType.var, info: { line: 11, column: 6, used: new Set(['watch']) } };
const data: TypedNode = { label: 'data', type: NodeType.var, info: { line: 19, column: 6, comment: '这是注释11' } };
const age: TypedNode = { label: 'age', type: NodeType.var, info: { line: 23, column: 6 } };
const addAge: TypedNode = { label: 'addAge', type: NodeType.fun, info: { line: 28, column: 9 } };
const updateName: TypedNode = { label: 'updateName', type: NodeType.fun, info: { line: 32, column: 6 } };
const funA: TypedNode = { label: 'funA', type: NodeType.fun, info: { line: 36, column: 9 } };
const varB: TypedNode = { label: 'varB', type: NodeType.var, info: { line: 43, column: 8 } };
const funC: TypedNode = { label: 'funC', type: NodeType.fun, info: { line: 45, column: 9, comment: '这是注释', used: new Set(['onMounted', 'provide']) } };
const varD: TypedNode = { label: 'varD', type: NodeType.var, info: { line: 52, column: 8 } };
const varE: TypedNode = { label: 'varE', type: NodeType.var, info: { line: 52, column: 14 } };
const restArr: TypedNode = { label: 'restArr', type: NodeType.var, info: { line: 25, column: 10 } };
const restObj: TypedNode = { label: 'restObj', type: NodeType.var, info: { line: 26, column: 11 } };

edges.set(route, new Set([]));
edges.set(route, new Set([]));
edges.set(path, new Set([route]));
edges.set(lmsg, new Set([path]));
edges.set(data, new Set([]));
edges.set(age, new Set([]));
edges.set(restArr, new Set([]));
edges.set(restObj, new Set([]));
edges.set(addAge, new Set([age]));
edges.set(updateName, new Set([data]));
edges.set(funA, new Set([]));
edges.set(varB, new Set([funA]));
edges.set(funC, new Set([funC]));
edges.set(varD, new Set([funC, varB]));
edges.set(varE, new Set([funC, varB]));

export const graph = {
  nodes: new Set([route, path, lmsg, data, age, addAge, updateName, funA, varB, funC, varD, varE, restArr, restObj]),
  edges,
};
