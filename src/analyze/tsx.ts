import { transformAsync } from '@babel/core';
import _traverse, { NodePath, Scope } from '@babel/traverse';
import * as t from '@babel/types';
import { NodeCollection, getComment } from './utils';
// @ts-ignore
import bts from '@babel/plugin-transform-typescript';
import { 
  traverse, 
  IAddNode,
  IAddEdge, 
  IReturnData,
  parseNodeIdentifierPattern, 
  parseNodeObjectPattern,
  parseNodeArrayPattern,
  parseNodeFunctionPattern,
  parseEdgeLeftIdentifierPattern,
  parseEdgeLeftObjectPattern,
  parseEdgeLeftArrayPattern,
  parseEdgeFunctionPattern,
  parseReturnJsxPattern,
  IUsedNode,
  traverseSetup,
  collectionSpread,
  addIdentifiesToGraphByScanReturn,
  addSpreadToGraphByScanReturn,
  addGraphBySpreadIdentifier,
} from '../utils/traverse';

interface IProcessMain {
  node: t.Node, 
  lineOffset?: number, 
  addInfo?: boolean,
}

interface IProcessBranch {
  node: t.ObjectExpression, 
  lineOffset?: number, 
  addInfo?: boolean, 
  parentScope?: Scope, 
  parentNode?: t.ExportDefaultDeclaration,
  parentPath: NodePath<t.ExportDefaultDeclaration>
  spread?: string[]
}

// deal when setup return object
function processByReturnNotJSX(params: IProcessBranch) {
  const {node, parentPath, lineOffset, addInfo} = params;
  const spread: string[] = [];

  const nodeCollection = new NodeCollection(lineOffset, addInfo);

  const graph = { 
    nodes: new Set<string>(), 
    edges: new Map<string, Set<string>>(), 
  };

  // 解析return, 收集spread
  const setupPath = traverseSetup({node, parentScope: parentPath.scope, parentPath});
    
  // setup return
  collectionSpread({path: setupPath, spread});
    
  // 收集除return之外的所有节点和边
  const {
    graph : {
      nodes: tempNodes,
      edges: tempEdges,
      spread: tempSpread,
    },
    nodeCollection: tempNodeCollection,
    nodesUsedInTemplate,
  } = processByReturnJSX({ node, parentPath, spread, lineOffset, addInfo });


  // 根据return信息添加必要节点
  addIdentifiesToGraphByScanReturn({
    path: setupPath,
    graph,
    nodeCollection,
    tempNodeCollection,
    tempEdges,
  });

  // 根据return信息添加必要节点
  addSpreadToGraphByScanReturn({
    path: setupPath,
    graph,
    nodeCollection,
    tempNodeCollection,
    tempEdges,
    tempSpread,
  });

  return {
    graph,
    nodeCollection,
    nodesUsedInTemplate,
  };
}

// deal when setup return jsx
function processByReturnJSX(params: IProcessBranch) {
  const {node, parentPath, spread = [], lineOffset, addInfo } = params;

  const nodeCollection = new NodeCollection(lineOffset, addInfo);
  const nodesUsedInTemplate = new Set<string>();

  const graph = { 
    nodes: new Set<string>(), 
    edges: new Map<string, Set<string>>(),
    spread: new Map<string, Set<string>>(),
  };

  function addNode ({ name, node, path, scope}: IAddNode, commentParentNode?: t.Node) {
    const binding = path.scope.getBinding(name);
    if (scope === binding?.scope) {
      graph.nodes.add(name);
      nodeCollection.addNode(name, node, {
        comment: commentParentNode ? getComment(commentParentNode) : '',
      });
      if(!graph.edges.get(name)) {
        graph.edges.set(name, new Set());
      }
    }
  }

  function addEdge ({ fromName, toName, path, scope, toScope, collectionNodes }: IAddEdge) {
    const bindingScope = toScope || path.scope.getBinding(toName)?.scope;
    if (scope === bindingScope && collectionNodes.has(toName)) {
      graph.edges.get(fromName)?.add(toName);
    }
  }

  function addUsed ({name, path, parentPath} : IUsedNode) {
    const binding = path.scope.getBinding(name);
    if (binding?.scope === parentPath.scope) {
      nodesUsedInTemplate.add(name);
    }
  }
  
  const setupPath = traverseSetup({node, parentScope: parentPath.scope, parentPath});
  const setupScope = setupPath.scope;
  const setupNode = setupPath.node;
  
  // 收集节点, 并收集spread依赖
  traverse(setupNode, {
    VariableDeclarator(path1) {
      parseNodeIdentifierPattern({
        path: path1, 
        rootScope: setupScope,
        cb: (params) => {
          if (!spread.includes(params.name)) {
            addNode(params, path1.node);
          } else {
            addGraphBySpreadIdentifier({
              path: path1,
              graph,
              nodeCollection,
              iname: params.name,
            });
          }
        },
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
  }, setupScope, setupPath);

  // 搜集jsx模版使用节点
  setupPath.traverse({
    ReturnStatement(path2) {
      // setup return jsx
      parseReturnJsxPattern({
        path: path2,
        parentPath: setupPath,
        cb: addUsed,
      });
    },
  });

  // 收集边
  traverse(setupNode, {
    VariableDeclarator(path1) {
      parseEdgeLeftIdentifierPattern({
        path: path1,
        rootScope: setupScope,
        collectionNodes: graph.nodes,
        cb: addEdge,
        spread,
      });
      
      parseEdgeLeftObjectPattern({
        path: path1,
        rootScope: setupScope,
        collectionNodes: graph.nodes,
        cb: addEdge,
      });

      parseEdgeLeftArrayPattern({
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
  }, setupScope, setupPath);

  return {
    graph,
    nodeCollection,
    nodesUsedInTemplate,
  };
  
}

export function processTsx(params : IProcessMain) {
  let result: IReturnData | undefined;
  
  function process(params: IProcessBranch) {
    const { node, parentPath } = params;
    // resolve `return` then determine use processByReturnJSX or processByReturnNotJSX
    const setupPath = traverseSetup({node, parentScope: parentPath.scope, parentPath});

    setupPath.traverse({
      ReturnStatement(path) {
        if (path.node.argument 
          && (path.node.argument.type === 'ArrowFunctionExpression'
          || path.node.argument.type === 'FunctionExpression')
          && (path.node.argument.body.type === 'JSXElement' 
          || path.node.argument.body.type === 'JSXFragment')
        ) {
          result = processByReturnJSX(params);
        } else {
          result = processByReturnNotJSX(params);
        }
      },
    });
  }
  
  traverse(params.node, {
    ExportDefaultDeclaration(path) {
      if(path.node.declaration.type === 'ObjectExpression') {
        // export default {}
        process({
          ...params,
          node: path.node.declaration, 
          parentNode: path.node,
          parentPath: path,
        });
      } else if(
        path.node.declaration.type === 'CallExpression' 
        && path.node.declaration.callee.type === 'Identifier'
        && path.node.declaration.callee.name === 'defineComponent'
        && path.node.declaration.arguments[0].type === 'ObjectExpression'
      ) {
        // export default defineComponent({})
        process({
          ...params,
          node: path.node.declaration.arguments[0], 
          parentNode: path.node,
          parentPath: path,
        });
      }
    },
  });
  
  return result!;
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
    const { graph, nodeCollection, nodesUsedInTemplate } = processTsx({
      node: res.ast,
      lineOffset,
      addInfo,
    });
    // ---
    return {
      graph: nodeCollection.map(graph),
      nodesUsedInTemplate,
    };
  }

  throw new Error('transpile error: can\'t find ast');
}
