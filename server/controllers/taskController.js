const Task = require('../models/Task');
const Board = require('../models/Board');

// Helper — find the board that belongs to the requesting user
const getUserBoard = async (userId) => {
  return Board.findOne({ owner: userId });
};

// @desc    Get all tasks for the current user's board
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const board = await getUserBoard(req.user.id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const tasks = await Task.find({ board: board._id })
      .populate('assignee', 'username email')
      .sort({ createdAt: -1 });

    // Normalize _id → id for the React client
    const normalized = tasks.map((t) => ({ ...t.toObject(), id: t._id.toString() }));

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
    const board = await getUserBoard(req.user.id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found. Please re-login.' });
    }

    const { title, description, status, priority, tags, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      tags: tags || [],
      dueDate: dueDate || null,
      board: board._id,
      createdBy: req.user.id,
      version: 0,
    });

    const taskObj = { ...task.toObject(), id: task._id.toString() };
    // Emit real-time update for task creation
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board._id.toString()}`).emit('task:created', { task: taskObj });
      io.to(`board:${board._id.toString()}`).emit('task_created', { action: 'create', task: taskObj });
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
    const board = await getUserBoard(req.user.id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const { title, description, status, priority, tags, dueDate, version } = req.body;

    // Only update tasks that belong to the user's board (security check)
    let task = await Task.findOne({ _id: req.params.id, board: board._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Version check for optimistic concurrency / conflict detection
    if (typeof version === 'number' && task.version !== undefined && task.version !== version) {
      const latest = { ...task.toObject(), id: task._id.toString() };
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

    const taskObj = { ...task.toObject(), id: task._id.toString() };
    // Emit real-time update for task modification
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board._id.toString()}`).emit('task:updated', { task: taskObj });
      io.to(`board:${board._id.toString()}`).emit('task_updated', { action: 'update', task: taskObj });
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
    const board = await getUserBoard(req.user.id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.id, board: board._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Emit real-time deletion event
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board._id.toString()}`).emit('task:deleted', { taskId: req.params.id, task: { id: req.params.id } });
      io.to(`board:${board._id.toString()}`).emit('task_deleted', { action: 'delete', task: { id: req.params.id } });
    }
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

