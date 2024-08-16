// https://nuxt.com/docs/api/configuration/nuxt-config
import * as path from 'node:path';

export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },

  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '../nuxt-module-vue-hook-optimizer',
  ],

  alias: {
    'vue-hook-optimizer': path.resolve(__dirname, '../../src'),
    // https://github.com/vuejs/core/issues/10278#issuecomment-1950783863
    '@vue/compiler-sfc': path.resolve(__dirname, '../../node_modules/@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js'),
  },

  compatibilityDate: '2024-08-16',
});
