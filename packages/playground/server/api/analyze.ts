import { parse, analyzeSetupScript, analyzeOptions, analyzeTemplate, getVisData } from 'vue-hook-optimizer';

export default defineEventHandler(async (ctx) => {
  const { code } = await readBody(ctx);
  try {
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

    return {
      msg: '',
      data: getVisData(graph, nodes),
    };
  } catch (e) {
    console.log(e);
    return {
      msg: 'Some error',
      data: null,
    };
  }
});
