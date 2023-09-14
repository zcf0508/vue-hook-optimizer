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

export async function analyze(code: string) {
  const sfc = parse(code);

  let graph = {
    nodes: new Set<TypedNode>(),
    edges: new Map<TypedNode, Set<TypedNode>>(),
  };
  let nodes = new Set<string>();

  if(sfc.descriptor.scriptSetup?.content) {
    graph = analyzeSetupScript(
      sfc.descriptor.scriptSetup?.content!,
      (sfc.descriptor.scriptSetup.loc.start.line || 1) - 1,
    );
  }
  else if(sfc.descriptor.script?.content) {
    if (
      (sfc.descriptor.script.lang === 'tsx' || sfc.descriptor.script.lang === 'jsx')
      && !sfc.descriptor.template?.content
    ) {
      const res = await analyzeTsx(sfc.descriptor.script?.content!,
        (sfc.descriptor.script.loc.start.line || 1) - 1,
      );
      graph = res.graph;
      nodes = res.nodesUsedInTemplate;
    } else {
      graph = analyzeOptions(
        sfc.descriptor.script?.content!,
        (sfc.descriptor.script.loc.start.line || 1) - 1,
      );
    }
  }

  try {
    if (sfc.descriptor.template?.content) {
      nodes = analyzeTemplate(sfc.descriptor.template!.content);
    }
  } catch(e) {
    console.log(e);
  }

  return { code: 0, data: {
    vis: getVisData(graph, nodes),
    suggests: gen(graph, nodes),
  }, msg: 'ok'};
}
