import { ref, watch } from 'vue'

export const useToggle = (initialValue = false) => {
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

export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const stored = localStorage.getItem(key)
  const data = ref<T>(stored ? JSON.parse(stored) : defaultValue)
  
  watch(data, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })
  
  function remove() {
    localStorage.removeItem(key)
    data.value = defaultValue
  }
  
  return { data, remove }
}
