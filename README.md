[中文文档](./README_cn.md)

This is a tool to analyze your `vue` code.

## Install And Run Playground

```bash
# clone the repo then install the dependencies
pnpm install
# run the playground
pnpm run play
```

Open the browser and visit `http://localhost:3000/`.

![playground](./images/playground1.png)

## How To Use

1. paste your `vue` code into the editor

Up to now, it only supports the code with `<script setup>` syntax block.If your code use `options api`, it's not working at the moment.

2. click `Analyze` button

The tool will analyze the `setup block` and `template block`, and show the relations between the variables and the methods. This is a simple demo.

![demo](./images/demo1.png)

## Motive

Sometime we have to refactor the code, maybe there are thousands of lines of code in one file. And it is too complex and hard to understand.

So I want to build a tool to help us analyze the code, and find the relations between the variables and the methods. We can find out some variables are isolated, and some methods are over-association, and then we can refactor them.

## Development Plan

[ ] add node type and more info
[ ] provide some suggestions for optimization
[ ] maybe support `options api`

## Contribution

Any contributions are welcome. 

## Sponsor Me

If you like this tool, please consider to sponsor me. I will keep working on this tool and add more features.

![sponsor](./images/sponsor.png)

## License

MIT