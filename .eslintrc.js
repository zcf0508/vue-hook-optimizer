module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: process.cwd(),
    project: ['tsconfig.json', './playground/tsconfig.json', './vscode/tsconfig.json'],
    extraFileExtensions: ['.vue'],
  },
  plugins: [
    'vue',
    '@typescript-eslint',
  ],
  overrides: [
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      extends: [
        'plugin:vue/vue3-recommended',
      ],
      rules: {
        'vue/multi-word-component-names': [0],
        'vue/max-attributes-per-line': ['error', {
          'singleline': {
            'max': 3,
          },      
          'multiline': {
            'max': 1,
          },
        }],
        'vue/html-self-closing': [0, {
          'html': {
            'void': 'never',
            'normal': 'always',
            'component': 'always',
          },
          'svg': 'always',
          'math': 'always',
        }],
        'vue/html-indent': ['error', 2, {
          'attribute': 1,
          'baseIndent': 1,
          'closeBracket': 0,
          'alignAttributesVertically': true,
          'ignores': [],
        }],
      },
    },
  ],
  rules: {
    semi: ['error', 'always'],
    indent: ['error', 2, { SwitchCase: 1 }],
    'max-len': [
      'error',
      {
        code: 120,
        tabWidth: 2,
        ignoreRegExpLiterals: true,
      },
    ],
    'comma-dangle': ['error', 'always-multiline'],
    quotes: ['error', 'single'],
  },
  ignorePatterns: [
    'test/TestComponent.vue',
    '*.d.ts',
    'dist',
    'output',
    'out',
    'coverage',
    'public',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '__snapshots__',
  ],
};
