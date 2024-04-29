import path from 'node:path';
import { defineConfig } from 'vitest/config';

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
