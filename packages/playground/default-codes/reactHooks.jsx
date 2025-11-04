import React, { useCallback, useEffect, useMemo, useState } from 'react';

export default function UserManager() {
  // 状态管理
  const [users, setUsers] = useState([
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin', status: 'active', avatar: 'https://picsum.photos/seed/user1/32/32.jpg', lastActive: new Date() },
    { id: 2, name: '李四', email: 'lisi@example.com', role: 'user', status: 'inactive', avatar: 'https://picsum.photos/seed/user2/32/32.jpg', lastActive: new Date(Date.now() - 86400000) },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: 'moderator', status: 'pending', avatar: 'https://picsum.photos/seed/user3/32/32.jpg', lastActive: new Date(Date.now() - 172800000) },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sorting, setSorting] = useState({ key: 'name', order: 'asc' });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
  });

  // 过滤和排序用户
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
        || user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 状态过滤
    if (statusFilter) {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // 排序
    return [...filtered].sort((a, b) => {
      const aValue = a[sorting.key];
      const bValue = b[sorting.key];

      if (aValue < bValue) {
        return sorting.order === 'asc'
          ? -1
          : 1;
      }
      if (aValue > bValue) {
        return sorting.order === 'asc'
          ? 1
          : -1;
      }
      return 0;
    });
  }, [users, searchQuery, statusFilter, sorting]);

  // 统计信息
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    pending: users.filter(u => u.status === 'pending').length,
  }), [users]);

  // 处理排序
  const handleSort = useCallback((key) => {
    setSorting(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc'
        ? 'desc'
        : 'asc',
    }));
  }, []);

  // 处理添加/编辑用户
  const handleSaveUser = useCallback(() => {
    if (editingUser) {
      setUsers(prev => prev.map(user =>
        user.id === editingUser.id
          ? { ...user, ...formData }
          : user,
      ));
    }
    else {
      const newUser = {
        id: Date.now(),
        ...formData,
        avatar: `https://picsum.photos/seed/user${Date.now()}/32/32.jpg`,
        lastActive: new Date(),
      };
      setUsers(prev => [...prev, newUser]);
    }

    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'user', status: 'active' });
  }, [editingUser, formData]);

  // 处理删除用户
  const handleDeleteUser = useCallback((id) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  }, []);

  // 打开编辑模态框
  const openEditModal = useCallback((user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setShowModal(true);
  }, []);

  // 格式化日期
  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // 获取角色标签
  const getRoleLabel = useCallback((role) => {
    const labels = {
      admin: '管理员',
      moderator: '版主',
      user: '用户',
    };
    return labels[role] || role;
  }, []);

  // 获取状态标签
  const getStatusLabel = useCallback((status) => {
    const labels = {
      active: '活跃',
      inactive: '非活跃',
      pending: '待审核',
    };
    return labels[status] || status;
  }, []);

  return (
    <div className="user-manager">
      <h2>React Hooks 用户管理系统</h2>

      <div className="search-section">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索用户..."
          className="search-input"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="status-filter">
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="inactive">非活跃</option>
          <option value="pending">待审核</option>
        </select>
      </div>

      <div className="action-section">
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          添加用户
        </button>
        <button onClick={() => setLoading(!loading)} className="btn btn-secondary">
          {loading
            ? '停止加载'
            : '模拟加载'}
        </button>
      </div>

      {loading && <div className="loading">加载中...</div>}

      <div className="user-table">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                姓名
                {' '}
                {sorting.key === 'name' && (sorting.order === 'asc'
                  ? '↑'
                  : '↓')}
              </th>
              <th onClick={() => handleSort('email')} className="sortable">
                邮箱
                {' '}
                {sorting.key === 'email' && (sorting.order === 'asc'
                  ? '↑'
                  : '↓')}
              </th>
              <th onClick={() => handleSort('role')} className="sortable">
                角色
                {' '}
                {sorting.key === 'role' && (sorting.order === 'asc'
                  ? '↑'
                  : '↓')}
              </th>
              <th onClick={() => handleSort('status')} className="sortable">
                状态
                {' '}
                {sorting.key === 'status' && (sorting.order === 'asc'
                  ? '↑'
                  : '↓')}
              </th>
              <th>最后活跃</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <img src={user.avatar} alt={user.name} className="avatar" />
                    {user.name}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {getStatusLabel(user.status)}
                  </span>
                </td>
                <td>{formatDate(user.lastActive)}</td>
                <td className="actions">
                  <button onClick={() => openEditModal(user)} className="btn-small btn-edit">
                    编辑
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="btn-small btn-delete">
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stats">
        <p>
          总计:
          {' '}
          {stats.total}
          {' '}
          |
          活跃:
          {' '}
          {stats.active}
          {' '}
          |
          非活跃:
          {' '}
          {stats.inactive}
          {' '}
          |
          待审核:
          {' '}
          {stats.pending}
        </p>
      </div>

      {/* 模态框 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>
              {editingUser
                ? '编辑用户'
                : '添加用户'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
              <div className="form-group">
                <label>姓名:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>邮箱:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>角色:</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="user">用户</option>
                  <option value="admin">管理员</option>
                  <option value="moderator">版主</option>
                </select>
              </div>
              <div className="form-group">
                <label>状态:</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">活跃</option>
                  <option value="inactive">非活跃</option>
                  <option value="pending">待审核</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingUser
                    ? '更新'
                    : '添加'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
