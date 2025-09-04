// https://nuxt.com/docs/api/configuration/nuxt-config
import * as path from 'node:path';

export default defineNuxtConfig({
  devtools: false,
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
  ],
  alias: {
    'vue-hook-optimizer': path.resolve(__dirname, '../../packages/core/src'),
    // https://github.com/vuejs/core/issues/10278#issuecomment-1950783863
    '@vue/compiler-sfc': path.resolve(__dirname, '../../node_modules/@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js'),
  },
});
