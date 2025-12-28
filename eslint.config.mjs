// @ts-check
import antfu from '@antfu/eslint-config';
import pluginSecurity from 'eslint-plugin-security';
import pluginVueHookOptimizer from 'eslint-plugin-vue-hook-optimizer';

export default antfu({
  typescript: true,
  pnpm: true,
}, [
  {
    ignores: [
      'fixtures/**/*',
      'packages/core/test/output/**/*',
      'packages/playground/default-codes/**/*',
      'packages/vscode/src/generated-meta.ts',
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
      'vue-hook-optimizer/linear-path': ['warn', {
        framework: 'vue',
      }],
    },
  },
  {
    rules: {
      'curly': ['error', 'all'],
      'style/brace-style': 'error',
      'style/multiline-ternary': ['error', 'always'],
      'style/max-statements-per-line': ['warn', { max: 1 }],
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
          ignoreTemplateLiterals: true,
          ignoreComments: true,
        },
      ],
      'comma-dangle': ['error', 'always-multiline'],
      'style/quotes': ['error', 'single'],
      'pnpm/json-prefer-workspace-settings': 'off',
    },
  },
  {
    files: [
      'packages/vscode/package.json',
    ],
    rules: {
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    files: ['**/*.md'],
    rules: {
      'style/max-len': 'off',
    },
  },
]);
