import { defineNuxtModule } from '@nuxt/kit';
import '@nuxt/devtools-kit';
import '@nuxt/schema';
import { defineComponent, h } from 'vue';
import View from './client/view.vue';

const View2 = defineComponent({
  template: '<div>test2222</div>',
});

interface ModuleOptions {
  devtools?: boolean
};

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-unplugin-https-reverse-proxy',
    configKey: 'unpluginHttpsReverseProxy',
  },
  defaults: {
    devtools: true,
  },
  setup(options, nuxt) {
    if (options.devtools) {
      console.log('View', h(View));
      console.log('View2', h(View2));

      nuxt.hook('devtools:customTabs', (tabs) => {
        tabs.push({
          title: 'nuxt-module-vue-hook-optimizer',
          name: 'vue-hook-optimizer',
          icon: 'cib:graphql',
          view: {
            type: 'vnode',
            vnode: h('div', null, [
              h('div', 'test'),
              h(View2),
              h(View),
            ]),
          },
        });
      });
    }
  },
});
