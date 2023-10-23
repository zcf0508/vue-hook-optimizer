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
  const { code, framework } = await readBody<{code: string, framework: 'vue' | 'react'}>(ctx);
  let graph = {
    nodes: new Set<TypedNode>(),
    edges: new Map<TypedNode, Set<TypedNode>>(),
  };
  let nodes = new Set<string>();

  try {

    if(framework === 'vue') {
      
      const sfc = parse(code);

      if(sfc.descriptor.scriptSetup?.content) {
        graph = analyzeSetupScript(
          sfc.descriptor.scriptSetup?.content!,
          0,
          (sfc.descriptor.scriptSetup.lang === 'tsx' || sfc.descriptor.scriptSetup.lang === 'jsx')
        );
      }
      else if(sfc.descriptor.script?.content) {
        if (
          (sfc.descriptor.script.lang === 'tsx' || sfc.descriptor.script.lang === 'jsx') 
          && !sfc.descriptor.template?.content
        ) {
          const res = await analyzeTsx(sfc.descriptor.script?.content!);
          graph = res.graph;
          nodes = res.nodesUsedInTemplate;
        } else {
          graph = analyzeOptions(
            sfc.descriptor.script?.content!, 
            0, 
            (sfc.descriptor.script.lang === 'tsx' || sfc.descriptor.script.lang === 'jsx')
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
    }
    
    if(framework === 'react') {
      const res = await analyzeTsx(
        code, 
        'react',
        0,
      );
      graph = res.graph;
      nodes = res.nodesUsedInTemplate;
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
