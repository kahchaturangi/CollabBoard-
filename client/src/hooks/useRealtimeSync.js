import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, realtimeService } from '../services/socket';

// Normalizes an id whether it came from mock data (`id`) or MongoDB (`_id`).
function taskKey(task) {
  return task?._id || task?.id;
}

/**
 * Wires the CollabBoard task list up to Socket.io.
 *
 * - Joins the board room and merges live task:created / task:updated /
 *   task:deleted broadcasts into local state.
 * - Exposes `conflict`, populated whenever a write this client made was
 *   rejected because someone else updated the task first. The UI is
 *   responsible for showing it (e.g. a banner with "reload" / "discard").
 *
 * Usage in App.jsx:
 *   const { conflict, clearConflict, moveTask, updateTask, createTask, deleteTask }
 *     = useRealtimeSync(boardId, setTasks);
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

    const onCreated = ({ task }) => {
      setTasks((prev) => {
        if (prev.some((t) => taskKey(t) === taskKey(task))) return prev;
        return [task, ...prev];
      });
    };

    const onUpdated = ({ task }) => {
      setTasks((prev) => prev.map((t) => (taskKey(t) === taskKey(task) ? task : t)));
    };

    const onDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => taskKey(t) !== taskId));
    };

    const onPresence = ({ userIds }) => setOnlineUserIds(userIds);

    socket.on('task:created', onCreated);
    socket.on('task:updated', onUpdated);
    socket.on('task:deleted', onDeleted);
    socket.on('presence:update', onPresence);

    return () => {
      socket.off('connect', join);
      socket.off('task:created', onCreated);
      socket.off('task:updated', onUpdated);
      socket.off('task:deleted', onDeleted);
      socket.off('presence:update', onPresence);
      realtimeService.leaveBoard(boardId);
    };
  }, [boardId, setTasks]);

  useEffect(() => {
    // Only tear the whole socket down when the component that owns the
    // board view unmounts entirely (e.g. logout), not on every re-render.
    return () => disconnectSocket();
  }, []);

  const clearConflict = useCallback(() => setConflict(null), []);

  // Each of these resolves the optimistic local state OR surfaces a conflict.
  // `task` must include the `version` the client last saw.
  const moveTask = useCallback(
    async (task, newStatus) => {
      const res = await realtimeService.moveTask(taskKey(task), boardId, task.version, newStatus);
      if (!res.success && res.error === 'conflict') {
        setConflict({ type: 'move', local: task, server: res.task });
      }
      return res;
    },
    [boardId]
  );

  const updateTask = useCallback(
    async (task, updates) => {
      const res = await realtimeService.updateTask(taskKey(task), boardId, task.version, updates);
      if (!res.success && res.error === 'conflict') {
        setConflict({ type: 'update', local: task, server: res.task });
      }
      return res;
    },
    [boardId]
  );

  const createTask = useCallback(
    async (task) => {
      return realtimeService.createTask(boardId, task);
    },
    [boardId]
  );

  const deleteTask = useCallback(
    async (task) => {
      const res = await realtimeService.deleteTask(taskKey(task), boardId, task.version);
      if (!res.success && res.error === 'conflict') {
        setConflict({ type: 'delete', local: task, server: res.task });
      }
      return res;
    },
    [boardId]
  );

  return { conflict, clearConflict, onlineUserIds, moveTask, updateTask, createTask, deleteTask };
}
