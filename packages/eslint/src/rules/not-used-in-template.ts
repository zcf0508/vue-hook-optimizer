import type {
  TypedNode,
} from 'vue-hook-optimizer';
import {
  analyzeOptions,
  analyzeSetupScript,
  analyzeTemplate,
  analyzeTsx,
  gen,
  parse,
} from 'vue-hook-optimizer';

import { createEslintRule } from '../utils';

export const RULE_NAME = 'not-used-in-template';
export type MessageIds = 'maybeMyRemove';
export type Options = [{
  framework: 'vue' | 'react'
}];

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'This node may not be used in the template',
      recommended: 'recommended',
    },
    schema: [{
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          enum: [
            'vue',
            'react',
          ],
        },
      },
    }],
    messages: {
      maybeMyRemove: 'Node [{{name}}] not used, perhaps you can remove it.',
    },
  },
  defaultOptions: [
    { framework: 'vue' },
  ],
  create: (context) => {
    function analyze() {
      const code = context.sourceCode.text;
      const framework = context.options[0]?.framework || 'vue';

      let graph = {
        nodes: new Set<TypedNode>(),
        edges: new Map<TypedNode, Set<TypedNode>>(),
      };
      let nodes = new Set<string>();

      try {
        if (framework === 'vue') {
          const sfc = parse(code);

          if (sfc.descriptor.scriptSetup?.content) {
            graph = analyzeSetupScript(
              sfc.descriptor.scriptSetup?.content || '',
              sfc.descriptor.scriptSetup?.loc.start.line || 0,
              (sfc.descriptor.scriptSetup.lang === 'tsx' || sfc.descriptor.scriptSetup.lang === 'jsx'),
            );
          }
          else if (sfc.descriptor.script?.content) {
            const res = analyzeOptions(
              sfc.descriptor.script?.content || '',
              sfc.descriptor.script?.loc.start.line || 0,
              (sfc.descriptor.script.lang === 'tsx' || sfc.descriptor.script.lang === 'jsx'),
            );
            graph = res.graph;
            nodes = res.nodesUsedInTemplate;
          }
          else {
            try {
              const res = analyzeOptions(
                code,
                0,
                true,
              );
              graph = res.graph;
              nodes = res.nodesUsedInTemplate;
            }
            catch (e) {
              // console.log(e);
            }
          }

          try {
            if (sfc.descriptor.template?.content) {
              nodes = analyzeTemplate(sfc.descriptor.template!.content);
            }
          }
          catch (e) {
            // console.log(e);
          }
        }

        if (framework === 'react') {
          const res = analyzeTsx(
            code,
            'react',
            0,
          );
          graph = res.graph;
          nodes = res.nodesUsedInTemplate;
        }

        return gen(graph, nodes);
      }
      catch (e) {
        // console.log(e);
        return null;
      }
    }

    const analysisResult = analyze();

    return {
      Identifier(node) {
        if (analysisResult) {
          analysisResult.forEach((s) => {
            if (s.message.includes('not used, perhaps you can remove')) {
              if (!Array.isArray(s.nodeInfo)) {
                if (
                  node.loc.start.line === s.nodeInfo?.info?.line
                  && node.loc.start.column === s.nodeInfo?.info?.column
                ) {
                  context.report({
                    node,
                    messageId: 'maybeMyRemove',
                    loc: {
                      start: node.loc.end,
                      end: node.loc.start,
                    },
                    data: {
                      name: s.nodeInfo?.label || '',
                    },
                  });
                }
              }
            }
          });
        }
      },
    };
  },
});
