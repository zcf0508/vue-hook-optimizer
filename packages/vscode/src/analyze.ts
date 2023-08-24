import { parse, analyzeSetupScript, analyzeTemplate, getVisData } from 'vue-hook-optimizer';

export async function analyze(code: string) {
  const sfc = parse(code);

  if(!sfc.descriptor.scriptSetup?.content) {
    return {code: -1, data: null, msg: 'No <script setup> found'};
  }

  const graph = analyzeSetupScript(sfc.descriptor.scriptSetup?.content!);

  let nodes = new Set<string>();
  try {
    nodes = analyzeTemplate(sfc.descriptor.template!.content);
  } catch(e) {
    console.log(e);
  }

  return { code: 0, data: getVisData(graph, nodes), msg: 'ok'};
}