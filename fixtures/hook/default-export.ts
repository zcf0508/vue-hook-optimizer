import { ref, computed } from 'vue'

export default function useTheme() {
  const isDark = ref(false)
  const themeClass = computed(() => isDark.value ? 'dark' : 'light')

  function toggle() {
    isDark.value = !isDark.value
  }

  function setDark(value: boolean) {
    isDark.value = value
  }

  return { isDark, themeClass, toggle, setDark }
}
