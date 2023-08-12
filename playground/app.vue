<template>
  <div
    ref="container"
    class="w-full h-full flex"
    @mousemove="dragMove"
    @mouseup="dragEnd"
    @mouseleave="dragEnd"
  >
    <div
      class="flex-1 border-solid border-0 border-r-1"
      :style="`max-width: ${boundSplit}%`"
    >
      <ClientOnly>
        <CodeMirror :value="code" @change="codeChange"></CodeMirror>
      </ClientOnly>
    </div>
    <div 
      ref="dragger"
      class="px-1 flex-shrink flex items-center cursor-ew-resize" 
      @mousedown.prevent="dragStart"
    >
      |
    </div>
    <div class="flex-1 flex flex-col">
      <div>
        <button @click="start">
          analyze
        </button>
      </div>
      <div ref="networkRef" class="h-full"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as vis from 'vis-network';
import CodeMirror from './components/codemirror/CodeMirror.vue';
import { defaultCode } from './default-code';

const code = ref(defaultCode);

provide('autoresize', true);

function codeChange(value: string) {
  code.value = value;
}

const networkRef = ref<HTMLElement>();

const visOption = {
  physics: {
    enabled: false,
  },
};

const visData = ref<vis.Data>({
  nodes: [],
  edges: [],
});


async function start() {
  if(!code.value) {
    return;
  }

  const res = await $fetch<vis.Data>('/api/analyze', {
    method: 'post',
    body: JSON.stringify({
      code: code.value,
    }),
  });
  if(res) {
    visData.value = res;
  }
}

onMounted(() => {
  const network = new vis.Network(networkRef.value!, visData.value, visOption);
  watch(visData, (val) => {
    network.setData(val);
  });
});

// --resize

const container = ref();

const state = reactive({
  dragging: false,
  split: 50,
});

const boundSplit = computed(() => {
  const { split } = state;
  return split < 10 ? 10 : split > 50 ? 50 : split;
});

let startPosition = 0;
let startSplit = 0;

function dragStart(e: MouseEvent) {
  state.dragging = true;
  startPosition = e.pageX;
  startSplit = boundSplit.value;
}

function dragMove(e: MouseEvent) {
  if (state.dragging) {
    const position = e.pageX;
    const totalSize = container.value.offsetWidth;
    const dp = position - startPosition;
    state.split = startSplit + ~~((dp / totalSize) * 100);
  }
}

function dragEnd() {
  state.dragging = false;
}

</script>

<style>
html, body, #__nuxt {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
