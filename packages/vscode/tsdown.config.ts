import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsdown';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
