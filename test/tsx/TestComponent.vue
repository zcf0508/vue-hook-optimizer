<script lang="tsx">
import { defineComponent, h } from 'vue';
export default {
  name: 'TestComponent',
  props: {
    msg: {
      type: String,
      required: true,
    },
  },
  setup() {
    const open = computed({
      get: () => props.modelValue,
      set: (val) => {
        emit('update:modelValue', val)
      }
    })
    const dds = function() {}
    const dds2 = () => {}
    const dds3 = [dds2]
    const delayTime = 500, d2 = 800
    const route = useRoute()
    const infoOpen = ref(false)
    const writeBaseInfo = () => {
      aa = 1
      infoOpen.value = 2
      writeBaseInfo()
    }
    function processInfo () {
      aa = 1;
      processInfo();
      if (xq > 2) {}
      infoOpen.value = 2
    }
    const { a, b } = getUserInfo(arr)
    const { aa, ...rest } = getUserInfo2(brr, line, un)
    var {xq = 3} = {};
    let { loc, loc: locd, loc: { start, end }, loc: { start: { line }} } = node;
    const [arr, brr] = array
    let [foo, [bar, baz]] = () => { xq = 5; writeBaseInfo(); };
    let [ , , third] = ["foo", "bar", "baz"];
    let [xx, yy = 'b'] = ['a'];
    const [arr2, ...rest2] = useHook(foo, bar, baz);
    const c = useHook(loc, start)
    function xyz () {xyz()}

    onBeforeMount(() => {
      queryData(route.query.id)
    })
    
    onMounted(() => {
      refresh()
    })
    
    onCreated(() => {
      haha()
    })

    return () => (
      <a-modal 
        v-model={[open.value, 'open']} 
        title='基本信息' 
        onClick={writeBaseInfo} 
        onFocus={() => processInfo()} 
        onOk={(a) => (open.value = false, a)}
      >
        <p>hello</p>
        <p>{xx}</p>	
      </a-modal>
    )
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