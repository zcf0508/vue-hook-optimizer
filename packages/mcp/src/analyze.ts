import type {
  RelationType,
  TypedNode,
} from 'vue-hook-optimizer';
import type { Suggestion } from '../../../packages/core/src/suggest';
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
  parse,
} from 'vue-hook-optimizer';

interface CommunityInfo {
  id: number
  size: number
  members: Array<{ name: string, type: string, line?: number }>
}

function formatCommunities(
  communityResult: { communities: Array<{ id: number, nodes: Set<TypedNode> }> },
): CommunityInfo[] {
  return communityResult.communities
    .filter(c => c.nodes.size > 1)
    .map((c) => {
      const nodes = Array.from(c.nodes).sort((a, b) => {
        const lineA = a.info?.line ?? Infinity;
        const lineB = b.info?.line ?? Infinity;
        return lineA - lineB;
      });
      return {
        id: c.id,
        size: c.nodes.size,
        members: nodes.map(n => ({
          name: n.label,
          type: n.type,
          line: n.info?.line,
        })),
      };
    });
}

interface ComponentResult {
  type: 'component'
  mermaid: string
  suggests: Suggestion[]
  communities: CommunityInfo[]
}

interface HookItem {
  name: string
  mermaid: string
  suggests: Suggestion[]
  communities: CommunityInfo[]
}

interface HookFileResult {
  type: 'hook-file'
  hooks: HookItem[]
}

export type AnalyzeResult = ComponentResult | HookFileResult;

function isHookCode(code: string): boolean {
  return /export\s+(?:function|const|let|var)\s+use[A-Z]/.test(code);
}

function analyzeOne(
  graph: { nodes: Set<TypedNode>, edges: Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>> },
  used: Set<string>,
) {
  const communities = formatCommunities(detectCommunities(graph.edges));
  return {
    mermaid: getMermaidText(graph, used),
    suggests: gen(graph, used, undefined, { ellipsis: false }),
    communities,
  };
}

export async function analyze(code: string, language: 'vue' | 'react'): Promise<AnalyzeResult> {
  if (!code.trim().startsWith('<') && isHookCode(code)) {
    const results = analyzeHook(code, 0, language);
    const hooks: HookItem[] = results.map(result => ({
      name: result.hookName,
      ...analyzeOne(result.graph, result.nodesUsedInReturn),
    }));

    return { type: 'hook-file', hooks };
  }

  let graph = {
    nodes: new Set<TypedNode>(),
    edges: new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>(),
  };
  let nodesUsedInTemplate = new Set<string>();
  let nodesUsedInStyle = new Set<string>();

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

  return {
    type: 'component',
    ...analyzeOne(graph, new Set([...nodesUsedInTemplate, ...nodesUsedInStyle])),
  };
}
