# loop-call

Powered by [`vue-hook-optimizer`](https://github.com/zcf0508/vue-hook-optimizer).

## Rule Details
```vue
// 👎 bad
<script setup>
import { ref } from 'vue';

const a = ref(0);

function add1() {
  a.value++;
}

function add2() {
  add1();
}

function add3() {
  add2();
}
</script>

<template>
  <div @click="add3">
    {{ a }}
  </div>
</template>
```

```vue
// 👍 good
<script setup>
import { ref } from 'vue';

const a = ref(0);

function add3() {
  a.value++;
}
</script>

<template>
  <div @click="add3">
    {{ a }}
  </div>
</template>
```

## Rule Config
```
{
  "linear-path": ['error', {
    framework: 'vue', // vue or react
  }]
}
```
