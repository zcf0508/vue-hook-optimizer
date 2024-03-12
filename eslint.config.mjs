import process from 'node:process';
import antfu from '@antfu/eslint-config';
import pluginSecurity from 'eslint-plugin-security';
import pluginVueHookOptimizer from 'eslint-plugin-vue-hook-optimizer';

export default antfu({
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
      'vue-hook-optimizer/not-used-in-template': ['warn', {
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
        },
      ],
      'comma-dangle': ['error', 'always-multiline'],
      'style/quotes': ['error', 'single'],
    },
  },
]);
