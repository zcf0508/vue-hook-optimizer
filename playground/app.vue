<script lang="ts" setup>
import * as vis from 'vis-network';
import CodeMirror from './components/codemirror/CodeMirror.vue';
import { defaultCode } from './default-code';
import { 
  getVisData,
} from './vis';

const code = ref(defaultCode);


function codeChange(value: string) {
  code.value = value;
}

const networkRef = ref<HTMLElement>();

const visOption = {
  physics: {
    enabled: false,
  },
};

const visData = ref({
  nodes: [] as any[],
  edges: [] as any[],
});


async function start() {
  if(!code.value) {
    return;
  }

  const res = await $fetch('/api/analyze', {
    method: 'post',
    body: JSON.stringify({
      code: code.value,
    }),
  });

  if(res.code === 0) {
    visData.value = res.data!;
  }
}

onMounted(() => {
  const network = new vis.Network(networkRef.value!, visData.value, visOption);
  watch(visData, (val) => {
    network.setData(val);
  });
});

</script>
<template>
  <div class="w-full h-full flex">
    <div class="flex-1">
      <ClientOnly>
        <CodeMirror :value="code" @change="codeChange"></CodeMirror>
      </ClientOnly>
    </div>
    <div class="flex-1">
      <div>
        <button @click="start">
          analyze
        </button>
      </div>
      <div ref="networkRef" class="h-full"></div>
    </div>
  </div>
</template>
<style>
html, body, #__nuxt {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>