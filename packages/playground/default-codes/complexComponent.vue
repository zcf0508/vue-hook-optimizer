<script setup>
import { computed, onMounted, ref, watch } from 'vue';

// 用户管理逻辑
const users = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin', status: 'active', avatar: 'https://picsum.photos/seed/user1/32/32.jpg', lastActive: new Date() },
  { id: 2, name: '李四', email: 'lisi@example.com', role: 'user', status: 'inactive', avatar: 'https://picsum.photos/seed/user2/32/32.jpg', lastActive: new Date(Date.now() - 86400000) },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: 'moderator', status: 'pending', avatar: 'https://picsum.photos/seed/user3/32/32.jpg', lastActive: new Date(Date.now() - 172800000) },
]);

const loading = ref(false);
const error = ref('');
const searchQuery = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortByKey = ref('name');
const sortOrder = ref('asc');

// 模态框状态
const showAddModal = ref(false);
const editingUser = ref(null);

// 表单数据
const userForm = ref({
  name: '',
  email: '',
  role: 'user',
  status: 'active',
});

// 计算属性
const totalPages = computed(() => Math.ceil(users.value.length / itemsPerPage.value));
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return users.value.slice(start, end);
});

const sortedUsers = computed(() => {
  const items = paginatedItems.value;
  return [...items].sort((a, b) => {
    const aValue = a[sortByKey.value];
    const bValue = b[sortByKey.value];

    if (aValue < bValue) {
      return sortOrder.value === 'asc'
        ? -1
        : 1;
    }
    if (aValue > bValue) {
      return sortOrder.value === 'asc'
        ? 1
        : -1;
    }
    return 0;
  });
});

// 方法
function getRoleLabel(role) {
  const labels = {
    admin: '管理员',
    moderator: '版主',
    user: '用户',
  };
  return labels[role] || role;
}

function getStatusLabel(status) {
  const labels = {
    active: '活跃',
    inactive: '非活跃',
    pending: '待审核',
  };
  return labels[status] || status;
}

function getSortIcon(key) {
  if (sortByKey.value !== key) { return '↕️'; }
  return sortOrder.value === 'asc'
    ? '↑'
    : '↓';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function refreshUsers() {
  loading.value = true;
  error.value = '';
  // 模拟API调用
  setTimeout(() => {
    loading.value = false;
  }, 1000);
}

function editUser(user) {
  editingUser.value = user;
  userForm.value = { ...user };
}

function closeModal() {
  showAddModal.value = false;
  editingUser.value = null;
  userForm.value = {
    name: '',
    email: '',
    role: 'user',
    status: 'active',
  };
}

async function saveUser() {
  try {
    if (editingUser.value) {
      const index = users.value.findIndex(u => u.id === editingUser.value.id);
      if (index > -1) {
        users.value[index] = { ...users.value[index], ...userForm.value };
      }
    }
    else {
      users.value.push({
        id: Date.now(),
        ...userForm.value,
        avatar: `https://picsum.photos/seed/user${Date.now()}/32/32.jpg`,
        lastActive: new Date(),
      });
    }
    closeModal();
  }
  catch (error) {
    console.error('保存用户失败:', error);
  }
}

function deleteUser(id) {
  const index = users.value.findIndex(u => u.id === id);
  if (index > -1) {
    users.value.splice(index, 1);
  }
}

function exportUsers() {
  const csvContent = [
    ['姓名', '邮箱', '角色', '状态', '最后活跃'].join(','),
    ...sortedUsers.value.map(user => [
      user.name,
      user.email,
      getRoleLabel(user.role),
      getStatusLabel(user.status),
      formatDate(user.lastActive),
    ].join(',')),
  ].join('\\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'users.csv';
  link.click();
}

function sortBy(key) {
  if (sortByKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc'
      ? 'desc'
      : 'asc';
  }
  else {
    sortByKey.value = key;
    sortOrder.value = 'asc';
  }
}

function debouncedSearch() {
  currentPage.value = 1;
  refreshUsers();
}

// 生命周期
onMounted(() => {
  refreshUsers();
});

// 监听搜索和过滤变化
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
  refreshUsers();
});
</script>

<template>
  <div class="user-manager">
    <h2>用户管理系统</h2>

    <div class="search-section">
      <input
        v-model="searchQuery"
        placeholder="搜索用户..."
        class="search-input"
        @input="debouncedSearch"
      >
      <select v-model="statusFilter" class="status-filter">
        <option value="">
          全部状态
        </option>
        <option value="active">
          活跃
        </option>
        <option value="inactive">
          非活跃
        </option>
        <option value="pending">
          待审核
        </option>
      </select>
    </div>

    <div class="action-section">
      <button class="btn btn-primary" @click="showAddModal = true">
        添加用户
      </button>
      <button :disabled="loading" class="btn btn-secondary" @click="refreshUsers">
        {{ loading ? '加载中...' : '刷新' }}
      </button>
      <button class="btn btn-success" @click="exportUsers">
        导出数据
      </button>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="refreshUsers">
        重试
      </button>
    </div>

    <div v-else class="user-table">
      <table>
        <thead>
          <tr>
            <th class="sortable" @click="sortBy('name')">
              姓名 {{ getSortIcon('name') }}
            </th>
            <th class="sortable" @click="sortBy('email')">
              邮箱 {{ getSortIcon('email') }}
            </th>
            <th class="sortable" @click="sortBy('role')">
              角色 {{ getSortIcon('role') }}
            </th>
            <th class="sortable" @click="sortBy('status')">
              状态 {{ getSortIcon('status') }}
            </th>
            <th class="sortable" @click="sortBy('lastActive')">
              最后活跃 {{ getSortIcon('lastActive') }}
            </th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in sortedUsers" :key="user.id">
            <td>
              <div class="user-info">
                <img :src="user.avatar" :alt="user.name" class="avatar">
                {{ user.name }}
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span class="role-badge" :class="[user.role]">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="[user.status]">
                {{ getStatusLabel(user.status) }}
              </span>
            </td>
            <td>{{ formatDate(user.lastActive) }}</td>
            <td class="actions">
              <button class="btn-small btn-edit" @click="editUser(user)">
                编辑
              </button>
              <button class="btn-small btn-delete" @click="deleteUser(user.id)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button
        :disabled="currentPage === 1"
        @click="currentPage = Math.max(1, currentPage - 1)"
      >
        上一页
      </button>
      <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      <button
        :disabled="currentPage === totalPages"
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
      >
        下一页
      </button>
    </div>

    <!-- 添加/编辑用户模态框 -->
    <div v-if="showAddModal || editingUser" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>{{ editingUser ? '编辑用户' : '添加用户' }}</h3>
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label>姓名:</label>
            <input v-model="userForm.name" required>
          </div>
          <div class="form-group">
            <label>邮箱:</label>
            <input v-model="userForm.email" type="email" required>
          </div>
          <div class="form-group">
            <label>角色:</label>
            <select v-model="userForm.role" required>
              <option value="user">
                用户
              </option>
              <option value="admin">
                管理员
              </option>
              <option value="moderator">
                版主
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>状态:</label>
            <select v-model="userForm.status" required>
              <option value="active">
                活跃
              </option>
              <option value="inactive">
                非活跃
              </option>
              <option value="pending">
                待审核
              </option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {{ editingUser ? '更新' : '添加' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="closeModal">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-section {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.search-input, .status-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.action-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #42b983;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  font-size: 16px;
}

.error {
  color: #dc3545;
}

.user-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #f5f5f5;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.role-badge, .status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.role-badge.admin {
  background-color: #dc3545;
  color: white;
}

.role-badge.moderator {
  background-color: #ffc107;
  color: black;
}

.role-badge.user {
  background-color: #6c757d;
  color: white;
}

.status-badge.active {
  background-color: #28a745;
  color: white;
}

.status-badge.inactive {
  background-color: #6c757d;
  color: white;
}

.status-badge.pending {
  background-color: #ffc107;
  color: black;
}

.actions {
  display: flex;
  gap: 5px;
}

.btn-small {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-edit {
  background-color: #007bff;
  color: white;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90vw;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
