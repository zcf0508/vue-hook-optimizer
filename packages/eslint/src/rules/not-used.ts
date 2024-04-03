import { analyze, createEslintRule } from '../utils';

export const RULE_NAME = 'not-used';
export type MessageIds = 'maybeCanRemove';

export default createEslintRule<PluginOptions, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
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
      maybeCanRemove: 'Node [{{name}}] not used, perhaps you can remove it.',
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
              if (!Array.isArray(s.nodeInfo)) {
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
