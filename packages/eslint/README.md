[![NPM version](https://img.shields.io/npm/v/eslint-plugin-vue-hook-optimizer?color=a1b858&label=)](https://www.npmjs.com/package/eslint-plugin-vue-hook-optimizer)

For more information, please visit [vue-hook-optimizer](https://github.com/zcf0508/vue-hook-optimizer).

## Install

```bash
pnpm add eslint vue-eslint-parser @typescript-eslint/parser eslint-plugin-vue-hook-optimizer --save-dev
```

## Usage

### legacy config

```js
// .eslintrc.js

/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: {
      'js': '@typescript-eslint/parser',
      '<template>': 'espree',
    },
  },
  plugins: ['vue-hook-optimizer'],
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
};
```

### flat config

```js
// eslint.config.js

import pluginTs from '@typescript-eslint/parser';
import pluginVueHookOptimizer from 'eslint-plugin-vue-hook-optimizer';
import vueParse from 'vue-eslint-parser';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParse,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        extraFileExtensions: ['.vue'],
        parser: pluginTs,
        sourceType: 'module',
      },
    },
  },
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
];
```

## Configuration

All rules are disabled by default. You can enable them by adding them to your eslint configuration.
And all rules support the following options:

- `framework`: The framework you are using. `vue` and `react` are supported.

## Sponsor Me

If you like this tool, please consider to sponsor me. I will keep working on this tool and add more features.

![sponsor](https://github.com/zcf0508/vue-hook-optimizer/blob/master/images/sponsor.png?raw=true)

## License

MIT
