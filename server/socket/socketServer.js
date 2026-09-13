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

  if (!token) {
    return next(new Error('Authentication error: no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error: invalid token'));
  }
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
        const created = await Task.create({
          ...task,
          board: boardId,
          createdBy: socket.userId,
          version: 0,
        });
        const normalized = { ...created.toObject(), id: created._id.toString() };
        io.to(boardRoom(boardId)).emit('task:created', { task: normalized });
        io.to(boardRoom(boardId)).emit('task_created', { action: 'create', task: normalized });
        ack?.({ success: true, task: normalized });
      } catch (err) {
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
        const task = await Task.findById(taskId);
        if (!task) return ack?.({ success: false, error: 'not_found' });

        if (typeof version === 'number' && task.version !== undefined && task.version !== version) {
          const serverTaskObj = { ...task.toObject(), id: task._id.toString() };
          return ack?.({ success: false, error: 'conflict', task: serverTaskObj });
        }

        await Task.findByIdAndDelete(taskId);
        io.to(boardRoom(boardId)).emit('task:deleted', { taskId, task: { id: taskId } });
        io.to(boardRoom(boardId)).emit('task_deleted', { action: 'delete', task: { id: taskId } });
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

    const task = await Task.findById(taskId);
    if (!task) {
      return ack?.({ success: false, error: 'not_found' });
    }

    // Conflict check: the client must be editing the version it actually saw.
    if (typeof version === 'number' && task.version !== undefined && task.version !== version) {
      const serverTaskObj = { ...task.toObject(), id: task._id.toString() };
      return ack?.({ success: false, error: 'conflict', task: serverTaskObj });
    }

    if (applyUpdates) {
      Object.assign(task, applyUpdates);
    }
    task.version = (task.version || 0) + 1;
    await task.save();

    const normalizedTask = { ...task.toObject(), id: task._id.toString() };
    io.to(boardRoom(boardId)).emit('task:updated', { task: normalizedTask });
    io.to(boardRoom(boardId)).emit('task_updated', { action: 'update', task: normalizedTask });
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

