import { ref, watch, computed } from 'vue'

export function useParamVariants(
  { a, b }: { a: number, b: number },
  initial: number = 0,
  ...[extra]: [string]
) {
  const { x, ...rest } = { x: ref(0), y: ref(1) }
  const sum = computed(() => a + b)
  const methodResult = ref(0)

  watch(a, (newVal) => {
    console.log(newVal)
  })

  watch(() => a + b, (newVal) => {
    console.log(newVal)
  })

  methodResult.value = sum.value

  const obj = {
    sum,
    log() {
      return sum.value
    },
  }

  return { sum, x, ...rest, obj }
}
