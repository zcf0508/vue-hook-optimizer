import { parse, analyzeSetupScript, analyzeTemplate, getVisData } from 'vue-hook-optimizer';

export default defineEventHandler(async (ctx) => {
  const { code } = await readBody(ctx);
  try {
    const sfc = parse(code);

    if(!sfc.descriptor.scriptSetup?.content) {
      return {
        msg: 'No <script setup> found',
        data: null,
      };
    }
    const graph = analyzeSetupScript(sfc.descriptor.scriptSetup?.content!);

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
