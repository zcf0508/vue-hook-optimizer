import type { TypedNode } from 'vue-hook-optimizer';
import { analyze, createEslintRule } from '../utils';
import { PluginOptions } from '../types';

export const RULE_NAME = 'linear-path';
export type MessageIds = 'maybeCanRefactor';

export default createEslintRule<PluginOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Nodes are have function chain calls, perhaps you can refactor it.',
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
      maybeCanRefactor: 'Nodes [{{ name }}] are have function chain calls, perhaps you can refactor it.',
    },
  },
  defaultOptions: [
    { framework: 'vue' },
  ],
  create: (context) => {
    const analysisResult = analyze(context);

    return {
      Identifier(node) {
        if (analysisResult) {
          analysisResult.forEach((s) => {
            if (s.message.includes('are have function chain calls')) {
              if (Array.isArray(s.nodeInfo)) {
                s.nodeInfo.forEach((nodeInfo) => {
                  if (
                    node.loc.start.line === nodeInfo?.info?.line
                    && node.loc.start.column === nodeInfo?.info?.column
                  ) {
                    context.report({
                      node,
                      messageId: 'maybeCanRefactor',
                      loc: {
                        start: node.loc.end,
                        end: node.loc.start,
                      },
                      data: {
                        name: (s.nodeInfo as TypedNode[] || []).map(n => n.label).join(',') || '',
                      },
                    });
                  }
                });
              }
            }
          });
        }
      },
    };
  },
});
