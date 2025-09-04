import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    globals: true,
    coverage: {
      include: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      provider: 'istanbul',
      reporter: ['text'],
    },
  },
});
