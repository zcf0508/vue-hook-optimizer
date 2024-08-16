import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'nuxt-module-vue-hook-optimizer',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') {
          return 'index.mjs';
        }
        else {
          return 'index.cjs';
        }
      },
    },
    rollupOptions: {
      external: ['vue', '@nuxt/kit', '@nuxt/schema', '@nuxt/devtools-kit'],
    },
  },
});
