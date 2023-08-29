import { parse, analyzeSetupScript, analyzeOptions, analyzeTemplate, getVisData } from 'vue-hook-optimizer';

export async function analyze(code: string) {
  const sfc = parse(code);

  let graph = {
    nodes: new Set<{
      label: string;
      type: string;
    }>(),
    edges: new Map<{
        label: string;
        type: string;
    }, Set<{
      label: string;
      type: string;
    }>>(),
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

  return { code: 0, data: getVisData(graph, nodes), msg: 'ok'};
}