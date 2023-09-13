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

export default defineEventHandler(async (ctx) => {
  const { code } = await readBody(ctx);
  try {
    const sfc = parse(code);

    let graph = {
      nodes: new Set<TypedNode>(),
      edges: new Map<TypedNode, Set<TypedNode>>(),
    };
    let nodes = new Set<string>();

    if(sfc.descriptor.scriptSetup?.content) {
      graph = analyzeSetupScript(sfc.descriptor.scriptSetup?.content!);
    }
    else if(sfc.descriptor.script?.content) {
      if (sfc.descriptor.script.lang === 'tsx' || sfc.descriptor.script.lang === 'jsx') {
        const res = await analyzeTsx(sfc.descriptor.script?.content!);
        graph = res.graph;
        nodes = res.nodesUsedInTemplate;
      } else {
        graph = analyzeOptions(sfc.descriptor.script?.content!);
      }
    }
    

    try {
      if (sfc.descriptor.template?.content) {
        nodes = analyzeTemplate(sfc.descriptor.template!.content);
      }
    } catch(e) {
      console.log(e);
    }

    return {
      msg: '',
      data: getVisData(graph, nodes),
      suggests: gen(graph, nodes),
    };
  } catch (e) {
    console.log(e);
    return {
      msg: 'Some error',
      data: null,
      suggests: '',
    };
  }
});
