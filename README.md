[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/zcf0508-vue-hook-optimizer-badge.png)](https://mseep.ai/app/zcf0508-vue-hook-optimizer)

[![NPM version](https://img.shields.io/npm/v/vue-hook-optimizer?color=a1b858&label=)](https://www.npmjs.com/package/vue-hook-optimizer)
<a href="https://marketplace.visualstudio.com/items?itemName=zcf0508.vue-hook-optimizer-ext" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/zcf0508.vue-hook-optimizer-ext.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>

[中文文档](./README_cn.md)

This is a tool to analyze your components code. It supports `Vue` and `React`. Viste [playground](vue-hook-optimizer.vercel.app/) or try the vscode extension [vue-hook-optimizer-ext](https://marketplace.visualstudio.com/items?itemName=zcf0508.vue-hook-optimizer-ext).

## Install And Run Playground

```bash
# clone the repo then install the dependencies
pnpm install
# run the playground
pnpm run play
```

Open the browser and visit `http://localhost:3000/`.

## How To Use

1. paste your component code into the editor

2. click `Analyze` button

The tool will analyze the code, and show the relations between the variables and the methods. This is a simple demo.

![playground](./images/playground1.png)

## Motive

Sometime we have to refactor the code, maybe there are thousands of lines of code in one file.
And it is too complex and hard to understand.

So I want to build a tool to help us analyze the code, and find the relations between the variables and the methods.
We can find out some variables are isolated, and some methods are over-association, and then we can refactor them.

## Development Plan

- [x] add more info, including the variable type, comment, whether has been used in template or hook methods
- [x] provide some suggestions for optimization
- [x] support `options api`
- [x] [vscode extension](./packages/vscode)
- [x] support `React`
- [x] eslint rules
- [x] mcp server

## Contribution

Any contributions are welcome.

## Sponsor Me

If you like this tool, please consider to sponsor me. I will keep working on this tool and add more features.

![sponsor](./images/sponsor.png)

## License

MIT
