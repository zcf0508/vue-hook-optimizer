import { ref, computed } from 'vue'

const loadCount = ref(0)

const useApiLoader = (() => {
  let cache = new Map<string, any>()

  return function <T>(url: string) {
    const data = ref<T | null>(cache.get(url) ?? null)
    const loading = ref(false)

    async function fetch() {
      loading.value = true
      loadCount.value++
      const res = await fetch(url)
      data.value = res as T
      cache.set(url, res)
      loading.value = false
    }

    function clearCache() {
      cache = new Map()
      data.value = null
    }

    return { data, loading, fetch, clearCache }
  }
})()

function useInternalCounter() {
  const count = ref(0)

  function increment() {
    count.value++
  }

  return { count, increment }
}

export function useSharedCounter() {
  const { count, increment } = useInternalCounter()
  const doubled = computed(() => count.value * 2)
  return { count, doubled, increment }
}
