import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  dts: true,
  shims: true,
  format: ['cjs', 'esm'],
  external: [
    '@babel/core',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    '@vue/compiler-sfc',
  ],
});
