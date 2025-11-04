<script setup>
import { computed, onMounted, ref } from 'vue';

// 响应式数据
const title = ref('Vue 3 Composition API 待办事项');
const newTodo = ref('');
const todos = ref([]);
const currentFilter = ref('all');

// 过滤器选项
const filters = [
  { label: '全部', value: 'all' },
  { label: '待完成', value: 'pending' },
  { label: '已完成', value: 'completed' },
];

// 计算属性
const filteredTodos = computed(() => {
  switch (currentFilter.value) {
    case 'pending':
      return todos.value.filter(todo => !todo.completed);
    case 'completed':
      return todos.value.filter(todo => todo.completed);
    default:
      return todos.value;
  }
});

const completedCount = computed(() =>
  todos.value.filter(todo => todo.completed).length,
);

const pendingCount = computed(() =>
  todos.value.filter(todo => !todo.completed).length,
);

// 方法
function addTodo() {
  if (newTodo.value.trim()) {
    todos.value.push({
      id: Date.now(),
      text: newTodo.value.trim(),
      completed: false,
    });
    newTodo.value = '';
  }
}

function removeTodo(id) {
  const index = todos.value.findIndex(todo => todo.id === id);
  if (index > -1) {
    todos.value.splice(index, 1);
  }
}

// 生命周期
onMounted(() => {
  // 初始化一些示例数据
  todos.value = [
    { id: 1, text: '学习 Vue 3', completed: true },
    { id: 2, text: '完成项目', completed: false },
    { id: 3, text: '写文档', completed: false },
  ];
});
</script>

<template>
  <div class="todo-app">
    <h2>{{ title }}</h2>

    <div class="input-section">
      <input
        v-model="newTodo"
        placeholder="输入待办事项..."
        class="todo-input"
        @keyup.enter="addTodo"
      >
      <button class="add-btn" @click="addTodo">
        添加
      </button>
    </div>

    <div class="filter-section">
      <button
        v-for="filter in filters"
        :key="filter.value"
        class="filter-btn" :class="[{ active: currentFilter === filter.value }]"
        @click="currentFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <ul class="todo-list">
      <li
        v-for="todo in filteredTodos"
        :key="todo.id"
        :class="{ completed: todo.completed }"
        class="todo-item"
      >
        <input
          v-model="todo.completed"
          type="checkbox"
          class="todo-checkbox"
        >
        <span class="todo-text">{{ todo.text }}</span>
        <button class="delete-btn" @click="removeTodo(todo.id)">
          删除
        </button>
      </li>
    </ul>

    <div class="stats">
      <p>
        总计: {{ todos.length }} |
        已完成: {{ completedCount }} |
        待完成: {{ pendingCount }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.todo-app {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.input-section {
  display: flex;
  margin-bottom: 20px;
}

.todo-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
}

.add-btn {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-btn {
  margin-right: 10px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.filter-btn.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

.todo-checkbox {
  margin-right: 10px;
}

.todo-text {
  flex: 1;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.stats {
  margin-top: 20px;
  text-align: center;
  color: #666;
}
</style>
