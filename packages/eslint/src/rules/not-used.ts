import type { TypedNode } from 'vue-hook-optimizer';
import type { PluginOptions } from '../types';
import { analyze, createEslintRule } from '../utils';

export const RULE_NAME = 'not-used';
export type MessageIds = 'maybeCanRemove';

export default createEslintRule<PluginOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'This node may not be used in the template.',
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
      maybeCanRemove: 'Node [{{name}}] {{ be }} not used, perhaps you can remove {{ pronoun }}.',
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
            if (s.message.includes('not used, perhaps you can remove')) {
              if (Array.isArray(s.nodeInfo)) {
                s.nodeInfo.forEach((nodeInfo) => {
                  if (
                    node.loc.start.line === nodeInfo?.info?.line
                    && node.loc.start.column === nodeInfo?.info?.column
                  ) {
                    context.report({
                      node,
                      messageId: 'maybeCanRemove',
                      loc: {
                        start: node.loc.end,
                        end: node.loc.start,
                      },
                      data: {
                        name: (s.nodeInfo as TypedNode[] || []).map(n => n.label).join(',') || '',
                        be: 'are',
                        pronoun: 'them',
                      },
                    });
                  }
                });
              }
              else {
                if (
                  node.loc.start.line === s.nodeInfo?.info?.line
                  && node.loc.start.column === s.nodeInfo?.info?.column
                ) {
                  context.report({
                    node,
                    messageId: 'maybeCanRemove',
                    loc: {
                      start: node.loc.end,
                      end: node.loc.start,
                    },
                    data: {
                      name: s.nodeInfo?.label || '',
                      be: 'is',
                      pronoun: 'it',
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
