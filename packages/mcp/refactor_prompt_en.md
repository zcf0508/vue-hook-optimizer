---
name: vho-refactor-en
description: Skill for Vue/React refactoring driven by VHO analysis. First call the vue-hook-optimizer MCP analyze tool to obtain the dependency graph and suggestions, then execute the refactor plan and re-validate.
---
# Vue Component Refactoring Guide Based on VHO Analysis

## ⚠️ Critical Constraints

You MUST follow these rules throughout the refactoring process:

1. **Never break functionality** - All original features, outputs, and behaviors must remain intact. Verify type checks pass before AND after refactoring.
2. **Avoid over-extraction** - If a community has <3 members, usually keep it inline. Not everything needs to be a Composable.
3. **Don't refactor for refactoring's sake** - If VHO shows <10 nodes with no cycles or articulation points, consider skipping refactoring entirely.
4. **Preserve readability** - Choose clarity over brevity. Explicit code is better than overly compact solutions.
5. **Respect existing patterns** - Follow the project's established coding conventions and patterns.

## 0. Decision Flow (Follow in Order)

You MUST call `analyze` first before any refactoring decision. Never guess dependencies.

```
1. Run MCP `analyze` tool → get metrics
   ↓
2. If nodes < 10 AND no cycles AND no articulation points → STOP, no refactoring needed
   ↓
3. If circular dependencies exist → MUST break cycles first (Priority: Very High)
   ↓
4. If articulation points exist → extract those related logic (Priority: Very High)
   ↓
5. If large community (>8 members) → extract as independent Composable (Priority: High)
   ↓
6. If multiple isolated node groups → extract by functional domain (Priority: High)
   ↓
7. If long chain dependencies (>4 layers) → layered refactoring (Priority: Medium)
   ↓
8. Run type checks → if pass, re-run `analyze` to validate improvement
```

### Tool Invocation
- **Prerequisite**: `vue-hook-optimizer`/`vho` MCP server connected, tool `analyze` available
- **Input**: `absolutePath` (file path), `framework` (`vue` | `react`, default `vue`)
- **Output**: `mermaid` dependency graph, suggestions list, variable communities

### Type Check Commands
- Check `package.json` for existing script (`typecheck`, `tsc`, `vue-tsc`) first
- Vue fallback: `vue-tsc --noEmit`
- React fallback: `tsc --noEmit`

## 1. Key Concepts Reference

### VHO Output Glossary
- **Articulation Points**: Nodes that, when removed, split the graph → core refactoring targets
- **Isolated Node Groups**: Interconnected nodes separated from main logic → extraction candidates
- **Variable Communities**: Tightly coupled variables detected by Label Propagation → extract together as Composable
- **Dependency Depth**: Chain length; >4 layers indicates mixed responsibilities

### Community-Based Decisions
| Community Pattern | Action |
|-------------------|--------|
| Single + Clear responsibility | Extract as one Composable |
| Single + Mixed responsibilities | Split first, then extract |
| Multiple + Independent | Extract each separately |
| Multiple + Cross-references | Extract shared logic first |

### Naming Convention
- By entity: `useUser`, `useOrder`, `useProduct`
- By function: `useDataFetching`, `useFormValidation`
- By process: `useCheckout`, `useAuthentication`

## 2. Composable Extraction Criteria

### When to Extract
Extract as Composable if ANY of these are true:
- 3+ related reactive states
- Complete lifecycle management (mount/unmount)
- Complex side effect handling
- Reused or potentially reusable

### When to Merge
Consider merging two Composables if ANY of these are true:
- Shared state ratio >50%
- Always used together, never called separately
- Split requires passing ≥3 parameters between them

### State Ownership Quick Reference

| State Type | Where It Belongs | Examples |
|------------|------------------|----------|
| Internal lifecycle states | Inside Composable | `loading`, `error`, `page`, `cache` |
| User input / config | Pass as parameters | `userInput`, `options`, `externalData` |
| Global context | Retrieve internally | `useRoute()`, `useStore()` |

## 3. Lifecycle Ownership

### Decision Matrix

| Lifecycle | → Composable | → Component |
|-----------|--------------|-------------|
| `onMounted` | Data fetching, polling | DOM ops, chart init |
| `onUnmounted` | Timer/request cleanup | Event unbinding |
| `watch` | Business state changes | UI state changes |
| `computed` | Business calculations | Style calculations |

### Side Effect Trigger Ownership

| Pattern | Use Case | Risk |
|---------|----------|------|
| Inside Composable | Side effect tightly bound to state, no external coordination | Hard to trace, duplicate triggers |
| Callback parameter | Need flexibility but single caller | Callback hell, opaque dependencies |
| **Component-level Watch coordination** | Multiple state sources affect same side effect | Requires explicit dependencies |

**Principle**: When ≥2 state sources trigger the same side effect, move trigger logic up to component layer.

## 4. Refactoring Strategies

### Articulation Point Types & Solutions
| Type | Problem | Solution |
|------|---------|----------|
| Data Transformation | Multiple format conversions | Split into `useDataProcessor()` |
| State Coordination | Coordinates multiple states | Extract coordination logic |
| Side Effect Concentration | Multiple side effects | Separate `useAnalytics()`, `useUIUpdater()` |

### Isolated Node Group Integration
```ts
// 🚫 Scattered          →  ✅ Integrated by domain
const userProfile = ref({});    const { profile, update } = useUserProfile();
const orderHistory = ref([]);   const { orders, load } = useOrderHistory();
```

## 5. Interface Design

### Minimal Exposure Principle
- Wrap states with `readonly()` or computed
- Only expose necessary methods (verb-named: `load`, `refresh`, `reset`)
- Return structure: `{ states (readonly), sources, actions }`

## 6. Implementation Steps

1. **Extract Pure Functions** → side-effect-free utilities (`formatData`, `validateInput`)
2. **Extract State Management** → related states + operations as Composable
3. **Integrate Side Effects** → lifecycle and async operations
4. **Validate** → re-run `analyze`, check node count decreased, articulation points eliminated

### Composable Declaration Order

In `<script setup>`, Composable call order must follow dependency topological sort:

1. Declare **dependency providers** first
2. Then declare **Composables that consume those states**
3. Finally declare **aggregation/coordination layer**

**Check**: If Composable B's parameters include Composable A's return value, A must be declared first.

```ts
// ✅ Correct order
const { user } = useUser();                    // 1. State provider
const { orders } = useOrders(user);            // 2. Consumer
const { checkout } = useCheckout(user, orders); // 3. Aggregation layer
```

## 7. Data Flow Principles

### 7.1 Unidirectional Pipeline
- Use `computed` chains, not cross-watch mutations
- Data flows: `source ref → computed transforms → output`
- No cycles (A→B→A)

### 7.2 Side Effect Naming
- Use verb prefixes: `handle*`, `update*`, `reset*`, `fetch*`
- Avoid ambiguous names: `process`, `change`, `do`

### 7.3 Source vs Derived State
| Type | Examples | Rule |
|------|----------|------|
| Source of Truth | `userType`, `query`, URL params | Only these are manually modified |
| Derived State | `loading`, `filteredList`, `isEmpty` | Always computed, never assigned |

### 7.4 Interface Structure
```ts
return {
  // States (read-only)
  data: readonly(data),
  loading: readonly(loading),
  // Sources (observable)
  query,
  filters,
  // Actions (modification entry)
  search,
  reset,
};
```

### 7.5 Data Flow Self-Check
- [ ] Can data flow be drawn as non-returning arrows?
- [ ] No cycles (A→B→A)?
- [ ] All modifications through explicit methods?
- [ ] No redundant watches doing the same thing?

---

## 8. Patterns & Anti-patterns

### ✅ Recommended
| Pattern | Description |
|---------|-------------|
| Layered Architecture | Data layer → Business logic → Presentation |
| Pipeline | `computed` chain: step1 → step2 → step3 |
| Responsibility Separation | `useDataFetching()`, `useFiltering()`, `useSelection()` |

### 🚫 Avoid
| Anti-pattern | Problem |
|--------------|---------|
| God Object | Single composable with 50+ states/methods |
| Over-abstraction | Generic processors losing type safety |
| Dependency Passing | 5+ Ref parameters → retrieve internally instead |

---

## 9. Final Checklist

### Structure
- [ ] VHO node count < 15
- [ ] No articulation points
- [ ] Isolated node groups < 3
- [ ] Dependency depth < 4 layers

### Design
- [ ] Single responsibility per Composable
- [ ] Minimal exposure interface
- [ ] Correct lifecycle/state ownership

### Data Flow
- [ ] Unidirectional pipeline, no cycles
- [ ] Only source refs modified manually
- [ ] Verb-named side effect methods
- [ ] No cascading watch modifications

### Quality
- [ ] Type checks pass
- [ ] Original functionality preserved
- [ ] Readability improved
