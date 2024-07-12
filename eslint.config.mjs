// @ts-check
/// <reference path="./eslint-typegen.d.ts" />

import antfu from '@antfu/eslint-config';
import typegen from 'eslint-typegen';
import pluginSecurity from 'eslint-plugin-security';
import pluginVueHookOptimizer from 'eslint-plugin-vue-hook-optimizer';

export default typegen(antfu({
  typescript: true,
}, [
  {
    ignores: [
      'test/**/*.vue',
      'test/**/*.jsx',
      'public/**/*',
      'components/ui/**/*',
    ],
  },
  pluginSecurity.configs.recommended,
  {
    plugins: {
      'vue-hook-optimizer': pluginVueHookOptimizer,
    },
    rules: {
      'vue-hook-optimizer/not-used': ['warn', {
        framework: 'vue',
      }],
      'vue-hook-optimizer/loop-call': ['warn', {
        framework: 'vue',
      }],
    },
  },
  {
    rules: {
      'curly': ['error', 'all'],
      'style/brace-style': 'error',
      'style/multiline-ternary': ['error', 'always'],
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': [
        'warn',
        { args: 'after-used', argsIgnorePattern: '^_', vars: 'all', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn'],
      'style/semi': ['error', 'always'],
      'style/indent': ['error', 2, { SwitchCase: 1 }],
      'style/max-len': [
        'error',
        {
          code: 120,
          tabWidth: 2,
          ignoreRegExpLiterals: true,
          ignoreStrings: true,
          ignoreUrls: true,
          ignoreComments: true,
        },
      ],
      'comma-dangle': ['error', 'always-multiline'],
      'style/quotes': ['error', 'single'],
    },
  },
]));
