const TASKS_STORAGE_KEY = 'collabboard_tasks';
const OFFLINE_QUEUE_KEY = 'collabboard_offline_queue';

// ─── Task Cache ───────────────────────────────────────────────────────────────
export const taskStorage = {
  loadTasks() {
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : null;
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
      console.warn('Unable to save tasks to localStorage:', error);
      return false;
    }
  },

  clearTasks() {
    localStorage.removeItem(TASKS_STORAGE_KEY);
  },
};

// ─── Offline Write Queue ──────────────────────────────────────────────────────
// Stores pending create / update / delete operations that failed due to network
// loss. Flushed automatically when the app comes back online.
//
// Each queued op shape:
//   { type: 'create' | 'update' | 'delete', id: string, payload: object, timestamp: number }

export const offlineQueue = {
  /** Return the current queue (array). */
  load() {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /** Persist the queue. */
  _save(queue) {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Could not persist offline queue:', e);
    }
  },

  /** Add an operation to the queue. */
  enqueue(op) {
    const queue = this.load();
    queue.push({ ...op, timestamp: Date.now() });
    this._save(queue);
    console.info('[Offline Queue] Enqueued op:', op.type, op.id || '');
  },

  /** Remove and return all queued operations (clears the queue). */
  drain() {
    const queue = this.load();
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return queue;
  },

  /** True if there are pending offline ops. */
  hasPending() {
    return this.load().length > 0;
  },
};