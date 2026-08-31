---
name: vho-refactor
description: |
  Refactor Vue/React components using VHO dependency analysis and create adaptable composables/hooks. Call the vue-hook-optimizer MCP `analyze` tool to get dependency graphs, variable communities, and optimization suggestions, then follow the decision framework to refactor. Use when: refactor, optimize hooks, composable, split component, dependency graph, analyze component, Vue/React component too large, create adaptable composable.
license: MIT
metadata:
  author: zcf0508
  version: 0.0.86
  repository: github.com/zcf0508/vue-hook-optimizer
compatibility: Requires a Vue 2/3 or React project, and the vue-hook-optimizer MCP server connected
---

# Goal

Use VHO MCP `analyze` to reveal coupling, then refactor components into well-structured composables/hooks with adaptable inputs.

# Instructions

1. **Analyze** — call `analyze` with `absolutePath` and `framework` (`vue` | `react`). Review mermaid graph, suggestions, and variable communities.
2. **Decide** — follow the decision framework below.
3. **Extract** — apply extraction criteria and adaptable API design.
4. **Refactor incrementally** — pure functions → state management → side effects → validate.
5. **Verify** — type-check (`vue-tsc --noEmit` / `tsc --noEmit`) and re-analyze to confirm improvement.

# Decision Framework

Follow in order:

1. **Nodes < 10** AND no cycles AND no articulation points → **STOP**
2. **Circular dependencies** → break cycles first (Very High)
3. **Articulation points** → extract related logic (Very High)
4. **Large community (>8)** → extract as Composable/Hook (High)
5. **Multiple isolated groups** → extract by domain (High)
6. **Long chains (>4 layers)** → layered refactoring (Medium)
7. **Type check** → re-analyze

# Extraction Criteria

**Extract as Composable/Hook** if ANY: 3+ reactive states, lifecycle management, complex side effects, or reusable.

**Merge** if ANY: shared state >50%, always used together, or split needs ≥3 params.

**Keep inline** if <3 members and no articulation points.

# Adaptable API Design

## Vue composables

Use `MaybeRef` / `MaybeRefOrGetter` so callers can pass plain values, refs, getters, or computed refs.

| Use case | Type | Resolve with |
|----------|------|--------------|
| Read-only | `MaybeRefOrGetter<T>` | `toRef()` in watchers, `toValue()` for snapshots |
| Writable | `MaybeRef<T>` | `toRef()` |
| DOM target | `MaybeRefOrGetter<T>` | `toRef()` or `toValue()` |
| Callback | Plain function | **Do not** use `MaybeRefOrGetter` |

```ts
export type MaybeRef<T = any> = T | Ref<T> | ShallowRef<T> | WritableComputedRef<T>;
export type MaybeRefOrGetter<T = any> = MaybeRef<T> | ComputedRef<T> | (() => T);
```

**Rules**: normalize inside reactive effects, not at call time.

## React hooks

Use `RefObject` / `MutableRefObject` / getters. Do **not** force Vue concepts.

| Use case | Type | How to handle |
|----------|------|---------------|
| Read-only | `T \| RefObject<T> \| (() => T)` | `useLatest` + read current value inside effect |
| Writable | `MutableRefObject<T>` | Mutate `.current` directly |
| DOM target | `RefObject<Element> \| Element \| null` | Normalize to `Element \| null` |
| Callback | Plain function | `useLatest` if used inside `useEffect` |

```ts
type MaybeRef<T> = T | React.RefObject<T> | (() => T);
type MutableRef<T> = React.MutableRefObject<T>;

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; });
  return ref;
}

function resolveValue<T>(input: MaybeRef<T>): T {
  if (typeof input === 'function') { return (input as () => T)(); }
  if (input && typeof input === 'object' && 'current' in input) { return input.current; }
  return input;
}
```

**Rules**: avoid stale closures with `useLatest`; keep getters out of dependency arrays unless stable.

# Examples

## Vue: read-only adaptable composable

```ts
import type { MaybeRefOrGetter } from 'vue';
import { toRef, watch } from 'vue';

export function useDocumentTitle(title: MaybeRefOrGetter<string>) {
  watch(toRef(title), (t) => { document.title = t; }, { immediate: true });
}
```

## Vue: writable adaptable composable

```ts
import type { MaybeRef } from 'vue';
import { toRef } from 'vue';

export function useCounter(count: MaybeRef<number>) {
  const countRef = toRef(count);
  function add() { countRef.value++; }
  return { count: countRef, add };
}
```

## Vue: extract data fetching

**Before** (inline): `userId`, `user`, `loading`, `error`, `fetchUser`, `onMounted`, `watch` all in component.

**After** (`composables/useUser.ts`):

```ts
export function useUser(userId: MaybeRefOrGetter<string>) {
  const userIdRef = toRef(userId);
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function fetchUser(id: string) { /* ... */ }

  onMounted(() => fetchUser(userIdRef.value));
  watch(userIdRef, fetchUser);

  return { user, loading, error, refresh: () => fetchUser(userIdRef.value) };
}
```

## React: read-only adaptable hook

```ts
export function useDocumentTitle(title: MaybeRef<string>) {
  const titleRef = useLatest(title);
  useEffect(() => { document.title = resolveValue(titleRef.current); }, [title]);
}
```

## React: writable adaptable hook

```ts
export function useCounter(count: number | MutableRef<number>) {
  const isRef = count && typeof count === 'object' && 'current' in count;
  const internalRef = useRef(typeof count === 'number'
    ? count
    : count.current);
  const countRef = (isRef
    ? count
    : internalRef) as MutableRef<number>;

  useEffect(() => {
    if (typeof count === 'number') { countRef.current = count; }
  }, [count]);

  const add = useCallback(() => { countRef.current += 1; }, [countRef]);
  return { count: countRef, add };
}
```

## React: break circular dependency

**Before**: `items → total → discount → items` cycle via two `useEffect`s.

**After** (`hooks/useOrderPricing.ts`):

```ts
export function useOrderPricing(items: Item[]) {
  const [baseDiscount, setBaseDiscount] = useState(0);
  const total = useMemo(() => calculateTotal(items, baseDiscount), [items, baseDiscount]);
  const discount = useMemo(() => calculateDiscount(total), [total]);
  return { total, discount, setBaseDiscount };
}
```

# Naming

- By entity: `useUser`, `useOrder`
- By function: `useDataFetching`, `useFormValidation`
- By process: `useCheckout`, `useAuthentication`

# Constraints

- Never break functionality
- Avoid over-extraction (<3 members usually stay inline)
- Don't refactor for refactoring's sake (<10 nodes with no issues → skip)
- Preserve readability; respect existing patterns
- Always type-check and re-analyze after changes
- Vue: never wrap callbacks in `MaybeRefOrGetter`
- React: avoid stale closures; keep hooks idiomatic (no forced Vue concepts)
