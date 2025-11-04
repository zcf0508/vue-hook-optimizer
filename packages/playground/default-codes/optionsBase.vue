<script>
export default {
  name: 'CounterComponent',
  data() {
    return {
      title: 'Vue 选项式 API 计数器',
      count: 0,
    };
  },
  computed: {
    isEven() {
      return this.count % 2 === 0;
    },
    countStatus() {
      return this.count > 10
        ? '很大'
        : this.count < 0
          ? '负数'
          : '正常';
    },
  },
  watch: {
    count(newVal, oldVal) {
      console.log(`计数从 ${oldVal} 变为 ${newVal}`);
    },
  },
  methods: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
    reset() {
      this.count = 0;
    },
  },
};
</script>

<template>
  <div class="counter">
    <h2>{{ title }}</h2>
    <p class="count">
      计数: {{ count }}
    </p>
    <div class="controls">
      <button class="btn btn-primary" @click="increment">
        增加
      </button>
      <button class="btn btn-secondary" @click="decrement">
        减少
      </button>
      <button class="btn btn-danger" @click="reset">
        重置
      </button>
    </div>
    <p class="info">
      双击计数可以快速编辑
    </p>
  </div>
</template>

<style scoped>
.counter {
  text-align: center;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.count {
  font-size: 24px;
  font-weight: bold;
  margin: 20px 0;
}

.controls {
  margin: 20px 0;
}

.btn {
  padding: 8px 16px;
  margin: 0 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #42b983;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.info {
  color: #666;
  font-style: italic;
}
</style>
