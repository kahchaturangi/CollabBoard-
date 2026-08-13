// REST API Service with automatic fallback to local state / mock data
const API_BASE = '/api/tasks';

export const apiService = {
  async fetchTasks() {
    try {
      const response = await fetch(API_BASE);
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
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.warn('Task deleted from local state');
      return true;
    }
  },
};
