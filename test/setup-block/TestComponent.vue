<script setup lang="ts">
const props = defineProps({
  msg: String
})

const emits = defineEmits(['update:msg'])
/** route */
const route = useRoute();
/** path */
const path = computed(() => route.path?.age)

const lmsg = ref(props.msg)

watch(lmsg, (val) => {
  console.log(path.value)
  emits('update:msg', val)
})

/** 这是注释11 */
const data = reactive({
  name: ''
})

const age = ref(18)

const [...restArr] = arrList
const { ...restObj } = objList

function addAge() {
  age.value++
}

const updateName = (e: Event) => {
  data.name = e.target.value
}

function funA() {
  const varB = ''
  return {
    varB
  }
}

const { varB } = funA()
/** 这是注释 */
function funC(varB) { // 这是注释
  const varD = 1
  const varE = 2
  funC()
  return [varD, varE]
}

const [ varD, varE ] = funC(varB)

onMounted(() => {
	funC()
})

const props1 = withDefaults(defineProps<{test: number}>(), {
  test: 1,
})

</script>

<template>
  <div>
    <input v-model="lmsg" />
    <div>{{ `path: ${path}` }}</div>
    {{ age }}
    <input :value="data['name' as string]" @input="updateName" />
    <button @click="addAge"></button>
  </div>
</template>

<style scoped>

</style>
