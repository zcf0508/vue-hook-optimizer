import type { ESLint, Linter } from 'eslint';
import { version } from '../package.json';
import notUsedInTemplate from './rules/not-used-in-template';

const plugin = {
  meta: {
    name: 'vue-hook-optimizer',
    version,
  },
  rules: {
    'not-used-in-template': notUsedInTemplate,
  },
} satisfies ESLint.Plugin;

export default plugin;

type RuleDefinitions = typeof plugin['rules']

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K]['defaultOptions']
}

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>
}