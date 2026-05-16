import { ref, watch, computed } from 'vue'

export function useSearch(fetchFn: (query: string) => Promise<any[]>) {
  const query = ref('')
  const results = ref<any[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  const debouncedQuery = ref('')
  let timer: ReturnType<typeof setTimeout> | null = null
  
  watch(query, (newQuery) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      debouncedQuery.value = newQuery
    }, 300)
  })
  
  watch(debouncedQuery, async (newQuery) => {
    if (!newQuery) {
      results.value = []
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      results.value = await fetchFn(newQuery)
    }
    catch (e) {
      error.value = e as Error
      results.value = []
    }
    finally {
      loading.value = false
    }
  })
  
  const hasResults = computed(() => results.value.length > 0)
  
  function setQuery(value: string) {
    query.value = value
  }
  
  function clearResults() {
    results.value = []
    query.value = ''
    debouncedQuery.value = ''
  }
  
  return {
    query,
    results,
    loading,
    error,
    hasResults,
    setQuery,
    clearResults,
  }
}
