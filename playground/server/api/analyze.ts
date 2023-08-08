import { parse, analyzeSetupScript, analyzeTemplate, getVisData } from 'vue-hook-optimizer';

export default defineEventHandler(async (ctx) => {
  const { code } = await readBody(ctx);
  try {
    const sfc = parse(code);
    const graph = analyzeSetupScript(sfc.descriptor.scriptSetup?.content!);
    const nodes = analyzeTemplate(sfc.descriptor.template!.content);

    return {
      code: 0,
      data: getVisData(graph, nodes),
    };
  } catch (e) {
    console.log(e);
    return {
      code: -1,
      data: null,
    };
  }
});
