---
name: vho-refactor
description: "Refactor Vue/React components using VHO dependency analysis. Call the vue-hook-optimizer MCP analyze tool to get dependency graphs, communities, and suggestions, then follow the decision framework to refactor. Use when: refactor, optimize hooks, composable, split component, dependency graph, analyze component, Vue/React component too large."
when_to_use: "refactor, optimize hooks, composable, vue component too large, split component, dependency graph, analyze component"
dispatch_intent: "Component refactoring driven by VHO dependency analysis"
---

# VHO Component Refactoring

Use the VHO MCP `analyze` tool to get dependency graphs, then follow the decision framework below.

## Workflow

1. **Call `analyze`** on the target file (`absolutePath`, `framework` = `vue` | `react`)
2. **Review output**: dependency graph, suggestions, variable communities
3. **Decide**: follow the decision framework below
4. **Refactor**: apply changes incrementally
5. **Re-analyze** to verify improvement
6. **Type check**: run project's `typecheck` or `tsc --noEmit` / `vue-tsc --noEmit`

## Decision Framework

Follow in order:

1. If **nodes < 10** AND no cycles AND no articulation points → **STOP**, no refactoring needed
2. If **circular dependencies** exist → break cycles first (Priority: Very High)
3. If **articulation points** exist → extract related logic (Priority: Very High)
4. If **large community (>8 members)** → extract as independent Composable (Priority: High)
5. If **multiple isolated node groups** → extract by functional domain (Priority: High)
6. If **long chain dependencies (>4 layers)** → layered refactoring (Priority: Medium)
7. **Type check** → re-analyze to validate

## Key Concepts

| Term | Meaning | Action |
|------|---------|--------|
| **Articulation Points** | Nodes that split the graph when removed | Core refactoring targets |
| **Variable Communities** | Tightly coupled variables (Label Propagation) | Extract together as Composable |
| **Isolated Node Groups** | Interconnected nodes separated from main logic | Extraction candidates |
| **Dependency Depth** | Chain length; >4 layers | Mixed responsibilities |

## Extraction Criteria

**Extract as Composable** if ANY of these:
- 3+ related reactive states
- Complete lifecycle management (mount/unmount)
- Complex side effect handling
- Reused or potentially reusable

**Merge Composables** if ANY of these:
- Shared state ratio >50%
- Always used together, never called separately
- Split requires passing ≥3 parameters between them

## State Ownership

| State Type | Where It Belongs | Examples |
|------------|------------------|----------|
| Internal lifecycle states | Inside Composable | `loading`, `error`, `page`, `cache` |
| User input / config | Pass as parameters | `userInput`, `options`, `externalData` |
| Global context | Retrieve internally | `useRoute()`, `useStore()` |

## Lifecycle Ownership

| Lifecycle | → Composable | → Component |
|-----------|--------------|-------------|
| `onMounted` | Data fetching, polling | DOM ops, chart init |
| `onUnmounted` | Timer/request cleanup | Event unbinding |
| `watch` | Business state changes | UI state changes |
| `computed` | Business calculations | Style calculations |

## Implementation Steps

1. **Extract Pure Functions** → side-effect-free utilities
2. **Extract State Management** → related states + operations as Composable
3. **Integrate Side Effects** → lifecycle and async operations
4. **Validate** → re-run `analyze`, check node count decreased, articulation points eliminated

## Naming

- By entity: `useUser`, `useOrder`, `useProduct`
- By function: `useDataFetching`, `useFormValidation`
- By process: `useCheckout`, `useAuthentication`

## Rules

- **Never break functionality** — all original features must remain intact
- **Avoid over-extraction** — communities with <3 members usually stay inline
- **Don't refactor for refactoring's sake** — <10 nodes with no issues → skip
- **Preserve readability** — clarity over brevity
- **Respect existing patterns** — follow project's established conventions
