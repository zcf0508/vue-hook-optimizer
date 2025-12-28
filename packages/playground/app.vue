<script lang="ts" setup>
import * as vis from 'vis-network';
import CodeMirror from './components/codemirror/CodeMirror.vue';
import complexComponent from './default-codes/complexComponent.vue?raw';
import compositionBase from './default-codes/compositionBase.vue?raw';
import optionsBase from './default-codes/optionsBase.vue?raw';
import reactClass from './default-codes/reactClass.jsx?raw';
import reactFunction from './default-codes/reactFunction.jsx?raw';
import reactHooks from './default-codes/reactHooks.jsx?raw';
import tsx from './default-codes/tsx.vue?raw';
import 'vis-network/dist/dist/vis-network.min.css';

const exampleCode = {
  vue: {
    optionsBase,
    compositionBase,
    complexComponent,
    tsx,
  },
  react: {
    reactClass,
    reactFunction,
    reactHooks,
  },
};

const selectedExample = ref<string>('optionsBase');
const code = ref(optionsBase);
const autoRefresh = ref(false);
const framework = ref<'vue' | 'react'>('vue');

// 监听框架切换，自动选择第一个示例
watch(framework, (newFramework) => {
  const examples = exampleCode[newFramework];
  const firstExampleKey = Object.keys(examples)[0];
  selectedExample.value = firstExampleKey;
  code.value = examples[firstExampleKey as keyof typeof examples];
});

// 监听示例切换
watch(selectedExample, (example) => {
  const examples = exampleCode[framework.value];
  code.value = examples[example as keyof typeof examples] || Object.values(examples)[0];
});

provide('autoresize', true);

function codeChange(value: string) {
  code.value = value;
  // autoRefresh.value && start();
}

watch(() => [autoRefresh.value, code.value, framework.value], () => {
  if (autoRefresh.value) {
    start();
  }
});

const networkRef = ref<HTMLElement>();

const visData = ref<vis.Data>({
  nodes: [],
  edges: [],
});

const suggestions = ref<Array<{
  type: 'info' | 'warning' | 'error'
  message: string
}>>([]);

async function start() {
  if (!code.value) {
    return;
  }

  const { msg, data, suggests } = await $fetch<{
    msg: string
    data: vis.Data
    suggests: Array<{
      type: 'info' | 'warning' | 'error'
      message: string
    }>
  }>('/api/analyze', {
    method: 'post',
    body: JSON.stringify({
      code: code.value,
      framework: framework.value,
    }),
  });
  if (data) {
    visData.value = data;
    suggestions.value = suggests;
  }
  else {
    // alert(msg);
    console.log(msg);
  }
}

const searchInputRef = ref<HTMLInputElement>();
const chartRef = ref<HTMLElement>();

const {
  showSearchInput,
  searchkey,
  closeSearch,
} = useSearch(searchInputRef, chartRef);

const highlightColor = computed(() => {
  return framework.value === 'vue'
    ? '#42b883'
    : '#61dafb';
});

const visOption = computed<vis.Options>(() => ({
  physics: {
    solver: 'forceAtlas2Based',
    forceAtlas2Based: {
      gravitationalConstant: -100,
    },
  },
  groups: {
    used: {
      color: {
        border: highlightColor.value,
        background: highlightColor.value,
        highlight: {
          border: highlightColor.value,
          background: highlightColor.value,
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
}));

const network = computed(() => {
  return new vis.Network(networkRef.value!, visData.value, visOption.value);
});

onMounted(() => {
  watch(visData, (val) => {
    network.value.setData(val);
  });

  watch(searchkey, (val) => {
    if (val) {
      // TODO: support fuzzy matching
      network.value.selectNodes(network.value.findNode(val), true);
      if (network.value.findNode(val).length > 0) {
        network.value.focus(network.value.findNode(val)[0], {
          scale: 1.0,
          animation: {
            duration: 400,
            easingFunction: 'easeInOutQuad',
          },
        });
      }
    }
  });
});

const containerRef = ref<HTMLElement | null>(null);

const {
  boundSplit,
  dragStart,
  dragMove,
  dragEnd,
} = useResize(containerRef);
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-full flex relative bg-[#f8f9fa]"
    @mousemove="dragMove"
    @mouseup="dragEnd"
    @mouseleave="dragEnd"
  >
    <!-- 左侧代码编辑区 -->
    <div
      class="flex-1 border-solid border-0 border-r-2 border-[#e5e7eb] bg-white flex flex-col"
      :style="`max-width: ${boundSplit}%`"
    >
      <div class="flex items-center gap-4 px-4 py-3 border-b border-[#e5e7eb] bg-[#f8f9fa]">
        <!-- 框架选择 -->
        <div class="flex items-center gap-2">
          <label
            class="
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              bg-white border-solid border-2
              transition-all duration-200
              cursor-pointer select-none
            "
            :class="framework === 'vue'
              ? 'border-[#42b883] text-[#42b883]'
              : 'border-white text-[#6b7280] hover:border-[#42b883]/50'"
          >
            <input
              id="framework_vue"
              v-model="framework"
              type="radio"
              value="vue"
              class="sr-only"
            >
            <span class="i-logos:vue inline-block w-4 h-4" />
            <span class="text-sm font-medium">Vue</span>
          </label>

          <label
            class="
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              bg-white border-solid border-2
              transition-all duration-200
              cursor-pointer select-none
            "
            :class="framework === 'react'
              ? 'border-[#61dafb] text-[#61dafb]'
              : 'border-white text-[#6b7280] hover:border-[#61dafb]/50'"
          >
            <input
              id="framework_react"
              v-model="framework"
              type="radio"
              value="react"
              class="sr-only"
            >
            <span class="i-logos:react inline-block w-4 h-4" />
            <span class="text-sm font-medium">React</span>
          </label>
        </div>

        <!-- 分隔线 -->
        <div class="h-6 w-px bg-[#e5e7eb]" />

        <!-- 示例选择 -->
        <span class="text-sm text-[#6b7280] font-medium">Example:</span>
        <select
          v-model="selectedExample"
          class="
            flex-1 px-3 py-1.5 rounded-lg
            bg-white border border-[#e5e7eb]
            text-sm text-[#374151] font-medium
            hover:border-[#42b883]
            focus:outline-none focus:border-[#42b883] focus:ring-2 focus:ring-[#42b883]/20
            cursor-pointer transition-all duration-200
          "
        >
          <optgroup v-if="framework === 'vue'" label="Vue Examples">
            <option value="optionsBase">
              Options API Base
            </option>
            <option value="compositionBase">
              Composition API Base
            </option>
            <option value="complexComponent">
              Complex Component
            </option>
            <option value="tsx">
              TSX
            </option>
          </optgroup>
          <optgroup v-if="framework === 'react'" label="React Examples">
            <option value="reactClass">
              Class Component
            </option>
            <option value="reactFunction">
              Function Component
            </option>
            <option value="reactHooks">
              Hooks Component
            </option>
          </optgroup>
        </select>
      </div>

      <!-- 代码编辑器 -->
      <div class="flex-1 overflow-hidden">
        <ClientOnly>
          <CodeMirror :value="code" :mode="framework === 'vue' ? 'htmlmixed' : 'javascript'" @change="codeChange" />
        </ClientOnly>
      </div>
    </div>

    <!-- 分隔条 -->
    <div
      class="w-4px bg-[#e5e7eb] hover:bg-[#42b883] transition-colors duration-200 flex-shrink-0 cursor-ew-resize"
      @mousedown.prevent="dragStart"
    />

    <!-- 右侧图表区 -->
    <div ref="chartRef" class="flex-1 flex flex-col bg-white">
      <!-- 工具栏 -->
      <div
        class="
          flex items-center justify-end gap-3
          px-6 py-4
          border-b border-[#e5e7eb]
          bg-gradient-to-r from-white to-[#f8f9fa]
        "
      >
        <!-- 分析按钮 -->
        <button
          class="
            px-5 py-2
            bg-[#42b883] hover:bg-[#35a372] active:bg-[#2d8f64]
            text-white font-medium
            transition-all duration-200
            shadow-sm hover:shadow-md
            transform hover:scale-105 active:scale-95
            border-0 rounded-lg outline-none focus:outline-none
            cursor-pointer
          "
          @click="start"
        >
          <span class="i-carbon:analytics inline-block mr-1.5 align-text-bottom" />
          Analyze
        </button>

        <!-- 自动刷新 -->
        <label
          class="
            flex items-center gap-2 px-4 py-2 rounded-lg
            bg-white border border-[#e5e7eb]
            cursor-pointer transition-all duration-200
            select-none
          "
        >
          <input
            id="refreshBtn"
            v-model="autoRefresh"
            type="checkbox"
            class="
              w-4 h-4 rounded
              border-2 border-[#d1d5db]
              text-[#42b883] focus:ring-2 focus:ring-[#42b883] focus:ring-offset-0
              cursor-pointer
            "
          >
          <span class="text-sm text-[#374151] font-medium">Auto Refresh</span>
        </label>

        <div class="h-6 w-px bg-[#e5e7eb]" />

        <!-- GitHub 仓库按钮 -->
        <a
          href="https://github.com/zcf0508/vue-hook-optimizer"
          target="_blank"
          rel="noopener noreferrer"
          class="
            px-4 py-2
            bg-white hover:bg-[#f3f4f6] active:bg-[#e5e7eb]
            text-[#374151] font-medium
            transition-all duration-200
            shadow-sm hover:shadow-md
            transform hover:scale-105 active:scale-95
            border border-[#e5e7eb] rounded-lg outline-none
            cursor-pointer
            flex items-center gap-2
            no-underline
          "
        >
          <span class="i-carbon:logo-github inline-block w-4 h-4" />
          GitHub
        </a>
      </div>
      <!-- 图表容器 -->
      <div class="flex-1 w-full relative bg-[#fafafa] min-h-0">
        <!-- 搜索框 -->
        <div v-if="showSearchInput" class="absolute right-4 top-4 z-50">
          <div class="relative flex items-center">
            <span class="i-carbon:search absolute left-3 w-4 h-4 text-[#9ca3af]" />
            <input
              ref="searchInputRef"
              v-model="searchkey"
              placeholder="Search by node name..."
              class="
                w-64 pl-4 pr-10 py-2.5
                border-2 border-solid border-[#e5e7eb] rounded-lg
                shadow-lg
                bg-white/95 backdrop-blur-sm
                text-sm text-[#374151] placeholder:text-[#9ca3af]
                focus:outline-none focus:border-[#42b883] focus:ring-2 focus:ring-[#42b883]/20
                transition-all duration-200
                outlinte-none
              "
            >
            <button
              class="
                absolute right-2
                w-6 h-6 rounded-md
                flex items-center justify-center
                text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6]
                transition-all duration-200 border-none bg-transparent cursor-pointer
              "
              @click="closeSearch"
            >
              <span class="i-carbon:close w-4 h-4" />
            </button>
          </div>
        </div>
        <!-- 可视化图表 -->
        <div ref="networkRef" class="h-full" />

        <!-- 图例 -->
        <div
          v-if="visData.nodes!.length > 0"
          class="
            absolute right-4 p-4 rounded-xl
            bg-white/95 backdrop-blur-sm
            border border-[#e5e7eb]
            shadow-xl
            flex flex-col gap-3
            transition-all duration-200
          "
          :class="showSearchInput ? 'top-20' : 'top-4'"
        >
          <div class="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">
            Legend
          </div>

          <div class="flex items-center gap-2.5">
            <div
              class="
                w-3 h-3 rounded-sm
                bg-[#42b883]
                shadow-sm
              "
            />
            <span class="text-sm text-[#374151] font-medium">Used</span>
          </div>

          <div class="flex items-center gap-2.5">
            <div
              class="
                w-3 h-3 rounded-sm
                bg-[#f3f4f6]
                shadow-sm
              "
            />
            <span class="text-sm text-[#374151] font-medium">Not Used</span>
          </div>

          <div class="h-px bg-[#e5e7eb] my-1" />

          <div class="flex items-center gap-2.5">
            <div
              class="
                box-border w-3 h-3 rounded-full
                bg-white
                border border-solid border-[#374151]
              "
            />
            <span class="text-sm text-[#6b7280]">Variant</span>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="box-border w-3 h-3 flex items-center justify-center flex-shrink-0">
              <div
                class="
                  box-border w-2.5 h-2.5
                  bg-white
                  border border-solid border-[#374151]
                  rotate-45 transform
                "
              />
            </div>
            <span class="text-sm text-[#6b7280]">Function</span>
          </div>
        </div>
      </div>

      <!-- 建议面板 -->
      <div
        v-if="suggestions.length > 0"
        class="
          h-[30%] min-h-40 w-full flex-shrink-0
          border-t border-[#e5e7eb]
          bg-white
          flex flex-col
        "
      >
        <div class="px-4 py-2 border-b border-[#e5e7eb] bg-[#f8f9fa] flex items-center gap-2">
          <span class="i-carbon:idea inline-block w-4 h-4 text-[#42b883]" />
          <span class="text-sm font-semibold text-[#374151]">Suggestions</span>
          <span class="text-xs text-[#6b7280] ml-auto">{{ suggestions.length }} items</span>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          <div
            v-for="(suggest, idx) in suggestions"
            :key="idx"
            class="
              flex items-start gap-2 px-3 py-2 rounded-lg
              text-sm
            "
            :class="{
              'bg-[#eff6ff] text-[#3d7de4]': suggest.type === 'info',
              'bg-[#fffbeb] text-[#b45309]': suggest.type === 'warning',
              'bg-[#fef2f2] text-[#dc2626]': suggest.type === 'error',
            }"
          >
            <span
              class="flex-shrink-0 w-4 h-4 mt-0.5"
              :class="{
                'i-carbon:information': suggest.type === 'info',
                'i-carbon:warning': suggest.type === 'warning',
                'i-carbon:error': suggest.type === 'error',
              }"
            />
            <span>{{ idx + 1 }}. {{ suggest.message }}</span>
          </div>
        </div>
      </div>
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
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

:root {
  --bg: #fff;
  --vue-green: #42b883;
  --vue-dark: #35495e;
}

/* 优化滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #42b883;
}
</style>
