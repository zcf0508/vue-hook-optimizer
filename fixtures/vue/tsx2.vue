<template>
  <a-modal
    v-model="open"
    title="基本信息"
    @click="open"
    @focus="() => focus()"
  >
    <p>hello {{ aa }}</p>
  </a-modal>
</template>
<script lang="tsx">
export default defineComponent({
  name: 'BaseInfoModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const focus = () => {
      aa,
      obj.x;
    };
    const open = () => {};
    const obj = {
      x: 1,
      y: { a: 1 },
    };
    const aa = 1;
    return {
      focus,
      AA: aa,
      ...obj,
      open,
    };
  },
});
</script>
  
<style scoped lang="less"></style>
  