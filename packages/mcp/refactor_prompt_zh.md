---
name: vho-refactor-zh
description: 基于 VHO 的 Vue/React 组件重构技能。先调用 vue-hook-optimizer MCP 的 analyze 工具获取依赖图与建议，再按决策框架实施重构并复验。
---
# 基于 VHO 分析的 Vue 组件重构指南

## ⚠️ 关键约束

在整个重构过程中，你必须遵守以下规则：

1. **绝不破坏功能** - 所有原有功能、输出和行为必须保持不变。重构前后都要验证类型检查通过。
2. **避免过度提取** - 如果社区成员 <3 个，通常保持内联。不是所有东西都需要变成 Composable。
3. **不要为了重构而重构** - 如果 VHO 显示 <10 节点且无循环依赖和关节点，考虑跳过重构。
4. **保持可读性** - 选择清晰而非简洁。显式代码优于过度紧凑的解决方案。
5. **尊重现有模式** - 遵循项目已建立的编码约定和模式。

## 0. 决策流程（按顺序执行）

你必须先调用 `analyze` 再做任何重构决策。绝不猜测依赖关系。

```
1. 运行 MCP `analyze` 工具 → 获取指标
   ↓
2. 如果节点 < 10 且无循环依赖且无关节点 → 停止，无需重构
   ↓
3. 如果存在循环依赖 → 必须先打破循环（优先级：极高）
   ↓
4. 如果存在关节点 → 提取相关逻辑（优先级：极高）
   ↓
5. 如果大型社区（>8 成员） → 提取为独立 Composable（优先级：高）
   ↓
6. 如果多个孤立节点群 → 按功能域提取（优先级：高）
   ↓
7. 如果长链式依赖（>4 层） → 分层重构（优先级：中）
   ↓
8. 运行类型检查 → 通过后，重新运行 `analyze` 验证改进
```

### 工具调用
- **前置条件**：`vue-hook-optimizer`/`vho` MCP 服务器已连接，工具 `analyze` 可用
- **输入**：`absolutePath`（文件路径），`framework`（`vue` | `react`，默认 `vue`）
- **输出**：`mermaid` 依赖图、建议列表、变量社区

### 类型检查命令
- 优先检查 `package.json` 是否有现成脚本（`typecheck`、`tsc`、`vue-tsc`）
- Vue 备选：`vue-tsc --noEmit`
- React 备选：`tsc --noEmit`

## 1. 关键概念参考

### VHO 输出术语表
- **关节点（Articulation Points）**：移除后会分割图的节点 → 核心重构目标
- **孤立节点群**：相互关联但与主逻辑分离的节点 → 提取候选
- **变量社区**：通过 Label Propagation 检测的紧密耦合变量 → 一起提取为 Composable
- **依赖深度**：链长度；>4 层表示职责混乱

### 基于社区的决策
| 社区模式 | 操作 |
|----------|------|
| 单一 + 职责明确 | 提取为一个 Composable |
| 单一 + 职责混合 | 先拆分，再提取 |
| 多个 + 各自独立 | 分别提取 |
| 多个 + 存在交叉 | 先提取共享逻辑 |

### 命名约定
- 按实体：`useUser`、`useOrder`、`useProduct`
- 按功能：`useDataFetching`、`useFormValidation`
- 按流程：`useCheckout`、`useAuthentication`

## 2. Composable 提取标准

### 何时提取
如果以下任一条件为真，则提取为 Composable：
- 3+ 个相关的响应式状态
- 完整的生命周期管理（mount/unmount）
- 复杂的副作用处理
- 已复用或可能复用

### 何时合并
当以下任一条件为真时，考虑合并两个 Composable：
- 共享状态占比 >50%
- 总是成对使用，从不单独调用
- 拆分后需要互相传递 ≥3 个参数

### 状态归属速查

| 状态类型 | 归属位置 | 示例 |
|----------|----------|------|
| 内部生命周期状态 | Composable 内部 | `loading`、`error`、`page`、`cache` |
| 用户输入/配置 | 作为参数传入 | `userInput`、`options`、`externalData` |
| 全局上下文 | 内部获取 | `useRoute()`、`useStore()` |

## 3. 生命周期归属

### 决策矩阵

| 生命周期 | → Composable | → 组件 |
|----------|--------------|--------|
| `onMounted` | 数据获取、轮询 | DOM 操作、图表初始化 |
| `onUnmounted` | 定时器/请求清理 | 事件解绑 |
| `watch` | 业务状态变化 | UI 状态变化 |
| `computed` | 业务计算 | 样式计算 |

### 副作用触发归属

| 模式 | 适用场景 | 风险 |
|------|----------|------|
| Composable 内部触发 | 副作用与状态强绑定，无外部协调需求 | 难以追踪、多处重复触发 |
| 回调参数传入 | 需要灵活性但调用方单一 | 回调地狱、依赖不透明 |
| **组件层 Watch 统一协调** | 多个状态源影响同一副作用 | 需明确依赖 |

**原则**：当 ≥2 个状态源触发同一副作用时，将触发逻辑上移到组件层。

## 4. 重构策略

### 关节点类型与解决方案
| 类型 | 问题 | 解决方案 |
|------|------|----------|
| 数据转换 | 多种格式转换 | 拆分为 `useDataProcessor()` |
| 状态协调 | 协调多个状态 | 提取协调逻辑 |
| 副作用集中 | 多种副作用 | 分离 `useAnalytics()`、`useUIUpdater()` |

### 孤立节点群整合
```ts
// 🚫 分散          →  ✅ 按域整合
const userProfile = ref({});    const { profile, update } = useUserProfile();
const orderHistory = ref([]);   const { orders, load } = useOrderHistory();
```

## 5. 接口设计

### 最小暴露原则
- 用 `readonly()` 或 computed 包装状态
- 只暴露必要的方法（动词命名：`load`、`refresh`、`reset`）
- 返回结构：`{ 状态（只读）、源头、动作 }`

## 6. 实施步骤

1. **提取纯函数** → 无副作用的工具函数（`formatData`、`validateInput`）
2. **提取状态管理** → 相关状态 + 操作作为 Composable
3. **整合副作用** → 生命周期和异步操作
4. **验证** → 重新运行 `analyze`，检查节点数减少、关节点消除

### Composable 声明顺序

在 `<script setup>` 中，Composable 调用顺序必须符合依赖拓扑排序：

1. 先声明**被依赖的状态提供者**
2. 再声明**消费这些状态的 Composable**
3. 最后声明**聚合/协调层**

**检查方法**：如果 Composable B 的参数包含 Composable A 的返回值，则 A 必须先声明。

```ts
// ✅ 正确顺序
const { user } = useUser();                    // 1. 状态提供者
const { orders } = useOrders(user);            // 2. 消费者
const { checkout } = useCheckout(user, orders); // 3. 聚合层
```

## 7. 数据流原则

### 7.1 单向管道
- 使用 `computed` 链，而非交叉 watch 修改
- 数据流向：`源头 ref → computed 转换 → 输出`
- 无循环（A→B→A）

### 7.2 副作用命名
- 使用动词前缀：`handle*`、`update*`、`reset*`、`fetch*`
- 避免模糊命名：`process`、`change`、`do`

### 7.3 源头 vs 派生状态
| 类型 | 示例 | 规则 |
|------|------|------|
| 源头（Source of Truth） | `userType`、`query`、URL 参数 | 只有这些可以手动修改 |
| 派生状态 | `loading`、`filteredList`、`isEmpty` | 始终 computed，从不赋值 |

### 7.4 接口结构
```ts
return {
  // 状态（只读）
  data: readonly(data),
  loading: readonly(loading),
  // 源头（可观察）
  query,
  filters,
  // 动作（修改入口）
  search,
  reset,
};
```

### 7.5 数据流自检
- [ ] 数据流能否画成不返回的箭头？
- [ ] 无循环（A→B→A）？
- [ ] 所有修改都通过显式方法？
- [ ] 没有冗余的 watch 做同样的事？

---

## 8. 模式与反模式

### ✅ 推荐
| 模式 | 描述 |
|------|------|
| 分层架构 | 数据层 → 业务逻辑 → 表现层 |
| 管道模式 | `computed` 链：step1 → step2 → step3 |
| 职责分离 | `useDataFetching()`、`useFiltering()`、`useSelection()` |

### 🚫 避免
| 反模式 | 问题 |
|--------|------|
| 上帝对象 | 单个 composable 包含 50+ 状态/方法 |
| 过度抽象 | 泛型处理器失去类型安全 |
| 依赖传递 | 5+ 个 Ref 参数 → 改为内部获取 |

---

## 9. 最终检查清单

### 结构
- [ ] VHO 节点数 < 15
- [ ] 无关节点
- [ ] 孤立节点群 < 3
- [ ] 依赖深度 < 4 层

### 设计
- [ ] 每个 Composable 单一职责
- [ ] 最小暴露接口
- [ ] 正确的生命周期/状态归属

### 数据流
- [ ] 单向管道，无循环
- [ ] 只有源头 ref 被手动修改
- [ ] 动词命名的副作用方法
- [ ] 无级联 watch 修改

### 质量
- [ ] 类型检查通过
- [ ] 原有功能保留
- [ ] 可读性提升
