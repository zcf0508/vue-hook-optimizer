import type { RuleListener, RuleWithMeta, RuleWithMetaAndName } from '@typescript-eslint/utils/eslint-utils';
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import type { Rule } from 'eslint';
import type { RelationType, TypedNode } from 'vue-hook-optimizer';
import {
  analyzeOptions,
  analyzeSetupScript,
  analyzeStyle,
  analyzeTemplate,
  analyzeTsx,
  gen,
  parse,
} from 'vue-hook-optimizer';
import { PluginOptions } from './types';

const hasDocs = [
  'not-used',
  'loop-call',
];

const blobUrl = 'https://github.com/zcf0508/vue-hook-optimizer/tree/master/packages/eslint/src/rules/';

export interface RuleModule<
  T extends readonly unknown[],
> extends Rule.RuleModule {
  defaultOptions: T
}

/**
 * Creates reusable function to create rules with default options and docs URLs.
 *
 * @param urlCreator Creates a documentation URL for a given rule name.
 * @returns Function to create a rule with the docs URL format.
 */
function RuleCreator(urlCreator: (ruleName: string) => string) {
  // This function will get much easier to call when this is merged https://github.com/Microsoft/TypeScript/pull/26349
  // TODO - when the above PR lands; add type checking for the context.report `data` property
  return function createNamedRule<
    TOptions extends readonly unknown[],
    TMessageIds extends string,
  >({
    name,
    meta,
    ...rule
  }: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>): RuleModule<TOptions> {
    return createRule<TOptions, TMessageIds>({
      meta: {
        ...meta,
        docs: {
          ...meta.docs,
          url: urlCreator(name),
        },
      },
      ...rule,
    });
  };
}

/**
 * Creates a well-typed TSESLint custom ESLint rule without a docs URL.
 *
 * @returns Well-typed TSESLint custom ESLint rule.
 * @remarks It is generally better to provide a docs URL function to RuleCreator.
 */
function createRule<
  TOptions extends readonly unknown[],
  TMessageIds extends string,
>({
  create,
  defaultOptions,
  meta,
}: Readonly<RuleWithMeta<TOptions, TMessageIds>>): RuleModule<TOptions> {
  return {
    create: ((
      context: Readonly<RuleContext<TMessageIds, TOptions>>,
    ): RuleListener => {
      const optionsWithDefault = context.options.map((options, index) => {
        return {
          ...defaultOptions[index] || {},
          ...options || {},
        };
      }) as unknown as TOptions;
      return create(context, optionsWithDefault);
    }) as any,
    defaultOptions,
    meta: meta as any,
  };
}

export const createEslintRule = RuleCreator(
  ruleName => hasDocs.includes(ruleName)
    ? `${blobUrl}${ruleName}.md`
    : `${blobUrl}${ruleName}.test.ts`,
) as any as <
  TOptions extends readonly unknown[],
  TMessageIds extends string,
>({ name, meta, ...rule }: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>
) => RuleModule<TOptions>;

const warned = new Set<string>();

export function warnOnce(message: string) {
  if (warned.has(message)) {
    return;
  }
  warned.add(message);
  console.warn(message);
}

export function analyze<TMessageIds extends string>(context: Readonly<RuleContext<TMessageIds, PluginOptions>>) {
  const code = context.sourceCode.text;
  const framework = context.options[0]?.framework || 'vue';

  let graph = {
    nodes: new Set<TypedNode>(),
    edges: new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>(),
  };
  let nodesUsedInTemplate = new Set<string>();
  let nodesUsedInStyle = new Set<string>();

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
        nodesUsedInTemplate = res.nodesUsedInTemplate;
      }
      else {
        try {
          const res = analyzeOptions(
            code,
            0,
            true,
          );
          graph = res.graph;
          nodesUsedInTemplate = res.nodesUsedInTemplate;
        }
        catch (e) {
          // console.log(e);
        }
      }

      try {
        if (sfc.descriptor.template?.content) {
          nodesUsedInTemplate = analyzeTemplate(sfc.descriptor.template!.content);
        }
      }
      catch (e) {
        // console.log(e);
      }

      try {
        nodesUsedInStyle = analyzeStyle(sfc.descriptor.styles);
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
      nodesUsedInTemplate = res.nodesUsedInTemplate;
    }

    return gen(graph, nodesUsedInTemplate, nodesUsedInStyle);
  }
  catch (e) {
    // console.log(e);
    return null;
  }
}
