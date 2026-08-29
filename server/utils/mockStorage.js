// Mock storage for development without MongoDB
// Users and boards are stored in memory (not persistent)

const mockUsers = new Map();
const mockBoards = new Map();
const mockTasks = new Map();
let userIdCounter = 1;
let boardIdCounter = 1;
let taskIdCounter = 1;

// Helper to generate IDs
const generateId = (prefix, counter) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const MockUser = class {
  constructor(username, email, password) {
    this._id = generateId('user', userIdCounter++);
    this.username = username;
    this.email = email;
    this.password = password; // In production, this should be hashed
  }

  async matchPassword(password) {
    return this.password === password;
  }
};

const MockBoard = class {
  constructor(name, description, owner, members) {
    this._id = generateId('board', boardIdCounter++);
    this.name = name;
    this.description = description;
    this.owner = owner;
    this.members = members;
    this.createdAt = new Date();
  }
};

const MockTask = class {
  constructor(title, description, boardId, status, priority, assignedTo) {
    this._id = generateId('task', taskIdCounter++);
    this.title = title;
    this.description = description;
    this.boardId = boardId;
    this.status = status || 'todo';
    this.priority = priority || 'medium';
    this.assignedTo = assignedTo;
    this.tags = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
};

const QueryBuilder = class {
  constructor(fn, includePassword = false) {
    this.fn = fn;
    this.includePassword = includePassword;
  }

  select(fields) {
    if (fields && fields.includes('+password')) {
      this.includePassword = true;
    }
    return this;
  }

  async exec() {
    return this.fn();
  }
};

const mockStorage = {
  // Users
  User: {
    async findOne(query, options = {}) {
      const select = options.select || query.select;
      const includePassword = select && select.includes('+password');

      for (const [id, user] of mockUsers) {
        if (query.email && user.email === query.email) {
          if (includePassword) return user;
          return { ...user, password: undefined };
        }
        if (query._id && user._id === query._id) {
          if (includePassword) return user;
          return { ...user, password: undefined };
        }
      }
      return null;
    },

    select(fields) {
      return {
        select: fields,
        async exec() {
          return null;
        },
      };
    },

    async create(userData) {
      const user = new MockUser(userData.username, userData.email, userData.password);
      mockUsers.set(user._id, user);
      return user;
    },

    async findById(id) {
      return mockUsers.get(id) || null;
    },
  },

  // Boards
  Board: {
    async findOne(query) {
      for (const [id, board] of mockBoards) {
        if (query.owner && board.owner === query.owner) {
          return board;
        }
        if (query._id && board._id === query._id) {
          return board;
        }
      }
      return null;
    },

    async create(boardData) {
      const board = new MockBoard(
        boardData.name,
        boardData.description,
        boardData.owner,
        boardData.members
      );
      mockBoards.set(board._id, board);
      return board;
    },

    async find(query) {
      const results = [];
      for (const [id, board] of mockBoards) {
        if (query.owner && board.owner === query.owner) {
          results.push(board);
        }
      }
      return results;
    },

    async findById(id) {
      return mockBoards.get(id) || null;
    },
  },

  // Tasks
  Task: {
    async find(query) {
      const results = [];
      for (const [id, task] of mockTasks) {
        let matches = true;
        if (query.boardId && task.boardId !== query.boardId) matches = false;
        if (query.status && task.status !== query.status) matches = false;
        if (query.priority && task.priority !== query.priority) matches = false;
        if (matches) results.push(task);
      }
      return results;
    },

    async findOne(query) {
      for (const [id, task] of mockTasks) {
        if (query._id && task._id === query._id) return task;
      }
      return null;
    },

    async findById(id) {
      return mockTasks.get(id) || null;
    },

    async create(taskData) {
      const task = new MockTask(
        taskData.title,
        taskData.description,
        taskData.boardId,
        taskData.status,
        taskData.priority,
        taskData.assignedTo
      );
      mockTasks.set(task._id, task);
      return task;
    },

    async findByIdAndUpdate(id, updates) {
      const task = await this.findOne({ _id: id });
      if (!task) return null;
      Object.assign(task, updates);
      task.updatedAt = new Date();
      return task;
    },

    async findByIdAndDelete(id) {
      const task = await this.findOne({ _id: id });
      if (!task) return null;
      mockTasks.delete(id);
      return task;
    },
  },

  // Helper to check if we're in mock mode
  isMockMode: true,
};

module.exports = { mockStorage };
