# Vue Component Refactoring Guide Based on VHO Analysis

## 1. Refactoring Decision Framework

### 1.1 Interpreting VHO Analysis Metrics

#### **Node Count Assessment**
- **< 10 nodes**: Simple structure, low refactoring priority
- **10-20 nodes**: Medium complexity, focus on articulation points and isolated nodes
- **> 20 nodes**: High complexity, refactoring required

#### **Key Metrics Identification**
- **Articulation Points**: Nodes that, when removed, would split the dependency graph. These are typically core targets for refactoring
- **Isolated Node Groups**: Sets of nodes that are interconnected but separated from the main logic. These are candidates for extraction and usually need to be modularized based on actual business meaning
- **Dependency Depth**: Long chain dependencies indicate mixed responsibilities, requiring layered processing
- **Logical Independence**: Extracted code should be independent, complete, and meaningful logical blocks. It should neither be overly coupled with multiple modules nor be overly simple function definitions or variable re-exports

### 1.2 Refactoring Priority Matrix

| VHO Characteristics | Refactoring Priority | Refactoring Strategy |
|---------|-----------|----------|
| Articulation points + High node count | **Very High** | Immediately extract logic related to articulation points |
| Multiple isolated node groups | **High** | Extract by functional domain grouping |
| Long chain dependencies | **Medium** | Layered refactoring, establish clear data flow |
| Circular dependencies | **Very High** | Break the cycle, redesign interfaces |

## 2. Composable Extraction Decision Tree

### 2.1 Functional Cohesion Assessment

```
Should it be extracted as a Composable?
├─ Are there 3+ related reactive states? ──── Yes ──┐
├─ Is there complete lifecycle management? ── Yes ──┤
├─ Is there complex side effect handling? ─── Yes ──┤
└─ Is it reused or potentially reusable? ──── Yes ──┤
                                                    └──→ Extract as Composable
```

### 2.2 State Ownership Decision

#### **States to Place Inside Composable**
```ts
// Criteria: Internal states
const internalStates = {
  // ✅ Lifecycle completely controlled by logic
  loading: ref(false),
  error: ref(null),

  // ✅ Algorithm/protocol related states
  page: ref(1),
  cursor: ref(''),

  // ✅ Cache and optimization states
  cache: new Map(),
  isRequesting: false,
};
```

#### **States Passed as Parameters**
```ts
// Criteria: External control
function useFeature(
  // ✅ User input/interaction states
  userInput: Ref<string>,

  // ✅ Configuration options
  options: Ref<Options>,

  // ✅ External dependencies
  externalData: Ref<Data>,
) {}
```

#### **States Retrieved Internally**
```ts
function useFeature() {
  // ✅ Global states (router, store, etc.)
  const route = useRoute();
  const store = useStore();

  // ✅ Environment/context states
  const { message } = App.useApp();
}
```

## 3. Vue Lifecycle Function Ownership Guide

### 3.1 Lifecycle Ownership Decision Matrix

| Lifecycle | Ownership Decision | Example Scenarios |
|---------|---------|----------|
| `onMounted` | Based on initialization content | Data loading → Composable<br/>DOM operations → Component |
| `onUnmounted` | Based on cleanup content | Timer cleanup → Composable<br/>Event unbinding → Component |
| `watch/watchEffect` | Based on responding states | Business state changes → Composable<br/>UI state changes → Component |
| `computed` | Based on computation dependencies | Business calculations → Composable<br/>Style calculations → Component |

### 3.2 Specific Decision Rules

#### **Lifecycle Functions That Should Go in Composables**
```ts
// ✅ Data fetching and business logic initialization
onMounted(() => {
  fetchData();
  startPolling();
});

// ✅ Reactive handling of business states
watch(searchKeyword, (newVal) => {
  resetPagination();
  loadData(newVal);
});

// ✅ Resource and business logic cleanup
onUnmounted(() => {
  clearInterval(pollingTimer);
  abortPendingRequests();
});
```

#### **Lifecycle Functions That Should Stay in Components**
```ts
// ✅ DOM-related operations
onMounted(() => {
  focusInput();
  initializeChart();
});

// ✅ UI state responses
watch(isVisible, (visible) => {
  if (visible) {
    playAnimation();
  }
});

// ✅ Component-specific cleanup
onUnmounted(() => {
  destroyChart();
  removeEventListeners();
});
```

## 4. Dependency Relationship Refactoring Strategies

### 4.1 Articulation Point Handling Strategy

#### **Identifying Articulation Point Types**
1. **Data Transformation Nodes**: Handle multiple data format conversions
2. **State Coordination Nodes**: Coordinate changes across multiple states
3. **Side Effect Concentration Nodes**: Handle multiple side effects

#### **Refactoring Solutions**
```ts
// 🚫 Articulation point: Single function handling multiple responsibilities
function processData(rawData, filters, sortOptions) {
  // Data filtering
  const filtered = applyFilters(rawData, filters);
  // Data sorting
  const sorted = applySorting(filtered, sortOptions);
  // Triggering side effects
  updateUI(sorted);
  trackEvent('data_processed');
  return sorted;
}
```

```ts
// ✅ Split into multiple single-responsibility functions
const { processData } = useDataProcessor();
const { updateUI } = useUIUpdater();
const { trackEvent } = useAnalytics();
```

### 4.2 Isolated Node Group Integration

#### **Grouping by Functional Domain**
```ts
// 🚫 Scattered related logic
const userProfile = ref({});
function updateProfile() {}
function validateProfile() {}

const orderHistory = ref([]);
function loadOrders() {}
function filterOrders() {}
```
```
// ✅ Integrated by domain
const { profile, updateProfile, validateProfile } = useUserProfile();
const { orders, loadOrders, filterOrders } = useOrderHistory();
```

## 5. Interface Design Principles

### 5.1 Minimal Exposure Principle

```ts
// ✅ Only expose necessary interfaces
function useDataLoader() {
  // Internal states
  const page = ref(1);
  const cache = new Map();
  const isRequesting = ref(false);

  // Exposed states
  const data = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Exposed methods
  const load = () => {};
  const refresh = () => {};

  return {
    // Only return what's needed externally
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    load,
    refresh,
  };
}
```

## 6. Refactoring Implementation Process

### 6.1 Analysis Phase

1. **Interpret VHO Analysis Results**
   - Identify articulation points and isolated node groups
   - Assess dependency relationship complexity
   - Determine refactoring priorities

2. **Develop Refactoring Plan**
   - Prioritize refactoring targets
   - Map existing dependency relationships
   - Design new interface structures

### 6.2 Implementation Phase

#### **Step 1: Extract Pure Functions**
```ts
// First extract side-effect-free pure functions
function formatData(raw) { /* ... */ }
function validateInput(input) { /* ... */ }
```

#### **Step 2: Extract State Management**
```ts
// Then extract related states and their operations
function useDataState() {
  const data = ref([]);
  const setData = (newData) => {
    data.value = newData;
  };
  return { data, setData };
}
```

#### **Step 3: Integrate Side Effects**
```ts
// Finally integrate side effects and lifecycle
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

### 6.3 Validation Phase

1. **Re-analyze VHO Results**
   - Has the node count decreased?
   - Have articulation points been eliminated?
   - Have dependency relationships been simplified?

2. **Functional Validation**
   - Are all original functionalities preserved?
   - Is there any performance degradation?
   - Do type checks pass?

3. **Maintainability Assessment**
   - Ease of adding new features
   - Potential for code reuse
   - Completeness of test coverage

## 7. Common Patterns and Anti-patterns

### 7.1 Recommended Patterns

#### **Layered Architecture Pattern**
```ts
// Data layer
const { data, loading } = useDataSource();

// Business logic layer
const { processedData, actions } = useBusinessLogic(data);

// Presentation layer (component)
// Only handles user interaction and rendering
```

#### **Pipeline Pattern**
```ts
function useDataPipeline(input: Ref<RawData>) {
  const step1 = computed(() => transform1(input.value));
  const step2 = computed(() => transform2(step1.value));
  const step3 = computed(() => transform3(step2.value));

  return { result: step3 };
}
```

#### **Responsibility Separation Pattern**
```ts
// ✅ Separate different composables by responsibility
const { data, loading, error } = useDataFetching();
const { filteredData } = useDataFiltering(data);
const { selectedItems, toggleSelection } = useSelection();
const { exportData } = useDataExport(filteredData);
```

### 7.2 Anti-patterns to Avoid

#### **God Object Anti-pattern**
```ts
// 🚫 Single composable handling all logic
function useEverything() {
  // User management
  // Data loading
  // UI states
  // Routing control
  // ... 50+ states and methods
}
```

#### **Over-abstraction Anti-pattern**
```ts
// 🚫 Over-abstraction for the sake of reuse
function useGenericDataProcessor<T, U, V>(
  processor: (data: T, config: U) => V,
  validator: (result: V) => boolean,
  transformer: (result: V) => any,
) {
  // Too generic, loses type safety and readability
}
```

#### **Dependency Passing Anti-pattern**
```ts
// 🚫 Passing numerous dependencies through parameters
function useFeature(
  dep1: Ref<A>,
  dep2: Ref<B>,
  dep3: Ref<C>,
  dep4: Ref<D>,
  dep5: Ref<E>,
) {
  // Should consider retrieving internally or redesigning architecture
}
```

## 8. Refactoring Checklist

### 8.1 Structural Check
- [ ] VHO node count < 15
- [ ] No articulation points exist
- [ ] Isolated node groups < 3
- [ ] Dependency chain depth < 4 layers

### 8.2 Design Check
- [ ] All Composables have single responsibility
- [ ] Interfaces follow minimal exposure principle
- [ ] Lifecycle ownership is appropriate
- [ ] State ownership decisions are correct

### 8.3 Quality Check
- [ ] Type safety is complete
- [ ] Test coverage is sufficient
- [ ] No significant performance degradation
- [ ] Readability and maintainability improved

### 8.4 Business Check
- [ ] All original functionality preserved
- [ ] New features easy to implement
- [ ] Good code reusability
- [ ] Team understanding cost acceptable

By following this guide, developers can systematically utilize the analysis results
provided by VHO MCP to refactor complex Vue components into clearly structured, responsibility-focused, and easily maintainable code architectures.

Throughout the refactoring process, always use the VHO analysis dependency graph as a guide
to ensure that each refactoring step effectively reduces code complexity and improves maintainability.
