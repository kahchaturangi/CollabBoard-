const { getModels } = require('../utils/dbProvider');

// Helper — find the board that belongs to the requesting user
const getUserBoard = async (userId) => {
  const { Board } = getModels();
  let board = null;
  try {
    board = await Board.findOne({ owner: userId });
    if (!board) {
      board = await Board.findOne({ members: userId });
    }
  } catch (e) {
    // Ignore error and try fallback
  }

  if (!board) {
    try {
      board = await Board.create({
        name: 'My Board',
        description: 'Default project board',
        owner: userId,
        members: [userId],
      });
    } catch (err) {
      board = await Board.findOne();
    }
  }
  return board;
};

// @desc    Get all tasks for the current user's board
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please login again.' });
    }

    const board = await getUserBoard(userId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const { Task } = getModels();
    let query = Task.find({ board: board._id });
    if (typeof query.populate === 'function') {
      query = query.populate('assignee', 'username email');
    }
    if (typeof query.sort === 'function') {
      query = query.sort({ createdAt: -1 });
    }
    const tasks = await query;

    // Normalize _id → id for the React client
    const normalized = (tasks || []).map((t) => {
      const obj = typeof t.toObject === 'function' ? t.toObject() : { ...t };
      return { ...obj, id: (obj._id || obj.id).toString() };
    });

    res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please login again.' });
    }

    const board = await getUserBoard(userId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found. Please re-login.' });
    }

    const { title, description, status, priority, tags, dueDate, assignee } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const { Task } = getModels();
    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee || null,
      tags: tags || [],
      dueDate: dueDate || null,
      board: board._id || board.id,
      createdBy: userId,
      version: 0,
    });

    const rawObj = typeof task.toObject === 'function' ? task.toObject() : { ...task };
    const taskObj = { ...rawObj, id: (rawObj._id || rawObj.id).toString() };
    // Emit real-time update for task creation
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board._id.toString()}`).emit('task:created', { task: taskObj });
      io.to(`board:${board._id.toString()}`).emit('task_created', { action: 'create', task: taskObj });
      io.emit('task:created', { task: taskObj });
      io.emit('task_created', { action: 'create', task: taskObj });
    }
    res.status(201).json({ success: true, data: taskObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please login again.' });
    }

    const board = await getUserBoard(userId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const { title, description, status, priority, tags, dueDate, version } = req.body;

    const { Task } = getModels();
    // Only update tasks that belong to the user's board (security check)
    let task = await Task.findOne({ _id: req.params.id, board: board._id || board.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Version check for optimistic concurrency / conflict detection
    if (typeof version === 'number' && task.version !== undefined && task.version !== version) {
      const rawObj = typeof task.toObject === 'function' ? task.toObject() : { ...task };
      const latest = { ...rawObj, id: (rawObj._id || rawObj.id).toString() };
      return res.status(409).json({
        success: false,
        error: 'conflict',
        message: 'Conflict: Task has been updated by another user',
        current: latest,
        task: latest,
      });
    }

    // Only update fields that were actually provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (tags !== undefined) task.tags = tags;
    if (dueDate !== undefined) task.dueDate = dueDate;
    task.version = (task.version || 0) + 1;

    await task.save();

    const rawObj = typeof task.toObject === 'function' ? task.toObject() : { ...task };
    const taskObj = { ...rawObj, id: (rawObj._id || rawObj.id).toString() };
    // Emit real-time update for task modification
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board._id.toString()}`).emit('task:updated', { task: taskObj });
      io.to(`board:${board._id.toString()}`).emit('task_updated', { action: 'update', task: taskObj });
      io.emit('task:updated', { task: taskObj });
      io.emit('task_updated', { action: 'update', task: taskObj });
    }
    res.status(200).json({ success: true, data: taskObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please login again.' });
    }

    const board = await getUserBoard(userId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const { Task } = getModels();
    const task = await Task.findOneAndDelete({ _id: req.params.id, board: board._id || board.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Emit real-time deletion event
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board._id.toString()}`).emit('task:deleted', { taskId: req.params.id, task: { id: req.params.id } });
      io.to(`board:${board._id.toString()}`).emit('task_deleted', { action: 'delete', task: { id: req.params.id } });
      io.emit('task:deleted', { taskId: req.params.id, task: { id: req.params.id } });
      io.emit('task_deleted', { action: 'delete', task: { id: req.params.id } });
    }
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

