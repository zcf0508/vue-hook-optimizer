import * as path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    entry: [
      'src/index.ts',
    ],
    sourcemap: options.env?.NODE_ENV === 'development',
    format: ['cjs'],
    shims: false,
    dts: false,
    external: [
      'vscode',
    ],
    esbuildOptions: (options) => {
      options.alias = {
        '@vue/compiler-sfc': path.resolve(__dirname, '../../node_modules/@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js'),
      };
    },
  };
});
