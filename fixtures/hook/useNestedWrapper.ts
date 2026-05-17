import { ref } from 'vue'

function hoc(fn: any) {
  return fn
}

function wrapper(fn: () => any) {
  return fn
}

export const useNestedWrapper = hoc(wrapper(() => {
  const count = ref(0)
  return { count }
}))
