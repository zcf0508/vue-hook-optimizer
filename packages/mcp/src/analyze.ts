import type {
  RelationType,
  TypedNode,
} from 'vue-hook-optimizer';
import {
  analyzeOptions,
  analyzeSetupScript,
  analyzeStyle,
  analyzeTemplate,
  analyzeTsx,
  gen,
  getMermaidText,
  parse,
} from 'vue-hook-optimizer';

export async function analyze(code: string, language: 'vue' | 'react') {
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
    mermaid: getMermaidText(graph, nodesUsedInTemplate, nodesUsedInStyle),
    suggests: gen(graph, nodesUsedInTemplate, nodesUsedInStyle, {
      ellipsis: false,
    }),
  };
}
