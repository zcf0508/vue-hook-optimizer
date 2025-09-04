import path from 'node:path';
import { defineConfig } from 'tsdown';

export default defineConfig(options => (
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    sourcemap: options.env?.NODE_ENV === 'development',
    clean: true,
    alias: {
      'vue-hook-optimizer': path.resolve(__dirname, '../../packages/core/src'),
      '@vue/compiler-sfc': path.resolve(__dirname, '../../node_modules/@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js'),
    },
    external: [
      'vscode',
    ],
    minify: true,
  }),
);
