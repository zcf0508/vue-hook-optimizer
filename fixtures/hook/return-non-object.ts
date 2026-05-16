import { ref } from 'vue'

export const useNow = () => {
  const now = ref(Date.now())
  let timer = setInterval(() => { now.value = Date.now() }, 1000)

  function stop() {
    clearInterval(timer)
  }

  return now
}
