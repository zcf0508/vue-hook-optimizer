import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const name = ref('counter')

  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = 0
  }

  return { count, name, doubleCount, increment, decrement, reset }
})

export const useUserStore = defineStore('user', () => {
  const user = ref<{ name: string; age: number } | null>(null)
  const token = ref('')

  const isLoggedIn = computed(() => !!token.value)

  async function login(username: string, password: string) {
    token.value = `${username}-${password}`
    user.value = { name: username, age: 18 }
  }

  function logout() {
    token.value = ''
    user.value = null
  }

  return { user, token, isLoggedIn, login, logout }
})
