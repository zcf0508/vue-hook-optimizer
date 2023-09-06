<template>
  <div
    ref="containerRef"
    class="w-full h-full flex relative"
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
    <div ref="chartRef" class="flex-1 flex flex-col">
      <div class="flex mt-16px">
        <button class="mr-8px" @click="start">
          analyze
        </button>
        <span>
          <input id="refreshBtn" v-model="autoRefresh" type="checkbox" />
          <label for="refreshBtn">Auto Refresh</label>
        </span>
      </div>
      <div class="h-full w-full relative">
        <div v-if="showSearchInput" class="absolute right-[10px] top-0 z-50">
          <div class="relative flex items-center">
            <input 
              ref="searchInputRef"
              v-model="searchkey"
              placeholder="search by node name"
              class="
                w-[200px]
                pl-4 pr-6 py-2
                border-[#ddd] border-[1px] border-solid rounded-md
                shadow
              "
            >
            <span
              class="
                i-material-symbols:close-rounded 
                w-[20px] h-[20px] 
                absolute right-[10px] 
                color-[#626365]
                cursor-pointer
              "
              @click="closeSearch"
            ></span>
          </div>
        </div>
        <div ref="networkRef" class="h-full"></div>
        <div 
          v-if="visData.nodes!.length > 0" 
          class="
            absolute right-[10px] top-[10px] p-2
            border border-solid border-[#eee]
            shadow-light-500 
            flex flex-col gap-2
            backdrop-blur
          "
          :class="showSearchInput ? 'top-[40px]' : 'top-[10px]'"
        >
          <div class="flex items-center align-baseline">
            <div
              class="
                inline-block mr-1
                bg-[#9dc2f9] 
                border border-solid border-[#3d7de4]
                w-[10px] h-[10px]
              "
            ></div>
            <span>USED IN TEMPLATE</span>
          </div>
          <div class="flex items-center align-baseline">
            <div
              class="
                inline-block mr-1
                bg-[#eee] 
                border border-solid border-[#ddd]
                w-[10px] h-[10px]
              "
            ></div>
            <span>NOT USED IN TEMPLATE</span>
          </div>
          <div class="flex items-center align-baseline">
            <div
              class="
                inline-block mr-1
                border border-solid border-[#333]
                rounded-full 
                w-[10px] h-[10px]
              "
            ></div>
            <span>Variant</span>
          </div>
          <div class="flex items-center align-baseline">
            <div
              class="
                inline-block mr-1
                border border-solid border-[#333]
                rotate-45 transform scale-80
                w-[10px] h-[10px]
              "
            ></div>
            <span>Function</span>
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
const autoRefresh = ref(false);

provide('autoresize', true);

function codeChange(value: string) {
  code.value = value;
  autoRefresh.value && start();
}

const networkRef = ref<HTMLElement>();

const visData = ref<vis.Data>({
  nodes: [],
  edges: [],
});

const alerted = ref(false);

async function start() {
  if(!code.value) {
    return;
  }

  const { msg, data, suggests } = await $fetch<{msg: string, data: vis.Data, suggests: Array<{
    type: 'info' | 'warning' | 'error',
    message: string
  }>}>('/api/analyze', {
    method: 'post',
    body: JSON.stringify({
      code: code.value,
    }),
  });
  if(data) {
    visData.value = data;
    suggests.forEach((suggest, idx) => {
      switch(suggest.type) {
        case 'info':
          console.log(`%c${idx + 1}.${suggest.message}`, 'color: #3d7de4');
          break;
        case 'warning':
          console.log(`%c${idx + 1}.${suggest.message}`, 'color: #f6c342');
          break;
        case 'error':
          console.log(`%c${idx + 1}.${suggest.message}`, 'color: #f44336');
          break;
      }
    });
    if(!alerted.value) {
      alert('Analyze Done! Please check the console for suggestions.');
      alerted.value = true;
    }
  } else {
    alert(msg);
  }
}


const searchInputRef = ref<HTMLInputElement>();
const chartRef = ref<HTMLElement>();

const {
  showSearchInput,
  searchkey,
  closeSearch,
} = useSearch(searchInputRef, chartRef);

onMounted(() => {
  const visOption: vis.Options = {
    physics: {
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -100,
      },
    },
    groups: {
      used: {
        color: {
          border: '#3d7de4',
          background: '#9dc2f9',
          highlight: {
            border: '#3d7de4',
            background: '#9dc2f9',
          },
        },
      },
      normal: {
        color: {
          border: '#ccc',
          background: '#ddd',
          highlight: {
            border: '#ccc',
            background: '#ddd',
          },
        },
      },
    },
  };

  const network = new vis.Network(networkRef.value!, visData.value, visOption);
  watch(visData, (val) => {
    network.setData(val);
  });

  watch(searchkey, (val) => {
    if(val) {
      // TODO: support fuzzy matching
      network.selectNodes(network.findNode(val), true);
    }
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

:root {
  --bg: #fff;
}
</style>
