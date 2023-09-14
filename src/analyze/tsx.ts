import { transformAsync } from '@babel/core';
import _traverse, { NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import { NodeCollection } from './utils';
// @ts-ignore
import bts from '@babel/plugin-transform-typescript';
import { 
  traverse, 
  IAddNode,
  IAddEdge, 
  parseNodeIdentifierPattern, 
  parseNodeObjectPattern,
  parseNodeArrayPattern,
  parseNodeFunctionPattern,
  parseEdgeIdentifierPattern,
  parseEdgeObjectPattern,
  parseEdgeArrayPattern,
  parseEdgeFunctionPattern,
  parseReturnJsxPattern,
  IUsedNode,
  parseReturnObjectPattern,
} from '@/utils/traverse';


export function processTsx(ast: t.Node, lineOffset = 0, addInfo = true, 
  parentScope?: Scope, parentPath?: t.Node, _spread?: string[]) {
  
  const nodeCollection = new NodeCollection(lineOffset, addInfo);

  const nodesUsedInTemplate = new Set<string>();

  const graph = { 
    nodes: new Set<string>(), 
    edges: new Map<string, Set<string>>(),
  };

  function addNode ({ name, node, path, scope}: IAddNode) {
    const binding = path.scope.getBinding(name);
    if (scope === binding?.scope) {
      graph.nodes.add(name);
      nodeCollection.addNode(name, node);
      if(!graph.edges.get(name)) {
        graph.edges.set(name, new Set());
      }
    }
  }

  function addEdge ({ fromName, toName, path, scope, collectionNodes }: IAddEdge) {
    const binding = path.scope.getBinding(toName);
    if (scope === binding?.scope && collectionNodes.has(toName)) {
      graph.edges.get(fromName)?.add(toName);
    }
  }

  function addUsed ({name, path, parentPath} : IUsedNode) {
    const binding = path.scope.getBinding(name);
    if (binding?.scope === parentPath.scope) {
      nodesUsedInTemplate.add(name);
    }
  }

  function process(node: t.ObjectExpression, path: NodePath<t.ExportDefaultDeclaration>) {
    // 收集节点
    traverse(node, {
      ObjectMethod(path1) {
        if (
          (
            path.node.declaration.type === 'ObjectExpression' 
            && path1.parent === path.node.declaration
          ) || (
            path.node.declaration.type === 'CallExpression' 
            && path1.parent === path.node.declaration.arguments[0]
          )
        ) {
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'setup') {
            // setup
            const setupScope = path1.scope;
            traverse(path1.node, {
              VariableDeclarator(path1) {
                parseNodeIdentifierPattern({
                  path: path1, 
                  rootScope: setupScope,
                  cb: addNode,
                });

                parseNodeObjectPattern({
                  path: path1,
                  rootScope: setupScope,
                  cb: addNode,
                });

                parseNodeArrayPattern({
                  path: path1,
                  rootScope: setupScope,
                  cb: addNode,
                });
              },
              FunctionDeclaration(path1) {
                parseNodeFunctionPattern({
                  path: path1,
                  rootScope: setupScope,
                  cb: addNode,
                });
              },
            }, setupScope, path1);

            // setup return
            path1.traverse({
              ReturnStatement(path2) {
                // setup return jsx
                parseReturnJsxPattern({
                  path: path2,
                  parentPath: path1,
                  cb: addUsed,
                });
                // setup return Object
                parseReturnObjectPattern({
                  path: path2,
                  parentPath: path1,
                  // TODO
                  cb: addUsed,
                });
              },
            });
          }
        }
      },
    }, path.scope, path);

    // 收集边
    traverse(node, {
      ObjectMethod(path1) {
        if (
          (path.node.declaration.type === 'ObjectExpression' && path1.parent === path.node.declaration)
          || 
          (path.node.declaration.type === 'CallExpression' && path1.parent === path.node.declaration.arguments[0])
        ) {
          if(path1.node.key.type === 'Identifier' && path1.node.key.name === 'setup') {
            // setup
            const setupScope = path1.scope;
            traverse(path1.node, {
              VariableDeclarator(path1) {
                parseEdgeIdentifierPattern({
                  path: path1,
                  rootScope: setupScope,
                  collectionNodes: graph.nodes,
                  cb: addEdge,
                });
                
                parseEdgeObjectPattern({
                  path: path1,
                  rootScope: setupScope,
                  collectionNodes: graph.nodes,
                  cb: addEdge,
                });

                parseEdgeArrayPattern({
                  path: path1,
                  rootScope: setupScope,
                  collectionNodes: graph.nodes,
                  cb: addEdge,
                });
              },
              FunctionDeclaration(path1) {
                parseEdgeFunctionPattern({
                  path: path1,
                  rootScope: setupScope,
                  collectionNodes: graph.nodes,
                  cb: addEdge,
                });
              },
            }, setupScope, path1);
          }
        } 
      },
    }, path.scope, path);
    
  }
  
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      // export default {}
      if(path.node.declaration.type === 'ObjectExpression') {
        process(path.node.declaration, path);
      }
      // export default defineComponent({})
      else if(path.node.declaration.type === 'CallExpression' 
        && path.node.declaration.callee.type === 'Identifier'
        && path.node.declaration.callee.name === 'defineComponent'
        && path.node.declaration.arguments[0].type === 'ObjectExpression'
      ) {
        process(path.node.declaration.arguments[0], path);
      }
    },
  });
  

  return {
    graph,
    nodeCollection,
    nodesUsedInTemplate,
  };
}


export async function analyze(
  content: string,
  lineOffset = 0,
  addInfo = true,
) {

  // console.log(content);
  const res = await transformAsync(content, {
    babelrc: false,
    ast: true,
    sourceMaps: false,
    configFile: false,
    plugins: [
      [
        bts,
        {
          isTSX: true, 
          allowExtensions: true,
        },
      ],
    ],
  });

  if (res && res.ast) {
    const { graph, nodeCollection, nodesUsedInTemplate } = processTsx(res.ast, lineOffset, addInfo);
    // ---
    return {
      graph: nodeCollection.map(graph),
      nodesUsedInTemplate,
    };
  }

  throw new Error('transpile error: can\'t find ast');
}
