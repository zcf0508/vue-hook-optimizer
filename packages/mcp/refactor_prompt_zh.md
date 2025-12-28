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

## 7. 常见模式和反模式

### 7.1 推荐模式

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

### 7.2 避免的反模式

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

## 8. 重构检查清单

### 8.1 结构检查
- [ ] VHO 节点数 < 15
- [ ] 无关节点存在
- [ ] 孤立节点群 < 3个
- [ ] 依赖链深度 < 4层

### 8.2 设计检查
- [ ] 所有 Composable 职责单一
- [ ] 接口遵循最小暴露原则
- [ ] 生命周期归属合理
- [ ] 状态归属决策正确

### 8.3 质量检查
- [ ] 类型安全完整
- [ ] 测试覆盖充分
- [ ] 性能无明显退化
- [ ] 可读性和可维护性提升

### 8.4 业务检查
- [ ] 原有功能完整保留
- [ ] 新增功能便于实现
- [ ] 代码复用性良好
- [ ] 团队理解成本可接受

通过遵循这份指南，开发者可以系统性地利用 VHO MCP 提供的分析结果，将复杂的 Vue 组件重构为结构清晰、职责明确、易于维护的代码架构。
重构过程中始终以 VHO 分析的依赖关系图为指导，确保每一步重构都能有效降低代码复杂度并提升可维护性。
