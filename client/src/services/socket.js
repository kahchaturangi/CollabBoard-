import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null);
}

// Initialize socket immediately when module loads
function initializeSocket() {
  const token = getToken();
  if (socket) {
    if (token) {
      socket.auth = { token };
    }
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 50,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected to CollabBoard server, id:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
}

// Auto-initialize on module load if token exists
if (typeof window !== 'undefined' && getToken()) {
  initializeSocket();
}

// Reuses one connection for the whole app instead of opening a new socket
// per component. Call connectSocket() once (e.g. after login / on board mount).
export function connectSocket() {
  return initializeSocket();
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

// Export joinBoard for backward compatibility
export function joinBoard(boardId) {
  if (socket) {
    socket.emit('board:join', { boardId });
  }
}

// Wraps a socket.emit(event, payload, ack) call in a Promise so callers can
// `await` a real-time write the same way they'd await a fetch() call.
function emitWithAck(event, payload, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket not connected'));

    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for "${event}" acknowledgement`));
    }, timeoutMs);

    socket.emit(event, payload, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

export const realtimeService = {
  joinBoard(boardId) {
    socket?.emit('board:join', { boardId });
  },

  leaveBoard(boardId) {
    socket?.emit('board:leave', { boardId });
  },

  createTask(boardId, task) {
    return emitWithAck('task:create', { boardId, task });
  },

  // updates: partial field changes (title, description, priority, etc.)
  updateTask(taskId, boardId, version, updates) {
    return emitWithAck('task:update', { taskId, boardId, version, updates });
  },

  // Convenience wrapper for the drag-and-drop column change specifically.
  moveTask(taskId, boardId, version, status) {
    return emitWithAck('task:move', { taskId, boardId, version, status });
  },

  deleteTask(taskId, boardId, version) {
    return emitWithAck('task:delete', { taskId, boardId, version });
  },

  updatePresenceStatus(status) {
    socket?.emit('presence:status', { status });
  },
};