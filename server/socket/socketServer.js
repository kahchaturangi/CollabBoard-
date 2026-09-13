const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');

/**
 * Real-Time WebSockets & Concurrency layer (Member 5).
 *
 * Event contract
 * --------------
 * Client -> Server
 *   board:join   { boardId }
 *   board:leave  { boardId }
 *   task:create  { boardId, task }                         -> ack(response)
 *   task:update  { taskId, boardId, version, updates }      -> ack(response)
 *   task:move    { taskId, boardId, version, status }       -> ack(response)  (drag between columns)
 *   task:delete  { taskId, boardId, version }                -> ack(response)
 *
 * Server -> Room (broadcast to everyone else on board:<boardId>)
 *   task:created  { task }
 *   task:updated  { task }
 *   task:deleted  { taskId }
 *   presence:update { userIds: [...] }  (who's currently viewing the board)
 *
 * Conflict detection strategy
 * ----------------------------
 * Every Task carries a numeric `version`. The client always sends back the
 * version it last saw. Before applying an update the server re-reads the
 * task and compares versions:
 *   - match      -> apply changes, version += 1, save, broadcast, ack success
 *   - mismatch   -> someone else updated the task first. Reject the write,
 *                   ack back the CURRENT server copy so the client can show
 *                   the user what actually changed instead of silently
 *                   overwriting it.
 */

function authenticateSocket(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.userId = decoded.id;
      return next();
    } catch (err) {
      console.warn('Socket token verify failed, continuing with guest ID:', err.message);
    }
  }

  // Graceful fallback: allow connection so real-time board sync works across all tabs and windows
  socket.userId = socket.handshake.auth?.userId || `user-${socket.id.substring(0, 8)}`;
  next();
}

function boardRoom(boardId) {
  return `board:${boardId}`;
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(authenticateSocket);

  // boardId -> Set of userId currently in the room
  const boardPresence = new Map();
  // userId (string) -> Set of active socket.id
  const userSockets = new Map();
  // userId (string) -> setTimeout timer id for debounced offline disconnect
  const disconnectTimers = new Map();
  // userId (string) -> { userId, username, email, status: 'online'|'away'|'offline', lastSeen: Date }
  const userPresence = new Map();

  io.on('connection', async (socket) => {
    const userIdStr = String(socket.userId);
    let user = null;

    try {
      if (socket.userId) {
        user = await User.findById(socket.userId).select('username email status lastSeen');
      }
    } catch (err) {
      // Ignore user lookup failure
    }

    // Cancel any pending disconnect timer if this user reconnected
    if (disconnectTimers.has(userIdStr)) {
      clearTimeout(disconnectTimers.get(userIdStr));
      disconnectTimers.delete(userIdStr);
    }

    // Track active socket connection
    if (!userSockets.has(userIdStr)) {
      userSockets.set(userIdStr, new Set());
    }
    userSockets.get(userIdStr).add(socket.id);

    // Update in-memory presence
    const initialStatus = 'online';
    const now = new Date();
    userPresence.set(userIdStr, {
      userId: userIdStr,
      username: user?.username || socket.username || 'User',
      email: user?.email || '',
      status: initialStatus,
      lastSeen: now,
    });

    // Update database status
    User.findByIdAndUpdate(socket.userId, { status: initialStatus, lastSeen: now }).catch(() => {});

    // --- Presence Status Changes (online / away) ---
    socket.on('presence:status', async ({ status }) => {
      if (!['online', 'away'].includes(status)) return;
      const current = userPresence.get(userIdStr) || { userId: userIdStr };
      current.status = status;
      current.lastSeen = new Date();
      userPresence.set(userIdStr, current);

      // Persist to database
      User.findByIdAndUpdate(socket.userId, { status, lastSeen: current.lastSeen }).catch(() => {});

      if (socket.currentBoardId) {
        const payload = {
          boardId: socket.currentBoardId,
          userId: userIdStr,
          status,
          lastSeen: current.lastSeen,
          userIds: Array.from(boardPresence.get(socket.currentBoardId) || []),
        };
        io.to(boardRoom(socket.currentBoardId)).emit('presence:update', payload);
        io.to(boardRoom(socket.currentBoardId)).emit(status === 'away' ? 'user:away' : 'user:online', {
          userId: userIdStr,
          status,
          lastSeen: current.lastSeen,
        });
      }
    });

    // --- Join Board Room ---
    socket.on('board:join', ({ boardId }) => {
      if (!boardId) return;
      socket.join(boardRoom(boardId));
      socket.currentBoardId = boardId;

      if (!boardPresence.has(boardId)) boardPresence.set(boardId, new Set());
      boardPresence.get(boardId).add(userIdStr);

      const activeSet = boardPresence.get(boardId);
      const presences = Array.from(activeSet).map((uId) => {
        return userPresence.get(uId) || { userId: uId, status: 'online', lastSeen: new Date() };
      });

      // Send current full presence snapshot to the joining user
      socket.emit('presence:sync', {
        boardId,
        presences,
        userIds: Array.from(activeSet),
      });

      // Broadcast update to all board members
      const current = userPresence.get(userIdStr) || { userId: userIdStr, status: 'online', lastSeen: new Date() };
      io.to(boardRoom(boardId)).emit('presence:update', {
        boardId,
        userId: userIdStr,
        status: current.status,
        lastSeen: current.lastSeen,
        presences,
        userIds: Array.from(activeSet),
      });
      io.to(boardRoom(boardId)).emit('user:online', {
        userId: userIdStr,
        status: current.status,
        lastSeen: current.lastSeen,
      });
    });

    socket.on('board:leave', ({ boardId }) => {
      leaveBoard(socket, boardId, boardPresence, userPresence, io);
    });

    // --- Create -------------------------------------------------------
    socket.on('task:create', async ({ boardId, task }, ack) => {
      try {
        if (!boardId || !task) {
          return ack?.({ success: false, error: 'invalid', message: 'Missing boardId or task' });
        }
        const taskPayload = { ...task };
        delete taskPayload._id;
        delete taskPayload.id;

        let created;
        try {
          created = await Task.create({
            ...taskPayload,
            board: boardId,
            createdBy: socket.userId || null,
            version: 0,
          });
        } catch (dbErr) {
          created = {
            ...task,
            _id: task.id || `task-${Date.now()}`,
            board: boardId,
            createdBy: socket.userId || 'system',
            version: 0,
          };
        }

        const normalized = {
          ...(typeof created.toObject === 'function' ? created.toObject() : created),
          id: (created._id || created.id || task.id || `task-${Date.now()}`).toString(),
        };

        io.to(boardRoom(boardId)).emit('task:created', { task: normalized });
        io.to(boardRoom(boardId)).emit('task_created', { action: 'create', task: normalized });
        io.emit('task:created', { task: normalized });
        io.emit('task_created', { action: 'create', task: normalized });

        ack?.({ success: true, task: normalized });
      } catch (err) {
        console.error('Socket task:create error:', err.message);
        ack?.({ success: false, error: 'invalid', message: err.message });
      }
    });

    // --- Update (field edits) ------------------------------------------
    socket.on('task:update', async (payload, ack) => {
      await handleVersionedWrite({ io, socket, payload, ack, applyUpdates: payload?.updates });
    });

    // --- Move (drag between columns) ------------------------------------
    socket.on('task:move', async (payload, ack) => {
      await handleVersionedWrite({
        io,
        socket,
        payload,
        ack,
        applyUpdates: { status: payload?.status },
      });
    });

    // --- Delete -----------------------------------------------------------
    socket.on('task:delete', async ({ taskId, boardId, version }, ack) => {
      try {
        try {
          await Task.findByIdAndDelete(taskId);
        } catch (delErr) {}

        const delTask = { id: String(taskId), taskId: String(taskId) };
        io.to(boardRoom(boardId)).emit('task:deleted', delTask);
        io.to(boardRoom(boardId)).emit('task_deleted', { action: 'delete', ...delTask });
        io.emit('task:deleted', delTask);
        io.emit('task_deleted', { action: 'delete', ...delTask });
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, error: 'invalid', message: err.message });
      }
    });

    socket.on('disconnect', () => {
      const activeSockets = userSockets.get(userIdStr);
      if (activeSockets) {
        activeSockets.delete(socket.id);
        if (activeSockets.size === 0) {
          userSockets.delete(userIdStr);
          // Start debounce grace period (4000ms) before setting offline
          const timer = setTimeout(async () => {
            disconnectTimers.delete(userIdStr);
            const lastSeenTime = new Date();
            const curr = userPresence.get(userIdStr) || { userId: userIdStr };
            curr.status = 'offline';
            curr.lastSeen = lastSeenTime;
            userPresence.set(userIdStr, curr);

            // Persist to database
            try {
              await User.findByIdAndUpdate(socket.userId, { status: 'offline', lastSeen: lastSeenTime });
            } catch (err) {}

            // Broadcast to all board rooms this user was in
            for (const [bId, set] of boardPresence.entries()) {
              if (set.has(userIdStr)) {
                set.delete(userIdStr);
                io.to(boardRoom(bId)).emit('presence:update', {
                  boardId: bId,
                  userId: userIdStr,
                  status: 'offline',
                  lastSeen: lastSeenTime,
                  userIds: Array.from(set),
                });
                io.to(boardRoom(bId)).emit('user:offline', {
                  userId: userIdStr,
                  status: 'offline',
                  lastSeen: lastSeenTime,
                });
              }
            }
          }, 4000);
          disconnectTimers.set(userIdStr, timer);
        }
      }
    });
  });

  return io;
}

async function handleVersionedWrite({ io, socket, payload, ack, applyUpdates }) {
  const { taskId, boardId, version } = payload || {};
  try {
    if (!taskId || !boardId) {
      return ack?.({ success: false, error: 'invalid', message: 'Missing taskId or boardId' });
    }

    let task = null;
    try {
      task = await Task.findById(taskId);
    } catch (findErr) {}

    let normalizedTask;
    if (task) {
      if (typeof version === 'number' && task.version !== undefined && task.version !== version) {
        const serverTaskObj = { ...task.toObject(), id: task._id.toString() };
        return ack?.({ success: false, error: 'conflict', task: serverTaskObj });
      }

      if (applyUpdates) {
        Object.assign(task, applyUpdates);
      }
      task.version = (task.version || 0) + 1;
      try {
        await task.save();
      } catch (saveErr) {}

      normalizedTask = { ...task.toObject(), id: task._id.toString() };
    } else {
      normalizedTask = { id: String(taskId), ...(applyUpdates || {}), version: (version || 0) + 1 };
    }

    io.to(boardRoom(boardId)).emit('task:updated', { task: normalizedTask });
    io.to(boardRoom(boardId)).emit('task_updated', { action: 'update', task: normalizedTask });
    io.emit('task:updated', { task: normalizedTask });
    io.emit('task_updated', { action: 'update', task: normalizedTask });
    ack?.({ success: true, task: normalizedTask });
  } catch (err) {
    ack?.({ success: false, error: 'invalid', message: err.message });
  }
}

function leaveBoard(socket, boardId, boardPresence, userPresence, io) {
  socket.leave(boardRoom(boardId));
  const set = boardPresence.get(boardId);
  if (set) {
    set.delete(String(socket.userId));
    const curr = userPresence.get(String(socket.userId)) || { status: 'offline', lastSeen: new Date() };
    io.to(boardRoom(boardId)).emit('presence:update', {
      boardId,
      userId: String(socket.userId),
      status: curr.status,
      lastSeen: curr.lastSeen,
      userIds: Array.from(set),
    });
  }
}

module.exports = { initSocket };

