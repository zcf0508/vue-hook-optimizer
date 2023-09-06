// https://nuxt.com/docs/api/configuration/nuxt-config
import * as path from 'node:path';

export default defineNuxtConfig({
  // ssr: false,
  devtools: { enabled: false },
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
  ],
  alias:{
    'vue-hook-optimizer': path.resolve(__dirname, '../../src'),
  },
});
