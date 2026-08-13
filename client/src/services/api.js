// REST API Service with automatic fallback to local state / mock data
const API_BASE = '/api/tasks';

// Helper to get headers with JWT token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const apiService = {
  // Auth endpoints
  async login(email, password) {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async register(username, email, password) {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  // Task endpoints
  async fetchTasks() {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', { headers: getHeaders() });
      if (!response.ok) throw new Error('API server unavailable');
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Backend API offline. Operating using client state:', error.message);
      return null;
    }
  },

  async createTask(taskData) {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to save task to backend');
      return await response.json();
    } catch (error) {
      console.warn('Task saved to local client state (Backend sync offline)');
      return taskData;
    }
  },

  async updateTask(id, updates) {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return await response.json();
    } catch (error) {
      console.warn('Task updated in local state:', error.message);
      return updates;
    }
  },

  async deleteTask(id) {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.warn('Task deleted from local state');
      return true;
    }
  },
};
