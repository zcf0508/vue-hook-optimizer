import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsdown';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
