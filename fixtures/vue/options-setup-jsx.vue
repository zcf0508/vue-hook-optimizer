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
      /** 这是注释 */number: 0,
    });
    const count = computed(() => counterStore.count);

    const methods = {
      plus: ()=> {
        counterStore.increment();
        methods.plus();
      },
      add() {
        counterStore.add(Number(data.number));
        methods.add();
        console.log(count)
      }
    };

    const a = {count};
    const b = {count: count.value};
    const ComponentD = () => (<>hello d</>);

    const msgRef = ref();

    return () => (<div>
        <div>{count}</div>
        <button onClick={methods.plus}></button>
        <ComponentD></ComponentD>
      </div>)
    
  }
}
</script>

<style scoped>
a {
  color: #42b983;
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
