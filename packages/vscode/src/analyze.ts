import type {
  CommunityResult,
  RelationType,
  TypedNode,
} from '../../../packages/core/src';
import {
  analyzeHook,
  analyzeOptions,
  analyzeSetupScript,
  analyzeStyle,
  analyzeTemplate,
  analyzeTsx,
  detectCommunities,
  gen,
  getMermaidText,
  getVisData,
  parse,
} from '../../../packages/core/src';

function isHookCode(code: string): boolean {
  return /export\s+(?:function|const|let|var)\s+use[A-Z]/.test(code);
}

export async function analyze(code: string, language: 'vue' | 'react') {
  let graph = {
    nodes: new Set<TypedNode>(),
    edges: new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>(),
  };
  let nodesUsedInTemplate = new Set<string>();
  let nodesUsedInStyle = new Set<string>();

  // Auto-detect hook code: non-vue content with use* exports
  if (!code.trim().startsWith('<') && isHookCode(code)) {
    const results = analyzeHook(code, 0, language);
    const first = results[0];

    if (!first) {
      return { code: 1, data: null, msg: 'No hooks found' };
    }

    const allUsed = first.nodesUsedInReturn;
    const communityResult = detectCommunities(first.graph.edges);

    return { code: 0, data: {
      vis: getVisData(first.graph, allUsed, undefined, 'return'),
      suggests: gen(first.graph, allUsed),
      mermaid: getMermaidText(first.graph, allUsed),
      communities: communityResult,
      graph: first.graph,
      _allHooks: results.map(r => ({
        hookName: r.hookName,
        vis: getVisData(r.graph, r.nodesUsedInReturn, undefined, 'return'),
        mermaid: getMermaidText(r.graph, r.nodesUsedInReturn),
        suggests: gen(r.graph, r.nodesUsedInReturn),
      })),
    }, msg: `Found ${results.length} hook(s): ${results.map(r => r.hookName).join(', ')}` };
  }

  if (language === 'vue') {
    const sfc = parse(code);

    if (sfc.descriptor.scriptSetup?.content) {
      graph = analyzeSetupScript(
        sfc.descriptor.scriptSetup?.content || '',
        (sfc.descriptor.scriptSetup.loc.start.line || 1) - 1,
        (sfc.descriptor.scriptSetup.lang === 'tsx' || sfc.descriptor.scriptSetup.lang === 'jsx'),
      );
    }
    else if (sfc.descriptor.script?.content) {
      const res = analyzeOptions(
        sfc.descriptor.script?.content || '',
        (sfc.descriptor.script.loc.start.line || 1) - 1,
        (sfc.descriptor.script.lang === 'tsx' || sfc.descriptor.script.lang === 'jsx'),
      );
      graph = res.graph;
      nodesUsedInTemplate = res.nodesUsedInTemplate;
    }
    else {
      try {
        const res = analyzeOptions(
          code,
          0,
          true,
        );
        graph = res.graph;
        nodesUsedInTemplate = res.nodesUsedInTemplate;
      }
      catch (e) {
        console.log(e);
      }
    }

    try {
      if (sfc.descriptor.template?.content) {
        nodesUsedInTemplate = analyzeTemplate(sfc.descriptor.template!.content);
      }
    }
    catch (e) {
      console.log(e);
    }

    try {
      nodesUsedInStyle = analyzeStyle(sfc.descriptor.styles);
    }
    catch (e) {
      // console.log(e);
    }
  }

  if (language === 'react') {
    const res = await analyzeTsx(
      code,
      'react',
      0,
    );
    graph = res.graph;
    nodesUsedInTemplate = res.nodesUsedInTemplate;
  }

  const communityResult = detectCommunities(graph.edges);

  return { code: 0, data: {
    vis: getVisData(graph, nodesUsedInTemplate, nodesUsedInStyle),
    suggests: gen(graph, nodesUsedInTemplate, nodesUsedInStyle),
    mermaid: getMermaidText(graph, nodesUsedInTemplate, nodesUsedInStyle),
    communities: communityResult,
    graph,
  }, msg: 'ok' };
}
