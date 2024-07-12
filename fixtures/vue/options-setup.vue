<template>
  <h1 ref="msgRef">{{ msg }}</h1>

  <p>
    Recommended IDE setup:
    <a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
    +
    <a href="https://marketplace.visualstudio.com/items?itemName=octref.vetur" target="_blank"> Vetur </a>
    or
    <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
    (if using
    <code>&lt;script setup&gt;</code>)
  </p>

  <p>See <code>README.md</code> for more information.</p>

  <p>
    <a href="https://vitejs.dev/guide/features.html" target="_blank"> Vite Docs </a>
    |
    <a href="https://v3.vuejs.org/" target="_blank">Vue 3 Docs</a>
  </p>

  <button type="button" @click="plus">
    count is: {{ count }}
  </button>
  <p class="my-2">
    <label for="number_input">
      <input 
        id="number_input" 
        v-model="number"
        w:p="l-2"
        w:border="~ gray-100"
        w:appearance="none" 
        w:outline="focus:none" 
        type="number"
      >
    </label>
    <button
      w:m="l-2"
      w:p="x-2"
      w:bg="green-500"
      w:text="white"
      w:rounded="~"
      @click="add"
    >
      ADD
    </button>
  </p>
  <p>
    Edit
    <code>components/HelloWorld.vue</code> to test hot module replacement.
  </p>
  <ComponentD></ComponentD>
</template>

<script lang="tsx">
export default {
  name: 'TestComponent',
  props: {
    msg: {
      type: String,
      required: true,
    },
  },
  setup() {
    const data = reactive({
      ...{
        a: 1
      },
      a: 2,
      /** 这是注释 */number: 0,
    });
    const count = computed(() => counterStore.count);

    const dataNumber = computed(() => data.number);
    
    const number = count.value

    const methods = {
      ...{
        a: 1
      },
      a: 2,
      plus: ()=> {
        counterStore.increment();
        methods.plus();
      },
    };

    function add() {
      counterStore.add(Number(data.number));
      methods.plus();
      console.log(count)
      return count;
    }


    const a = {count};
    const b = {count: count.value};

    const [userinfo, setUserinfo] = useUserinfo(a, b.count, data.number)

    const { userinfo2 } = useUserinfo2(a, b.count, data.number)
    const ComponentD = () => (<>hello d</>);

    const msgRef = ref();

    return {
      ...toRefs(data),
      number,
      b,
      c: count,
      dataNumber,
      ...methods,
      ComponentD,
      msgRef,
      add,
      userinfo,
      userinfo2,
    }
    
  }
}
</script>

<style scoped>
a {
  color: v-bind(count);
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}
</style>
