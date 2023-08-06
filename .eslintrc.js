module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: process.cwd(),
    project: ['tsconfig.json'],
  },
  plugins: [
    '@typescript-eslint',
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
}
