import type {
  TypedNode,
} from 'vue-hook-optimizer';
import {
  analyzeOptions,
  analyzeSetupScript,
  analyzeStyle,
  analyzeTemplate,
  analyzeTsx,
  gen,
  getVisData,
  parse,
} from 'vue-hook-optimizer';

export default defineEventHandler(async (ctx) => {
  const { code, framework } = await readBody<{ code: string, framework: 'vue' | 'react' }>(ctx);
  let graph = {
    nodes: new Set<TypedNode>(),
    edges: new Map<TypedNode, Set<{ node: TypedNode, type: 'get' | 'set' }>>(),
  };
  let nodesUsedInTemplate = new Set<string>();
  let nodesUsedInStyle = new Set<string>();

  try {
    if (framework === 'vue') {
      const sfc = parse(code);

      if (sfc.descriptor.scriptSetup?.content) {
        graph = analyzeSetupScript(
          sfc.descriptor.scriptSetup?.content || '',
          0,
          (sfc.descriptor.scriptSetup.lang === 'tsx' || sfc.descriptor.scriptSetup.lang === 'jsx'),
        );
      }
      else if (sfc.descriptor.script?.content) {
        const res = analyzeOptions(
          sfc.descriptor.script?.content || '',
          0,
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

    if (framework === 'react') {
      const res = await analyzeTsx(
        code,
        'react',
        0,
      );
      graph = res.graph;
      nodesUsedInTemplate = res.nodesUsedInTemplate;
    }

    return {
      msg: '',
      data: getVisData(graph, nodesUsedInTemplate, nodesUsedInStyle),
      suggests: gen(graph, nodesUsedInTemplate, nodesUsedInStyle),
    };
  }
  catch (e) {
    console.log(e);
    return {
      msg: 'Some error',
      data: null,
      suggests: '',
    };
  }
});
