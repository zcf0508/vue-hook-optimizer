import { ref, computed } from 'vue'

export function useTimeAgo(date: Date) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval>

  const seconds = computed(() => Math.floor((now.value - date.getTime()) / 1000))
  const text = computed(() => {
    if (seconds.value < 60) return 'just now'
    if (seconds.value < 3600) return `${Math.floor(seconds.value / 60)}m ago`
    if (seconds.value < 86400) return `${Math.floor(seconds.value / 3600)}h ago`
    return `${Math.floor(seconds.value / 86400)}d ago`
  })

  function start() {
    timer = setInterval(() => { now.value = Date.now() }, 1000)
  }

  function stop() {
    clearInterval(timer)
  }

  return {
    seconds,
    text,
    start,
    stop,
  }
}

export function useVisibility() {
  const visible = ref(true)

  function show() { visible.value = true }
  function hide() { visible.value = false }
  function toggle() { visible.value = !visible.value }

  function setVisible(value: boolean) {
    visible.value = value
  }

  return {
    value: visible,
    show,
    hide,
    toggle,
    setVisible,
  }
}
