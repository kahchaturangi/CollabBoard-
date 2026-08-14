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
 * ack(response) shape
 *   success: { success: true, task }
 *   conflict: { success: false, error: 'conflict', task }   <- `task` is the CURRENT server copy
 *   not found: { success: false, error: 'not_found' }
 *   invalid: { success: false, error: 'invalid', message }
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
 * This satisfies the brief's "detect a conflicting update and surface it
 * rather than silently overwriting data" requirement.
 */

function authenticateSocket(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication error: no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

  // boardId -> Set of userId currently in the room, for a lightweight presence indicator
  const presence = new Map();

  io.on('connection', async (socket) => {
    let user = null;
    try {
      user = await User.findById(socket.userId).select('-password');
    } catch (err) {
      // If the user lookup fails we still keep the connection but skip presence info
    }

    socket.on('board:join', ({ boardId }) => {
      if (!boardId) return;
      socket.join(boardRoom(boardId));
      socket.currentBoardId = boardId;

      if (!presence.has(boardId)) presence.set(boardId, new Set());
      presence.get(boardId).add(String(socket.userId));

      io.to(boardRoom(boardId)).emit('presence:update', {
        userIds: Array.from(presence.get(boardId)),
      });
    });

    socket.on('board:leave', ({ boardId }) => {
      leaveBoard(socket, boardId, presence, io);
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
        });
        io.to(boardRoom(boardId)).emit('task:created', { task: created });
        ack?.({ success: true, task: created });
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

        if (typeof version === 'number' && task.version !== version) {
          return ack?.({ success: false, error: 'conflict', task });
        }

        await Task.findByIdAndDelete(taskId);
        io.to(boardRoom(boardId)).emit('task:deleted', { taskId });
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, error: 'invalid', message: err.message });
      }
    });

    socket.on('disconnect', () => {
      if (socket.currentBoardId) {
        leaveBoard(socket, socket.currentBoardId, presence, io);
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
    if (typeof version === 'number' && task.version !== version) {
      return ack?.({ success: false, error: 'conflict', task });
    }

    Object.assign(task, applyUpdates);
    task.version += 1;
    await task.save();

    io.to(boardRoom(boardId)).emit('task:updated', { task });
    ack?.({ success: true, task });
  } catch (err) {
    ack?.({ success: false, error: 'invalid', message: err.message });
  }
}

function leaveBoard(socket, boardId, presence, io) {
  socket.leave(boardRoom(boardId));
  const set = presence.get(boardId);
  if (set) {
    set.delete(String(socket.userId));
    io.to(boardRoom(boardId)).emit('presence:update', { userIds: Array.from(set) });
  }
}

module.exports = { initSocket };
