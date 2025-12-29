---
name: vho-refactor-zh
description: 基于 VHO 的 Vue/React 组件重构技能。先调用 vue-hook-optimizer MCP 的 analyze 工具获取依赖图与建议，再按决策框架实施重构并复验。
---
# 基于 VHO 分析的 Vue 组件重构指南

## 0. 使用说明（MCP 调用）
- 触发条件：当需要依据真实依赖关系图与优化建议开展组件重构评估与实施
- 前置配置：已连接 `vue-hook-optimizer`/`vho` MCP Server，工具 `analyze` 可用
- 输入参数：
  - `absolutePath`：待分析组件文件的绝对路径
  - `framework`：`vue` 或 `react`（默认 `vue`）
- 操作步骤：
  - 调用 MCP 工具 `analyze`，传入上述参数
  - 解析输出中的 `mermaid` 代码块（依赖图）、建议列表和**变量社区**
  - 结合本指南第 1–8 章内容，将分析结果用于决策与实施
  - 重构完成后先进行类型检查：
    - 优先查看项目 `package.json` 是否存在类型检查脚本（如 `typecheck`、`tsc`、`vue-tsc`），若存在请运行该脚本（如 `pnpm run typecheck`、`npm run typecheck` 或 `yarn typecheck`）
    - 若不存在脚本：
      - Vue 项目：运行 `vue-tsc --noEmit`
      - React 项目：运行 `tsc --noEmit`
  - 类型检查通过后，再次调用 MCP 工具 `analyze` 完成复验（参见第 6.3 与第 8 章）
- 输出说明：
  - `mermaid`：节点/边依赖关系可视化
  - 建议：包含循环依赖、链式调用、孤立节点群、关节点等提示
  - **变量社区**：通过 Label Propagation 算法检测出的紧密耦合变量群组，每个社区代表一组可以一起提取的变量

## 1. 重构决策框架

### 1.1 VHO 分析指标解读

#### **节点数量评估**
- **< 10 节点**：结构简单，重构优先级低
- **10-20 节点**：中等复杂度，关注关节点和孤立节点
- **> 20 节点**：高复杂度，必须重构

#### **关键指标识别**
- **关节点（Articulation Points）**：移除后会导致依赖图分裂的节点，通常是重构的核心目标
- **孤立节点群**：相互关联但与主逻辑分离的节点集合，是提取的候选对象，通常需要根据实际业务含义进行模块分割
- **变量社区（Variable Communities）**：通过算法检测出的紧密耦合变量群组。同一社区内的变量相互依赖频繁，是提取为 Composable/Hook 的理想候选。社区大小越大，越需要考虑是否应该拆分
- **依赖深度**：长链式依赖表明职责混乱，需要分层处理
- **逻辑独立**：提取的代码需要是独立的、完备的、有一定实际意义的逻辑块，不能是过于耦合的包含多模块的内容，也不能是过于简单的函数定义或变量声明的二次导出

### 1.2 重构优先级矩阵

| VHO 特征 | 重构优先级 | 重构策略 |
|---------|-----------|----------|
| 存在关节点 + 高节点数 | **极高** | 立即提取关节点相关逻辑 |
| 多个孤立节点群 | **高** | 按功能域分组提取 |
| 大型社区（>8个成员） | **高** | 按社区边界提取为独立 Composable |
| 多个小型社区（2-5成员） | **中** | 评估业务含义后决定是否合并或分别提取 |
| 长链式依赖 | **中** | 分层重构，建立清晰的数据流 |
| 循环依赖 | **极高** | 打破循环，重新设计接口 |

### 1.3 基于社区的重构策略

#### **社区分析解读**
社区检测会输出类似以下结果：
```
### Community 1 (5 members)
  - `userData` (variable, line 10)
  - `loading` (variable, line 12)
  - `fetchUser` (function, line 15)
  - `updateUser` (function, line 25)
  - `userError` (variable, line 35)
```

#### **社区重构决策**
1. **单一社区 + 明确职责** → 直接提取为一个 Composable
2. **单一社区 + 混合职责** → 先按职责拆分，再分别提取
3. **多个社区 + 各自独立** → 每个社区提取为独立 Composable
4. **多个社区 + 存在交叉** → 分析交叉点，可能需要提取共享逻辑

#### **社区命名建议**
根据社区成员的共同特征命名：
- 以数据实体命名：`useUser`、`useOrder`、`useProduct`
- 以功能命名：`useDataFetching`、`useFormValidation`
- 以业务流程命名：`useCheckout`、`useAuthentication`

## 2. Composable 提取决策树

### 2.1 功能内聚性判断

```
是否应该提取为 Composable？
├─ 是否有3个以上相关的响应式状态？ ─── 是 ──┐
├─ 是否有完整的生命周期管理？ ──────── 是 ──┤
├─ 是否有复杂的副作用处理？ ────────── 是 ──┤
└─ 是否在多处复用或可能复用？ ──────── 是 ──┤
                                            └──→ 提取为 Composable

```

### 2.2 状态归属决策

#### **放入 Composable 内部的状态**
```ts
// 判断标准：内部状态
const internalStates = {
  // ✅ 生命周期完全由逻辑控制
  loading: ref(false),
  error: ref(null),

  // ✅ 算法/协议相关的状态
  page: ref(1),
  cursor: ref(''),

  // ✅ 缓存和优化状态
  cache: new Map(),
  isRequesting: false,
};
```

#### **通过参数传入的状态**
```ts
// 判断标准：外部控制
function useFeature(
  // ✅ 用户输入/交互状态
  userInput: Ref<string>,

  // ✅ 配置项
  options: Ref<Options>,

  // ✅ 外部依赖
  externalData: Ref<Data>,
) {}
```

#### **在内部重新获取的状态**
```ts
function useFeature() {
  // ✅ 全局状态（路由、store等）
  const route = useRoute();
  const store = useStore();

  // ✅ 环境/上下文状态
  const { message } = App.useApp();
}
```

## 3. Vue 生命周期函数归属指南

### 3.1 生命周期归属决策矩阵

| 生命周期 | 归属判断 | 示例场景 |
|---------|---------|----------|
| `onMounted` | 看初始化内容 | 数据加载 → Composable<br/>DOM操作 → 组件 |
| `onUnmounted` | 看清理内容 | 定时器清理 → Composable<br/>事件解绑 → 组件 |
| `watch/watchEffect` | 看响应的状态 | 业务状态变化 → Composable<br/>UI状态变化 → 组件 |
| `computed` | 看计算依赖 | 业务计算 → Composable<br/>样式计算 → 组件 |

### 3.2 具体决策规则

#### **应该放入 Composable 的生命周期**
```ts
// ✅ 数据获取和业务逻辑初始化
onMounted(() => {
  fetchData();
  startPolling();
});

// ✅ 业务状态的响应式处理
watch(searchKeyword, (newVal) => {
  resetPagination();
  loadData(newVal);
});

// ✅ 资源清理和业务逻辑清理
onUnmounted(() => {
  clearInterval(pollingTimer);
  abortPendingRequests();
});
```

#### **应该保留在组件的生命周期**
```ts
// ✅ DOM 相关操作
onMounted(() => {
  focusInput();
  initializeChart();
});

// ✅ UI 状态响应
watch(isVisible, (visible) => {
  if (visible) {
    playAnimation();
  }
});

// ✅ 组件特定的清理
onUnmounted(() => {
  destroyChart();
  removeEventListeners();
});
```

## 4. 依赖关系重构策略

### 4.1 关节点处理策略

#### **识别关节点类型**
1. **数据转换节点**：承担多种数据格式转换
2. **状态协调节点**：协调多个状态的变化
3. **副作用集中节点**：处理多种副作用

#### **重构方案**
```ts
// 🚫 关节点：单个函数处理多种职责
function processData(rawData, filters, sortOptions) {
  // 数据过滤
  const filtered = applyFilters(rawData, filters);
  // 数据排序
  const sorted = applySorting(filtered, sortOptions);
  // 触发副作用
  updateUI(sorted);
  trackEvent('data_processed');
  return sorted;
}
```

```ts
// ✅ 拆分为多个职责单一的函数
const { processData } = useDataProcessor();
const { updateUI } = useUIUpdater();
const { trackEvent } = useAnalytics();
```

### 4.2 孤立节点群整合

#### **按功能域分组**
```ts
// 🚫 分散的相关逻辑
const userProfile = ref({});
function updateProfile() {}
function validateProfile() {}

const orderHistory = ref([]);
function loadOrders() {}
function filterOrders() {}
```
```
// ✅ 按域整合
const { profile, updateProfile, validateProfile } = useUserProfile();
const { orders, loadOrders, filterOrders } = useOrderHistory();
```

## 5. 接口设计原则

### 5.1 最小暴露原则

```ts
// ✅ 只暴露必要的接口
function useDataLoader() {
  // 内部状态
  const page = ref(1);
  const cache = new Map();
  const isRequesting = ref(false);

  // 暴露的状态
  const data = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 暴露的方法
  const load = () => {};
  const refresh = () => {};

  return {
    // 只返回外部需要的
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    load,
    refresh,
  };
}
```

## 6. 重构执行流程

### 6.1 分析阶段

1. **解读 VHO 分析结果**
   - 识别关节点和孤立节点群
   - 评估依赖关系复杂度
   - 确定重构优先级

2. **制定重构计划**
   - 按优先级排序重构目标
   - 梳理现有依赖关系
   - 设计新的接口结构

### 6.2 实施阶段

#### **Step 1: 提取纯函数**
```ts
// 先提取无副作用的纯函数
function formatData(raw) { /* ... */ }
function validateInput(input) { /* ... */ }
```

#### **Step 2: 提取状态管理**
```ts
// 再提取相关的状态和其操作
function useDataState() {
  const data = ref([]);
  const setData = (newData) => {
    data.value = newData;
  };
  return { data, setData };
}
```

#### **Step 3: 整合副作用**
```ts
// 最后整合副作用和生命周期
function useDataLoader() {
  const { data, setData } = useDataState();

  const load = async () => {
    const result = await fetchData();
    setData(formatData(result));
  };

  onMounted(load);

  return { data, load };
}
```

### 6.3 验证阶段

1. **重新分析 VHO 结果**
   - 节点数量是否减少
   - 关节点是否消除
   - 依赖关系是否简化

2. **功能验证**
   - 原有功能是否完整保留
   - 性能是否有退化
   - 类型检查是否通过

3. **可维护性评估**
   - 新增功能的便利性
   - 代码复用的可能性
   - 测试覆盖的完整性

## 7. 数据流向管理原则

在复杂的 Composition API 开发中，清晰的数据流是可维护性的关键。本章介绍5大原则来确保重构后的代码遵循最佳的数据流实践。

### 7.1 原则一：采用单向数据流管道模型 (Pipeline Pattern)

避免数据在多个 ref 之间跳跃，而是利用 `computed` 构建单向的流水线。数据应该沿着单一方向流动，而不是形成环路。

#### **反面示例：数据横向乱跳**
```ts
// 🚫 多个 ref 互相依赖，难以追踪
const searchText = ref('');
const filters = ref({});
const sortOrder = ref('asc');

// watch A 改 B，B 改 C...
watch(searchText, () => {
  filters.value = computeFilters();
});

watch(filters, () => {
  sortOrder.value = 'asc'; // 手动重置
  fetchData();
});

watch(sortOrder, () => {
  fetchData(); // 冗余请求
});
```

#### **正面示例：纵向流动的管道**
```ts
// ✅ 清晰的单向流水线
const searchText = ref('');
const pageNum = ref(1);

// 第1步：格式化/清洗输入
const normalizedText = computed(() => searchText.value.trim().toLowerCase());

// 第2步：触发异步操作
const { data, loading } = useDataFetching(normalizedText, pageNum);

// 第3步：业务过滤/排序（不修改源数据）
const processedData = computed(() => {
  if (!data.value) { return []; }
  return data.value
    .filter(item => matchesText(item, normalizedText.value))
    .sort((a, b) => a.priority - b.priority);
});

// 最终输出到模板
return { processedData, loading };
```

#### **自检要点**
- 数据流能否画成**不回头的箭头序列**？
- 是否出现了**环路**（A变改B，B变又改A）？
- 能否从上到下**直接读出流向**？

### 7.2 原则二：显式标记副作用入口

不要让副作用隐藏在各处，使用清晰的方法名和调试钩子显式标记。

#### **副作用命名约定**
```ts
function useUserSearch() {
  const state = ref({ });

  // ✅ 动词化命名：表示这是修改数据的方法
  const handleSearch = async (query: string) => { };
  const handlePageChange = (page: number) => { };
  const updateFilters = (filters: any) => { };

  // ❌ 避免这样：模糊的名字
  // const process = () => { ... };
  // const change = () => { ... };

  return {
    state: readonly(state),
    handleSearch,
    handlePageChange,
    updateFilters,
  };
}
```

### 7.3 原则三：区分"源头"和"波纹"

**源头 (Source of Truth)**：用户点击、URL参数、WebSocket消息、外部API返回
**波纹 (Derived State)**：通过 computed 或 watch 衍生出的状态（loading、filteredList、disabledButton等）

#### **错误做法：把波纹当源头修改**
```ts
// 🚫 当用户类型改变时，手动修改 loading
watch(userType, () => {
  loading.value = true; // 这是波纹，不应该手动改
  fetchData();
});
```

#### **正确做法：只修改源头，让波纹自动扩散**
```ts
// ✅ 只有源头 userType 和 query 是 ref
const userType = ref('');
const query = ref('');

// 所有其他都是 computed（波纹）
const loading = computed(() => {
  return isFetching.value || isProcessing.value;
});

const filteredUsers = computed(() => {
  return users.value.filter(u => u.type === userType.value && u.name.includes(query.value));
});

const isEmpty = computed(() => filteredUsers.value.length === 0);

// 副作用只在源头变化时触发
watch([userType, query], async () => {
  // 自动触发加载
}, { debounce: 300 });
```

### 7.4 原则四：接口设计体现数据流向

通过清晰的接口结构，让使用者一眼看出哪些是只读的（状态、派生值），哪些是操作入口（方法）。

#### **分层接口设计**
```ts
export function useUserSearch() {
  // === 内部状态（隐藏） ===
  const _page = ref(1);
  const _cache = new Map();
  const _isRequesting = ref(false);

  // === 源头（可以观察但需要通过方法修改） ===
  const queryText = ref('');
  const filters = ref({});

  // === 派生状态（只读） ===
  const isLoading = computed(() => _isRequesting.value);
  const users = computed(() => _cache.get(cacheKey.value) || []);
  const hasMore = computed(() => users.value.length < totalCount.value);
  const pageInfo = computed(() => ({
    current: _page.value,
    hasMore: hasMore.value,
  }));

  // === 动作方法（修改数据的入口） ===
  const search = async (text: string) => {
    queryText.value = text;
    _page.value = 1;
    await _loadData();
  };

  const nextPage = async () => {
    if (!hasMore.value) { return; }
    _page.value++;
    await _loadData();
  };

  const resetFilters = () => {
    filters.value = {};
  };

  // === 清晰的返回接口 ===
  return {
    // 状态（只读）
    users: readonly(users),
    isLoading: readonly(isLoading),
    pageInfo: readonly(pageInfo),

    // 源头（可观察）
    queryText,
    filters,

    // 动作（修改数据）
    search,
    nextPage,
    resetFilters,
  };
}
```

#### **接口检查清单**
- [ ] 状态都用 `readonly()` 或 computed 包装了吗？
- [ ] 方法都是动词命名（search, update, reset）吗？
- [ ] 返回值清晰分为：状态、源头、动作三层吗？
- [ ] 是否有多余的内部细节暴露出来？

### 7.5 原则五：限制修改入口，减少手动赋值

好的 Hook 永远只让使用者通过明确的方法修改数据，避免直接暴露 ref 让外部乱改。

#### **反面：暴露太多 ref，无法追踪修改**
```ts
// 🚫 这样会导致数据流混乱
function useTodo() {
  const todos = ref([]);
  const selectedId = ref(null);
  const filter = ref('all');
  const loading = ref(false);

  // ... 直接暴露所有 ref，外部可以任意改
  return { todos, selectedId, filter, loading };
}

// 使用端随意修改，无法追踪
todos.value = newList; // 直接赋值，可能跳过验证
selectedId.value = 123; // 没人知道这会触发什么副作用
```

#### **正面：通过方法严格控制修改**
```ts
// ✅ 只暴露必要的方法，所有修改都可追踪
function useTodo() {
  const todos = ref<Todo[]>([]);
  const selectedId = ref<number | null>(null);
  const filter = ref<Filter>('all');
  const loading = ref(false);

  // 验证 + 修改的方法
  const loadTodos = async () => {
    loading.value = true;
    try {
      const data = await fetchTodos(filter.value);
      todos.value = data; // 唯一修改入口
    }
    finally {
      loading.value = false;
    }
  };

  const selectTodo = (id: number) => {
    // 可以加验证逻辑
    if (todos.value.find(t => t.id === id)) {
      selectedId.value = id;
    }
  };

  const setFilter = (newFilter: Filter) => {
    if (newFilter !== filter.value) {
      filter.value = newFilter;
      // 自动重新加载
      loadTodos();
    }
  };

  // 返回只读状态 + 控制方法
  return {
    todos: readonly(todos),
    selectedId: readonly(selectedId),
    filter: readonly(filter),
    loading: readonly(loading),
    loadTodos,
    selectTodo,
    setFilter,
  };
}
```

### 7.6 数据流清晰度自检

在完成重构后，用以下问题检查数据流是否足够清晰：

1. **源头识别** - 能否清楚列出所有数据源头（props、ref、store）？
2. **流向追踪** - 从源头到渲染输出，能否用箭头画出完整流向？
3. **修改入口** - 所有数据修改是否都通过明确的方法？
4. **环路排查** - 是否存在 A→B→A 的依赖环？
5. **冗余检测** - 是否有多个 watch 做相同的事？
6. **粒度评估** - 一个组件是否监听了过多细粒度的状态变化？

---

## 8. 常见模式和反模式

### 8.1 推荐模式

#### **分层架构模式**
```ts
// 数据层
const { data, loading } = useDataSource();

// 业务逻辑层
const { processedData, actions } = useBusinessLogic(data);

// 表现层（组件）
// 只处理用户交互和渲染
```

#### **管道模式**
```ts
function useDataPipeline(input: Ref<RawData>) {
  const step1 = computed(() => transform1(input.value));
  const step2 = computed(() => transform2(step1.value));
  const step3 = computed(() => transform3(step2.value));

  return { result: step3 };
}
```

#### **职责分离模式**
```ts
// ✅ 按职责分离不同的 composable
const { data, loading, error } = useDataFetching();
const { filteredData } = useDataFiltering(data);
const { selectedItems, toggleSelection } = useSelection();
const { exportData } = useDataExport(filteredData);
```

### 8.2 避免的反模式

#### **上帝对象反模式**
```ts
// 🚫 单个 composable 处理所有逻辑
function useEverything() {
  // 用户管理
  // 数据加载
  // UI 状态
  // 路由控制
  // ... 50+ 个状态和方法
}
```

#### **过度抽象反模式**
```ts
// 🚫 为了复用而过度抽象
function useGenericDataProcessor<T, U, V>(
  processor: (data: T, config: U) => V,
  validator: (result: V) => boolean,
  transformer: (result: V) => any,
) {
  // 过于通用，失去了类型安全和可读性
}
```

#### **依赖传递反模式**
```ts
// 🚫 通过参数传递大量依赖
function useFeature(
  dep1: Ref<A>,
  dep2: Ref<B>,
  dep3: Ref<C>,
  dep4: Ref<D>,
  dep5: Ref<E>,
) {
  // 应该考虑在内部获取或重新设计架构
}
```

## 9. 重构检查清单

### 9.1 结构检查
- [ ] VHO 节点数 < 15
- [ ] 无关节点存在
- [ ] 孤立节点群 < 3个
- [ ] 依赖链深度 < 4层

### 9.2 设计检查
- [ ] 所有 Composable 职责单一
- [ ] 接口遵循最小暴露原则
- [ ] 生命周期归属合理
- [ ] 状态归属决策正确

### 9.3 数据流检查（新增）
- [ ] 数据流为单向流水线，无环路
- [ ] 只有 ref 作为源头被手动修改，computed 从不手动赋值
- [ ] 所有副作用方法都是动词命名（handle/update/reset）
- [ ] Composable 返回值清晰分为：状态、派生值、方法三层
- [ ] 没有跨多个 watch 的传递修改（watch A 改 B，B 改 C）
- [ ] 能从代码直接读出数据源头→转换→输出的完整链路

### 9.4 质量检查
 - [ ] 类型安全完整
 - [ ] 测试覆盖充分
 - [ ] 性能无明显退化
 - [ ] 可读性和可维护性提升

### 9.5 业务检查
- [ ] 原有功能完整保留
- [ ] 新增功能便于实现
- [ ] 代码复用性良好
- [ ] 团队理解成本可接受

通过遵循这份指南，开发者可以系统性地利用 VHO MCP 提供的分析结果，将复杂的 Vue 组件重构为结构清晰、职责明确、易于维护的代码架构。
重构过程中始终以 VHO 分析的依赖关系图为指导，确保每一步重构都能有效降低代码复杂度并提升可维护性。
