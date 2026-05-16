import { ref, computed, watch } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const doubled = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  function decrement() {
    count.value--
  }
  
  function reset() {
    count.value = initialValue
  }
  
  return { count, doubled, increment, decrement, reset }
}

export function useToggle(initialValue = false) {
  const value = ref(initialValue)
  
  function toggle() {
    value.value = !value.value
  }
  
  function setTrue() {
    value.value = true
  }
  
  function setFalse() {
    value.value = false
  }
  
  return { value, toggle, setTrue, setFalse }
}
