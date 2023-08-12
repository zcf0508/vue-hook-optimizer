<template>
  <div
    ref="containerRef"
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
      <div class="h-full w-full relative">
        <div ref="networkRef" class="h-full"></div>
        <div 
          v-if="visData.nodes!.length > 0" 
          class="
            absolute right-[10px] top-[10px] p-2
            border border-solid border-[#eee]
            shadow-light-500 
            flex flex-col gap-2
          "
        >
          <div class="flex items-center align-baseline">
            <div
              class="
                inline-block mr-1
                bg-[#fffe47] 
                border border-solid border-[#f6a72b]
                rounded-full 
                w-[10px] h-[10px]
              "
            ></div>
            <span>USED IN TEMPLATE</span>
          </div>
          <div class="flex items-center align-baseline">
            <div
              class="
                inline-block mr-1
                bg-[#9dc2f9] 
                border border-solid border-[#3d7de4]
                rounded-full 
                w-[10px] h-[10px]
              "
            ></div>
            <span>NOT USED IN TEMPLATE</span>
          </div>
        </div>
      </div>
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

const visOption: vis.Options = {
  physics: {
    solver: 'forceAtlas2Based',
    forceAtlas2Based: {
      gravitationalConstant: -100,
    },
  },
  groups: {
    nomal: {
      color: {
        border: '#3d7de4',
        background: '#9dc2f9',
      },
    },
    used: {
      color: {
        border: '#f6a72b',
        background: '#fffe47',
      },
    },
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


const containerRef = ref<HTMLElement | null>(null);

const {
  boundSplit,
  dragStart,
  dragMove,
  dragEnd,
}  = useResize(containerRef);

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
