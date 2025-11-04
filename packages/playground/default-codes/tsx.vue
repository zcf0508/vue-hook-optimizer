<script lang="tsx">
import { computed, defineComponent, ref } from 'vue';

interface TodoItem {
  id: number
  text: string
  completed: boolean
}

export default defineComponent({
  name: 'TodoList',
  setup() {
    const todos = ref<TodoItem[]>([
      { id: 1, text: '学习 Vue TSX', completed: false },
      { id: 2, text: '创建组件', completed: true },
      { id: 3, text: '编写测试', completed: false },
    ]);

    const newTodoText = ref('');
    const filterType = ref<'all' | 'active' | 'completed'>('all');

    const filteredTodos = computed(() => {
      switch (filterType.value) {
        case 'active':
          return todos.value.filter(todo => !todo.completed);
        case 'completed':
          return todos.value.filter(todo => todo.completed);
        default:
          return todos.value;
      }
    });

    const addTodo = () => {
      if (newTodoText.value.trim()) {
        todos.value.push({
          id: Date.now(),
          text: newTodoText.value.trim(),
          completed: false,
        });
        newTodoText.value = '';
      }
    };

    const toggleTodo = (id: number) => {
      const todo = todos.value.find(t => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    };

    const removeTodo = (id: number) => {
      const index = todos.value.findIndex(t => t.id === id);
      if (index > -1) {
        todos.value.splice(index, 1);
      }
    };

    return () => (
      <div class="tsx-todo-app">
        <h2>Vue TSX 待办事项</h2>

        <div class="input-group">
          <input
            type="text"
            value={newTodoText.value}
            onInput={(e: any) => newTodoText.value = e.target.value}
            onKeyup={(e: any) => e.key === 'Enter' && addTodo()}
            placeholder="输入待办事项..."
            class="todo-input"
          />
          <button onClick={addTodo} class="add-button">
            添加
          </button>
        </div>

        <div class="filter-group">
          {['all', 'active', 'completed'].map(filter => (
            <button
              key={filter}
              onClick={() => filterType.value = filter as any}
              class={`filter-button ${filterType.value === filter
                ? 'active'
                : ''}`}
            >
              {filter === 'all'
                ? '全部'
                : filter === 'active'
                  ? '待完成'
                  : '已完成'}
            </button>
          ))}
        </div>

        <ul class="todo-list">
          {filteredTodos.value.map(todo => (
            <li
              key={todo.id}
              class={`todo-item ${todo.completed
                ? 'completed'
                : ''}`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span class="todo-text">{todo.text}</span>
              <button
                onClick={() => removeTodo(todo.id)}
                class="delete-button"
              >
                删除
              </button>
            </li>
          ))}
        </ul>

        <div class="stats">
          <p>
            总计:
            {' '}
            {todos.value.length}
            {' '}
            |
            已完成:
            {' '}
            {todos.value.filter(t => t.completed).length}
            {' '}
            |
            待完成:
            {' '}
            {todos.value.filter(t => !t.completed).length}
          </p>
        </div>
      </div>
    );
  },
});
</script>

<style scoped>
.tsx-todo-app {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.input-group {
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

.add-button {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-button {
  margin-right: 10px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.filter-button.active {
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

.todo-text {
  flex: 1;
  margin-left: 10px;
}

.delete-button {
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
