// REST API Service with automatic fallback to local state / mock data
const API_BASE = 'http://localhost:5000/api';

// Helper to get headers with JWT token
const getHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Normalize a task returned from MongoDB (adds `id` alias for `_id`)
const normalize = (task) => ({
  ...task,
  id: task.id || task._id?.toString() || task.id,
});

export const apiService = {
  // ─── Auth ────────────────────────────────────────────────────────────────

  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async register(username, email, password) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  // ─── Tasks ───────────────────────────────────────────────────────────────

  async fetchTasks() {
    try {
      const response = await fetch(`${API_BASE}/tasks`, { headers: getHeaders() });
      if (!response.ok) throw new Error('API server unavailable');
      const data = await response.json();
      // data.data is the array from the server
      const tasks = Array.isArray(data.data) ? data.data : data;
      return tasks.map(normalize);
    } catch (error) {
      console.warn('Backend offline — using local cache:', error.message);
      return null;
    }
  },

  async createTask(taskData) {
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to save task to backend');
      const data = await response.json();
      return normalize(data.data || data);
    } catch (error) {
      console.warn('Task saved to local state (backend offline):', error.message);
      return taskData; // return as-is so local state stays correct
    }
  },

  async updateTask(id, updates) {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          ...updates,
          __v: updates.__v
        }),
      });
      
      const data = await response.json();
      
      if (response.status === 409) {
        return { conflict: true, current: normalize(data.current) };
      }
      
      if (!response.ok) throw new Error('Failed to update task');
      return normalize(data.data || data);
    } catch (error) {
      console.warn('Task updated in local state only:', error.message);
      return updates;
    }
  },

  async deleteTask(id) {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.warn('Task deleted from local state only:', error.message);
      return true;
    }
  },
};
