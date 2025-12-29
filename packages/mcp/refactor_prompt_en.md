---
name: vho-refactor-en
description: Skill for Vue/React refactoring driven by VHO analysis. First call the vue-hook-optimizer MCP analyze tool to obtain the dependency graph and suggestions, then execute the refactor plan and re-validate.
---
# Vue Component Refactoring Guide Based on VHO Analysis

## 0. Usage (MCP Invocation)
- When to use: you need a real dependency graph and optimization suggestions to guide refactoring
- Prerequisite: the `vue-hook-optimizer`/`vho` MCP server is connected and tool `analyze` is available
- Input:
  - `absolutePath`: absolute path of the component file to analyze
  - `framework`: `vue` or `react` (default `vue`)
- Steps:
  - Invoke MCP tool `analyze` with the above parameters
  - Parse the output `mermaid` code block (dependency graph), suggestion list, and **variable communities**
  - Apply the results with sections 1–8 of this guide for decision and implementation
  - After refactoring, run type checking first:
    - Prefer checking your project `package.json` for an existing typecheck script (e.g. `typecheck`, `tsc`, `vue-tsc`), and run it (`pnpm run typecheck`, `npm run typecheck`, or `yarn typecheck`)
    - If no script exists:
      - Vue projects: run `vue-tsc --noEmit`
      - React projects: run `tsc --noEmit`
  - When type checks pass, invoke `analyze` again to re-validate (see 6.3 and 8)
- Output:
  - `mermaid`: visualized node/edge dependency graph
  - Suggestions: hints for cycles, chain calls, isolated node groups, articulation points
  - **Variable Communities**: tightly coupled variable groups detected via Label Propagation algorithm. Each community represents a set of variables that can be extracted together

## 1. Refactoring Decision Framework

### 1.1 Interpreting VHO Analysis Metrics

#### **Node Count Assessment**
- **< 10 nodes**: Simple structure, low refactoring priority
- **10-20 nodes**: Medium complexity, focus on articulation points and isolated nodes
- **> 20 nodes**: High complexity, refactoring required

#### **Key Metrics Identification**
- **Articulation Points**: Nodes that, when removed, would split the dependency graph. These are typically core targets for refactoring
- **Isolated Node Groups**: Sets of nodes that are interconnected but separated from the main logic. These are candidates for extraction and usually need to be modularized based on actual business meaning
- **Variable Communities**: Tightly coupled variable groups detected by algorithm. Variables within the same community have frequent interdependencies and are ideal candidates for extraction into Composables/Hooks. Larger communities may need to be split
- **Dependency Depth**: Long chain dependencies indicate mixed responsibilities, requiring layered processing
- **Logical Independence**: Extracted code should be independent, complete, and meaningful logical blocks. It should neither be overly coupled with multiple modules nor be overly simple function definitions or variable re-exports

### 1.2 Refactoring Priority Matrix

| VHO Characteristics | Refactoring Priority | Refactoring Strategy |
|---------|-----------|----------|
| Articulation points + High node count | **Very High** | Immediately extract logic related to articulation points |
| Multiple isolated node groups | **High** | Extract by functional domain grouping |
| Large community (>8 members) | **High** | Extract as independent Composable following community boundaries |
| Multiple small communities (2-5 members) | **Medium** | Evaluate business meaning, decide whether to merge or extract separately |
| Long chain dependencies | **Medium** | Layered refactoring, establish clear data flow |
| Circular dependencies | **Very High** | Break the cycle, redesign interfaces |

### 1.3 Community-Based Refactoring Strategy

#### **Interpreting Community Analysis**
Community detection outputs results like:
```
### Community 1 (5 members)
  - `userData` (variable, line 10)
  - `loading` (variable, line 12)
  - `fetchUser` (function, line 15)
  - `updateUser` (function, line 25)
  - `userError` (variable, line 35)
```

#### **Community Refactoring Decisions**
1. **Single community + Clear responsibility** → Extract directly as one Composable
2. **Single community + Mixed responsibilities** → Split by responsibility first, then extract separately
3. **Multiple communities + Independent** → Extract each community as independent Composable
4. **Multiple communities + Cross-references** → Analyze intersection points, may need to extract shared logic

#### **Community Naming Suggestions**
Name based on common characteristics of community members:
- By data entity: `useUser`, `useOrder`, `useProduct`
- By functionality: `useDataFetching`, `useFormValidation`
- By business process: `useCheckout`, `useAuthentication`

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

## 7. Data Flow Management Principles

In complex Composition API development, clear data flow is key to maintainability. This section introduces 5 principles to ensure refactored code follows best practices for data flow management.

### 7.1 Principle One: Adopt Unidirectional Data Flow Pipeline Pattern

Avoid data jumping across multiple refs. Instead, use `computed` to build a single-directional pipeline. Data should flow in a single direction, not form cycles.

#### **Anti-pattern Example: Data Jumping Horizontally**
```ts
// 🚫 Multiple refs dependent on each other, hard to trace
const searchText = ref('');
const filters = ref({});
const sortOrder = ref('asc');

// watch A modifies B, B modifies C...
watch(searchText, () => {
  filters.value = computeFilters();
});

watch(filters, () => {
  sortOrder.value = 'asc'; // Manual reset
  fetchData();
});

watch(sortOrder, () => {
  fetchData(); // Redundant request
});
```

#### **Best Practice Example: Vertical Pipeline Flow**
```ts
// ✅ Clear unidirectional pipeline
const searchText = ref('');
const pageNum = ref(1);

// Step 1: Normalize/Clean input
const normalizedText = computed(() => searchText.value.trim().toLowerCase());

// Step 2: Trigger async operation
const { data, loading } = useDataFetching(normalizedText, pageNum);

// Step 3: Business filtering/sorting (don't modify source data)
const processedData = computed(() => {
  if (!data.value) { return []; }
  return data.value
    .filter(item => matchesText(item, normalizedText.value))
    .sort((a, b) => a.priority - b.priority);
});

// Final output to template
return { processedData, loading };
```

#### **Self-Check Questions**
- Can the data flow be drawn as a **non-returning arrow sequence**?
- Are there any **cycles** (A changes B, B changes A)?
- Can you **read the flow directly from top to bottom**?

### 7.2 Principle Two: Explicitly Mark Side Effect Entries

Don't hide side effects scattered throughout the code. Use clear method names and debug hooks to mark them explicitly.

#### **Side Effect Naming Convention**
```ts
function useUserSearch() {
  const state = ref({});

  // ✅ Verb-based naming: indicates this method modifies data
  const handleSearch = async (query: string) => {};
  const handlePageChange = (page: number) => {};
  const updateFilters = (filters: any) => {};

  // ❌ Avoid ambiguous names like:
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

### 7.3 Principle Three: Distinguish "Source of Truth" from "Derived State"

**Source of Truth**: User clicks, URL parameters, WebSocket messages, external API returns
**Derived State**: State derived via `computed` or `watch` (loading, filteredList, disabledButton, etc.)

#### **Wrong: Treating Derived State as Source**
```ts
// 🚫 Manually modifying loading when userType changes
watch(userType, () => {
  loading.value = true; // This is derived state, shouldn't be manually modified
  fetchData();
});
```

#### **Correct: Only Modify Source, Let Derived State Auto-Propagate**
```ts
// ✅ Only source userType and query are refs
const userType = ref('');
const query = ref('');

// Everything else is computed (derived state)
const loading = computed(() => {
  return isFetching.value || isProcessing.value;
});

const filteredUsers = computed(() => {
  return users.value.filter(u => u.type === userType.value && u.name.includes(query.value));
});

const isEmpty = computed(() => filteredUsers.value.length === 0);

// Side effects only trigger on source changes
watch([userType, query], async () => {
  // Automatically triggers loading
}, { debounce: 300 });
```

### 7.4 Principle Four: Interface Design Reflects Data Flow

Through clear interface structure, users can immediately see which are read-only (states, derived values) and which are action entry points (methods).

#### **Layered Interface Design**
```ts
export function useUserSearch() {
  // === Internal states (hidden) ===
  const _page = ref(1);
  const _cache = new Map();
  const _isRequesting = ref(false);

  // === Source of truth (observable but modify via methods) ===
  const queryText = ref('');
  const filters = ref({});

  // === Derived states (read-only) ===
  const isLoading = computed(() => _isRequesting.value);
  const users = computed(() => _cache.get(cacheKey.value) || []);
  const hasMore = computed(() => users.value.length < totalCount.value);
  const pageInfo = computed(() => ({
    current: _page.value,
    hasMore: hasMore.value,
  }));

  // === Action methods (data modification entry points) ===
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

  // === Clear return interface ===
  return {
    // States (read-only)
    users: readonly(users),
    isLoading: readonly(isLoading),
    pageInfo: readonly(pageInfo),

    // Source of truth (observable)
    queryText,
    filters,

    // Actions (data modification)
    search,
    nextPage,
    resetFilters,
  };
}
```

#### **Interface Checklist**
- [ ] Are all states wrapped with `readonly()` or computed?
- [ ] Are all methods verb-named (search, update, reset)?
- [ ] Is the return value clearly divided into: states, sources, actions?
- [ ] Are there unnecessary internal details exposed?

### 7.5 Principle Five: Limit Modification Entry Points, Reduce Direct Assignments

Good Hooks only allow callers to modify data through explicit methods, avoiding direct ref exposure that leads to uncontrolled mutations.

#### **Anti-pattern: Exposing Too Many Refs**
```ts
// 🚫 This causes data flow chaos
function useTodo() {
  const todos = ref([]);
  const selectedId = ref(null);
  const filter = ref('all');
  const loading = ref(false);

  // ... Expose all refs directly, allowing arbitrary modifications
  return { todos, selectedId, filter, loading };
}

// Callers can modify at will, making changes untraceable
todos.value = newList; // Direct assignment, may skip validation
selectedId.value = 123; // Who knows what side effects this triggers?
```

#### **Best Practice: Strict Control via Methods**
```ts
// ✅ Only expose necessary methods, all modifications are traceable
function useTodo() {
  const todos = ref<Todo[]>([]);
  const selectedId = ref<number | null>(null);
  const filter = ref<Filter>('all');
  const loading = ref(false);

  // Validation + modification methods
  const loadTodos = async () => {
    loading.value = true;
    try {
      const data = await fetchTodos(filter.value);
      todos.value = data; // Single modification entry point
    }
    finally {
      loading.value = false;
    }
  };

  const selectTodo = (id: number) => {
    // Can add validation logic
    if (todos.value.find(t => t.id === id)) {
      selectedId.value = id;
    }
  };

  const setFilter = (newFilter: Filter) => {
    if (newFilter !== filter.value) {
      filter.value = newFilter;
      // Auto-reload
      loadTodos();
    }
  };

  // Return read-only states + control methods
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

### 7.6 Data Flow Clarity Self-Check

After completing refactoring, use these questions to verify data flow clarity:

1. **Source Identification** - Can you clearly list all data sources (props, refs, store)?
2. **Flow Tracing** - From source to rendering output, can you draw the complete flow with arrows?
3. **Modification Entry** - Are all data modifications made through explicit methods?
4. **Cycle Detection** - Are there any A→B→A dependency cycles?
5. **Redundancy Detection** - Are there multiple watches doing the same thing?
6. **Granularity Assessment** - Is a component watching too many fine-grained state changes?

---

## 8. Common Patterns and Anti-patterns

### 8.1 Recommended Patterns

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

### 8.2 Anti-patterns to Avoid

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

## 9. Refactoring Checklist

### 9.1 Structural Check
- [ ] VHO node count < 15
- [ ] No articulation points exist
- [ ] Isolated node groups < 3
- [ ] Dependency chain depth < 4 layers

### 9.2 Design Check
- [ ] All Composables have single responsibility
- [ ] Interfaces follow minimal exposure principle
- [ ] Lifecycle ownership is appropriate
- [ ] State ownership decisions are correct

### 9.3 Data Flow Check (NEW)
- [ ] Data flow is a unidirectional pipeline with no cycles
- [ ] Only refs as sources are manually modified, computed values are never directly assigned
- [ ] All side effect methods use verb-based naming (handle/update/reset)
- [ ] Composable return values clearly separate into: states, derived values, methods
- [ ] No cascading modifications across multiple watches (watch A modifies B, watch B modifies C)
- [ ] Complete source→transform→output chain is directly readable from code

### 9.4 Quality Check
 - [ ] Type safety is complete
 - [ ] Test coverage is sufficient
 - [ ] No significant performance degradation
 - [ ] Readability and maintainability improved

### 9.5 Business Check
- [ ] All original functionality preserved
- [ ] New features easy to implement
- [ ] Good code reusability
- [ ] Team understanding cost acceptable

By following this guide, developers can systematically utilize the analysis results
provided by VHO MCP to refactor complex Vue components into clearly structured, responsibility-focused, and easily maintainable code architectures.

Throughout the refactoring process, always use the VHO analysis dependency graph as a guide
to ensure that each refactoring step effectively reduces code complexity and improves maintainability.
