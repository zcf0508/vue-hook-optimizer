import { 
  parse, 
  analyzeSetupScript, 
  analyzeOptions, 
  analyzeTemplate, 
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
  if(sfc.descriptor.scriptSetup?.content) {
    graph = analyzeSetupScript(sfc.descriptor.scriptSetup?.content!);
  }
  else if(sfc.descriptor.script?.content) {
    graph = analyzeOptions(sfc.descriptor.script?.content!);
  }

  let nodes = new Set<string>();
  try {
    nodes = analyzeTemplate(sfc.descriptor.template!.content);
  } catch(e) {
    console.log(e);
  }

  return { code: 0, data: {
    vis: getVisData(graph, nodes),
    suggest: gen(graph, nodes).map((s,idx) => `${idx + 1}: ${s.message}`).join('\n'),
  }, msg: 'ok'};
}