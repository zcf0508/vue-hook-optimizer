import type { ESLint, Linter } from 'eslint';
import { version } from '../package.json';
import notUsed from './rules/not-used';

const plugin = {
  meta: {
    name: 'vue-hook-optimizer',
    version,
  },
  rules: {
    'not-used': notUsed,
  },
} satisfies ESLint.Plugin;

export default plugin;

type RuleDefinitions = typeof plugin['rules'];

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K]['defaultOptions']
};

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>
};
