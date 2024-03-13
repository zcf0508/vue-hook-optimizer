[![NPM version](https://img.shields.io/npm/v/vue-hook-optimizer?color=a1b858&label=)](https://www.npmjs.com/package/vue-hook-optimizer)
<a href="https://marketplace.visualstudio.com/items?itemName=zcf0508.vue-hook-optimizer-ext" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/zcf0508.vue-hook-optimizer-ext.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>

这是一个用来分析组件代码的工具。它支持 `Vue` 和 `React`。访问 [playground](vue-hook-optimizer.vercel.app/) 或者试试 vscode 扩展 [vue-hook-optimizer-ext](https://marketplace.visualstudio.com/items?itemName=zcf0508.vue-hook-optimizer-ext)。

## 安装和运行

```bash
# 克隆仓库并安装依赖
pnpm install
# 运行 playground
pnpm run play
```

打开浏览器并访问 `http://localhost:3000/`.

## 如何使用

1. 把你的组件代码粘贴到编辑器中

2. 点击 `Analyze` 按钮

这个工具会分析代码，并展示变量和方法之间的关联关系。这是一个简单的示例。

![playground](./images/playground1.png)

## 动机

有时我们不得不重构代码，可能一个文件里有成千上万行代码。太复杂难以理解。

所以我想开发一个工具来帮助我们分析代码，并找出变量和方法之间的关联关系。我们可以发现一些变量是孤立的，一些方法是过度关联的，然后我们可以重构它们。

## 开发计划

- [x] 增加更多细信息, 包括变量类型、注释、是否在模板或者 hook 方法中被使用
- [x] 提供优化建议
- [x] 支持 `options api`
- [x] [vscode 扩展](./packages/vscode)
- [x] 支持 `React`

## 贡献

欢迎贡献代码，提交 PR。

## 支持我

如果你喜欢这个工具，请考虑支持我。我将继续努力开发这个工具，并添加更多功能。

![sponsor](./images/sponsor.png)

## License

MIT
