import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

// Reuses one connection for the whole app instead of opening a new socket
// per component. Call connectSocket() once (e.g. after login / on board mount).
export function connectSocket() {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('token');
  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  });

  return socket;
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

export function joinBoard(boardId) {
  socket?.emit('board:join', { boardId });
}

export function leaveBoard(boardId) {
  socket?.emit('board:leave', { boardId });
}

export function createTask(boardId, task) {
  return emitWithAck('task:create', { boardId, task });
}

export function updateTask(taskId, boardId, version, updates) {
  return emitWithAck('task:update', { taskId, boardId, version, updates });
}

export function moveTask(taskId, boardId, version, status) {
  return emitWithAck('task:move', { taskId, boardId, version, status });
}

export function deleteTask(taskId, boardId, version) {
  return emitWithAck('task:delete', { taskId, boardId, version });
}

export const realtimeService = {
  joinBoard,
  leaveBoard,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
};