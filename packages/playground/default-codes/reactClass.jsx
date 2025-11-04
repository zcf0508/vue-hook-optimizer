import React, { Component } from 'react';

export default class TodoList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [
        { id: 1, text: '学习 React', completed: true },
        { id: 2, text: '完成项目', completed: false },
        { id: 3, text: '写文档', completed: false },
      ],
      newTodo: '',
      filter: 'all',
    };
  }

  addTodo = () => {
    if (this.state.newTodo.trim()) {
      this.setState(prevState => ({
        todos: [
          ...prevState.todos,
          {
            id: Date.now(),
            text: this.state.newTodo.trim(),
            completed: false,
          },
        ],
        newTodo: '',
      }));
    }
  };

  toggleTodo = (id) => {
    this.setState(prevState => ({
      todos: prevState.todos.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo,
      ),
    }));
  };

  removeTodo = (id) => {
    this.setState(prevState => ({
      todos: prevState.todos.filter(todo => todo.id !== id),
    }));
  };

  setFilter = (filter) => {
    this.setState({ filter });
  };

  getFilteredTodos = () => {
    const { todos, filter } = this.state;
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  };

  render() {
    const { newTodo, filter } = this.state;
    const filteredTodos = this.getFilteredTodos();
    const completedCount = this.state.todos.filter(todo => todo.completed).length;
    const pendingCount = this.state.todos.filter(todo => !todo.completed).length;

    return (
      <div className="todo-app">
        <h2>React 类组件待办事项</h2>

        <div className="input-section">
          <input
            type="text"
            value={newTodo}
            onChange={e => this.setState({ newTodo: e.target.value })}
            onKeyPress={e => e.key === 'Enter' && this.addTodo()}
            placeholder="输入待办事项..."
            className="todo-input"
          />
          <button onClick={this.addTodo} className="add-btn">
            添加
          </button>
        </div>

        <div className="filter-section">
          {[
            { label: '全部', value: 'all' },
            { label: '待完成', value: 'active' },
            { label: '已完成', value: 'completed' },
          ].map(filterOption => (
            <button
              key={filterOption.value}
              onClick={() => this.setFilter(filterOption.value)}
              className={`filter-btn ${filter === filterOption.value
                ? 'active'
                : ''}`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        <ul className="todo-list">
          {filteredTodos.map(todo => (
            <li
              key={todo.id}
              className={`todo-item ${todo.completed
                ? 'completed'
                : ''}`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => this.toggleTodo(todo.id)}
              />
              <span className="todo-text">{todo.text}</span>
              <button
                onClick={() => this.removeTodo(todo.id)}
                className="delete-btn"
              >
                删除
              </button>
            </li>
          ))}
        </ul>

        <div className="stats">
          <p>
            总计:
            {' '}
            {this.state.todos.length}
            {' '}
            |
            已完成:
            {' '}
            {completedCount}
            {' '}
            |
            待完成:
            {' '}
            {pendingCount}
          </p>
        </div>
      </div>
    );
  }
}
