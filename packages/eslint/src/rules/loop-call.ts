import { TypedNode } from 'vue-hook-optimizer';
import { analyze, createEslintRule } from '../utils';

export const RULE_NAME = 'loop-call';
export type MessageIds = 'maybeCanRefactor';

export default createEslintRule<PluginOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'There is a loop call, perhaps you can refactor it.',
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
      maybeCanRefactor: 'There is a loop call in nodes [{{ name }}], perhaps you can refactor it.',
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
            if (s.message.includes('There is a loop call')) {
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
                })
              }
            }
          });
        }
      },
    };
  },
});
