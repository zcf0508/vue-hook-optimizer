import { ref, computed } from 'vue'

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
