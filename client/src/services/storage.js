const TASKS_STORAGE_KEY = 'collabboard_tasks';

export const taskStorage = {
  loadTasks() {
    try {
      const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);

      if (!storedTasks) {
        return null;
      }

      const parsedTasks = JSON.parse(storedTasks);

      return Array.isArray(parsedTasks) ? parsedTasks : null;
    } catch (error) {
      console.warn('Unable to load cached tasks:', error);
      return null;
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.warn('Unable to save tasks to local storage:', error);
      return false;
    }
  },

  clearTasks() {
    localStorage.removeItem(TASKS_STORAGE_KEY);
  },
};