import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  external: [
    '@babel/core',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    '@vue/compiler-sfc',
  ],
});
