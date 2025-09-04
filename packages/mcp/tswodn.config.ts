import path from 'node:path';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  alias: {
    'vue-hook-optimizer': path.resolve(__dirname, '../../packages/core/src'),
  },
  minify: true,
});
