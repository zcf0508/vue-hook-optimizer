# loop-call

Powered by [`vue-hook-optimizer`](https://github.com/zcf0508/vue-hook-optimizer).

## Rule Details
```vue
// 👎 bad
<script setup>
import { ref } from 'vue';

const a = ref(0);

function add(){
  a.value++
}

watch(a, () => add())

</script>

<template>
  <div>{{ a }}</div>
</template>
```

```vue
// 👍 good
<script setup>
import { ref } from 'vue';

const a = ref(0);

function add(){
  a.value++
}

</script>

<template>
  <div>{{ a }}</div>
</template>
```

## Rule Config
```
{
  "loop-call": ['error', {
    framework: 'vue', // vue or react
  }]
}
```
