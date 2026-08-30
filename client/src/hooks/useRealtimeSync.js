import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, realtimeService } from '../services/socket';

// Normalizes an id whether it came from mock data (`id`) or MongoDB (`_id`).
function taskKey(task) {
  return String(task?._id || task?.id || '');
}

/**
 * Wires the CollabBoard task list up to Socket.io.
 *
 * - Joins the board room and merges live task:created / task:updated /
 *   task:deleted broadcasts into local state.
 * - Exposes `conflict`, populated whenever a write this client made was
 *   rejected because someone else updated the task first. The UI is
 *   responsible for showing it (e.g. a banner with "reload" / "discard").
 */
export function useRealtimeSync(boardId, setTasks) {
  const [conflict, setConflict] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!boardId) return;

    const socket = connectSocket();
    socketRef.current = socket;

    const join = () => realtimeService.joinBoard(boardId);
    if (socket.connected) join();
    socket.on('connect', join);

    const onCreated = (data) => {
      const task = data.task || data;
      if (!task) return;
      setTasks((prev) => {
        if (prev.some((t) => taskKey(t) === taskKey(task))) return prev;
        return [task, ...prev];
      });
    };

    const onUpdated = (data) => {
      const task = data.task || data;
      if (!task) return;
      setTasks((prev) => prev.map((t) => (taskKey(t) === taskKey(task) ? task : t)));
    };

    const onDeleted = (data) => {
      const targetId = String(data.taskId || data.task?.id || data.id || '');
      if (!targetId) return;
      setTasks((prev) => prev.filter((t) => taskKey(t) !== targetId));
    };

    const onPresence = ({ userIds }) => setOnlineUserIds(userIds || []);

    socket.on('task:created', onCreated);
    socket.on('task_created', onCreated);
    socket.on('task:updated', onUpdated);
    socket.on('task_updated', onUpdated);
    socket.on('task:deleted', onDeleted);
    socket.on('task_deleted', onDeleted);
    socket.on('presence:update', onPresence);

    return () => {
      socket.off('connect', join);
      socket.off('task:created', onCreated);
      socket.off('task_created', onCreated);
      socket.off('task:updated', onUpdated);
      socket.off('task_updated', onUpdated);
      socket.off('task:deleted', onDeleted);
      socket.off('task_deleted', onDeleted);
      socket.off('presence:update', onPresence);
      realtimeService.leaveBoard(boardId);
    };
  }, [boardId, setTasks]);

  useEffect(() => {
    return () => disconnectSocket();
  }, []);

  const clearConflict = useCallback(() => setConflict(null), []);

  const moveTask = useCallback(
    async (task, newStatus) => {
      const version = task.version ?? 0;
      const res = await realtimeService.moveTask(taskKey(task), boardId, version, newStatus);
      if (res && !res.success && res.error === 'conflict') {
        if (res.task) {
          setTasks((prev) => prev.map((t) => (taskKey(t) === taskKey(res.task) ? res.task : t)));
        }
        setConflict({ type: 'move', local: task, server: res.task });
      }
      return res;
    },
    [boardId, setTasks]
  );

  const updateTask = useCallback(
    async (task, updates) => {
      const version = task.version ?? 0;
      const res = await realtimeService.updateTask(taskKey(task), boardId, version, updates);
      if (res && !res.success && res.error === 'conflict') {
        if (res.task) {
          setTasks((prev) => prev.map((t) => (taskKey(t) === taskKey(res.task) ? res.task : t)));
        }
        setConflict({ type: 'update', local: task, server: res.task });
      }
      return res;
    },
    [boardId, setTasks]
  );

  const createTask = useCallback(
    async (task) => {
      return realtimeService.createTask(boardId, task);
    },
    [boardId]
  );

  const deleteTask = useCallback(
    async (task) => {
      const version = task?.version ?? 0;
      const res = await realtimeService.deleteTask(taskKey(task), boardId, version);
      if (res && !res.success && res.error === 'conflict') {
        if (res.task) {
          setTasks((prev) => prev.map((t) => (taskKey(t) === taskKey(res.task) ? res.task : t)));
        }
        setConflict({ type: 'delete', local: task, server: res.task });
      }
      return res;
    },
    [boardId, setTasks]
  );

  return { conflict, clearConflict, onlineUserIds, moveTask, updateTask, createTask, deleteTask };
}

