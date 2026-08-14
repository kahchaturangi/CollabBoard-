// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
export const socket = io(SOCKET_URL, {
  // Auto‑reconnect is enabled by default
  transports: ['websocket']
});

/**
 * Join a board room for real‑time updates.
 * @param {string} boardId - The board identifier to join.
 */
export const joinBoard = (boardId) => {
  if (boardId) {
    socket.emit('join_board', boardId);
  }
};
