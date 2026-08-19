<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
}

watch(count, (val) => {
  console.log(`count changed to ${val}`)
})
</script>

<template>
  <div>
    <span>{{ count }}</span>
    <span>{{ doubled }}</span>
    <button @click="increment">+1</button>
  </div>
</template>