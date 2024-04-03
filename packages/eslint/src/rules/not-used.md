# not-used

Powered by [`vue-hook-optimizer`](https://github.com/zcf0508/vue-hook-optimizer).

## Rule Details
```vue
// 👎 bad
<script setup>
import { ref } from 'vue';
const a = ref(0);
const b = ref(0); // not used in template
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
const b = ref(0);
</script>

<template>
  <div>{{ a }}/ {{ b }}</div>
</template>
```

## Rule Config
```
{
  "not-used": ['warn', {
    framework: 'vue', // vue or react
  }]
}
```
