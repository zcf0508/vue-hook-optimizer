import { 
  parse, 
  analyzeSetupScript, 
  analyzeOptions, 
  analyzeTemplate,
  analyzeTsx,
  getVisData,
  gen,
  TypedNode,
} from 'vue-hook-optimizer';

export async function analyze(code: string, language: 'vue' | 'react') {
  let graph = {
    nodes: new Set<TypedNode>(),
    edges: new Map<TypedNode, Set<TypedNode>>(),
  };
  let nodes = new Set<string>();

  if(language === 'vue') {
    const sfc = parse(code);
    
    if(sfc.descriptor.scriptSetup?.content) {
      graph = analyzeSetupScript(
        sfc.descriptor.scriptSetup?.content!,
        (sfc.descriptor.scriptSetup.loc.start.line || 1) - 1,
        (sfc.descriptor.scriptSetup.lang === 'tsx' || sfc.descriptor.scriptSetup.lang === 'jsx')
      );
    }
    else if(sfc.descriptor.script?.content) {
      const res = analyzeOptions(
        sfc.descriptor.script?.content!,
        (sfc.descriptor.script.loc.start.line || 1) - 1,
        (sfc.descriptor.script.lang === 'tsx' || sfc.descriptor.script.lang === 'jsx')
      );
      graph = res.graph;
      nodes = res.nodesUsedInTemplate;
    }  else {
      try {
        const res = analyzeOptions(
          code,
          0, 
          true
        );
        graph = res.graph;
        nodes = res.nodesUsedInTemplate;
      } catch(e) {
        console.log(e);
      }
    }

    try {
      if (sfc.descriptor.template?.content) {
        nodes = analyzeTemplate(sfc.descriptor.template!.content);
      }
    } catch(e) {
      console.log(e);
    }
  }
  if(language === 'react') {
    const res = await analyzeTsx(
      code, 
      'react',
      0,
    );
    graph = res.graph;
    nodes = res.nodesUsedInTemplate;
  }

  return { code: 0, data: {
    vis: getVisData(graph, nodes),
    suggests: gen(graph, nodes),
  }, msg: 'ok'};
}
