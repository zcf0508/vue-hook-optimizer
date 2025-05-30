<script setup lang="ts">
import { add } from 'lodash-es';

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

const varB2 = varB

const ddd = {
  getDdd: () => varB.value
}

/** 这是注释 */
function funC(varB) { // 这是注释
  const _varD = 1
  const _varE = 2
  funC()
  return [_varD, _varE]
}

const [ varD, varE ] = funC(varB)

onMounted(() => {
	funC?.()
})

const props1 = withDefaults(defineProps<{test: number}>(), {
  test: 1,
})

provide('funC', funC)

const [userinfo, setUserinfo] = useUserinfo(a, b.count)


const aaa1 = ref(0)

const bbb2 = computed(() => aaa1.value + 2)

const cc333 = computed(() => bbb2.value + 2)

const updateBBB = () => {
  if(cc333.value< 20) {
    aaa1.value = aaa1.value + ddd.getDdd()
  }
}

const ddd4 = ref(1)
const eee5 = computed(() => ddd4.value * 2)

const add1111 = ref(1111)

function add2222(){
  add1111.value = add1111 ++ 
}

const add333 =() => {
  add2222()
} 

const {
  fun1a,
  fun1b,
  fun1c,
} = useFun1()

const stop1 = watchEffect(() => {
  console.log(fun1a)
})

let stop2
stop2 = watch(fun1b, (val) => {
  console.log(val)
  stop2?.()
})

fun1c()

const func2a = () => {
  return '2a'
}

onMounted(func2a)

watch(() => [], func2a)

</script>

<template>
  <div>
    <input v-model="lmsg" />
    <div>{{ `path: ${path}` }}</div>
    {{ age }}
    {{ userinfo }}
    <input :value="data['name' as string]" @input="updateName" />
    <button @click="addAge"></button>
    {{ add1111 }}
    <button @click="add2222"></button>
    <button @click="add333"></button>
  </div>
</template>

<style scoped>

</style>
