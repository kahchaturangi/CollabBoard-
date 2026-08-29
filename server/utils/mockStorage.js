// Mock storage with local JSON persistence for development without MongoDB
// Users, boards, and tasks are persisted to server/data/local_db.json

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'local_db.json');

const mockUsers = new Map();
const mockBoards = new Map();
const mockTasks = new Map();

// Helper to save to file
const persistToDisk = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const data = {
      users: Array.from(mockUsers.entries()),
      boards: Array.from(mockBoards.entries()),
      tasks: Array.from(mockTasks.entries()),
    };
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist mock DB:', err.message);
  }
};

// Helper to load from file
const loadFromDisk = () => {
  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        for (const [k, v] of data.users) mockUsers.set(k, v);
      }
      if (Array.isArray(data.boards)) {
        for (const [k, v] of data.boards) mockBoards.set(k, v);
      }
      if (Array.isArray(data.tasks)) {
        for (const [k, v] of data.tasks) mockTasks.set(k, v);
      }
      console.log(`📦 Loaded ${mockUsers.size} users and ${mockBoards.size} boards from local storage.`);
    }
  } catch (err) {
    console.error('Failed to load mock DB from file:', err.message);
  }
};

// Initial load
loadFromDisk();

let userIdCounter = mockUsers.size + 1;
let boardIdCounter = mockBoards.size + 1;
let taskIdCounter = mockTasks.size + 1;

// Helper to generate IDs
const generateId = (prefix, counter) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
};

const bcrypt = require('bcryptjs');

const MockUser = class {
  constructor(username, email, password) {
    this._id = generateId('user', userIdCounter++);
    this.username = username;
    this.email = email;
    this.password = password;
  }

  async matchPassword(password) {
    if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
      return await bcrypt.compare(password, this.password);
    }
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

const mockStorage = {
  // Users
  User: {
    findOne(query = {}, options = {}) {
      let selectFields = options.select || query.select || '';

      const exec = async () => {
        const includePassword = selectFields.includes('+password') || query.select?.includes('+password');
        const emailQuery = query.email ? query.email.toLowerCase() : null;
        const usernameQuery = query.username ? query.username.toLowerCase() : null;

        for (const [id, user] of mockUsers) {
          let matches = false;

          if (query.$or && Array.isArray(query.$or)) {
            matches = query.$or.some((cond) => {
              if (cond.email && user.email?.toLowerCase() === cond.email.toLowerCase()) return true;
              if (cond.username && user.username?.toLowerCase() === cond.username.toLowerCase()) return true;
              if (cond._id && user._id === cond._id) return true;
              return false;
            });
          } else if (emailQuery && user.email?.toLowerCase() === emailQuery) {
            matches = true;
          } else if (usernameQuery && user.username?.toLowerCase() === usernameQuery) {
            matches = true;
          } else if (query._id && user._id === query._id) {
            matches = true;
          }

          if (matches) {
            return {
              ...user,
              matchPassword: async (p) => {
                if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
                  return await bcrypt.compare(p, user.password);
                }
                return user.password === p;
              },
              password: includePassword ? user.password : undefined,
            };
          }
        }
        return null;
      };

      const promise = exec();
      promise.select = (fields) => {
        selectFields = fields;
        return exec();
      };
      return promise;
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
      mockUsers.set(user._id, {
        _id: user._id,
        username: user.username,
        email: user.email,
        password: user.password,
      });
      persistToDisk();
      return user;
    },

    findById(id) {
      let selectFields = '';
      const exec = async () => {
        const user = mockUsers.get(id);
        if (!user) return null;
        const includePassword = selectFields.includes('+password');
        return {
          ...user,
          matchPassword: async (p) => {
            if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
              return await bcrypt.compare(p, user.password);
            }
            return user.password === p;
          },
          password: includePassword ? user.password : undefined,
        };
      };
      const promise = exec();
      promise.select = (fields) => {
        selectFields = fields;
        return exec();
      };
      return promise;
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
      persistToDisk();
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
      persistToDisk();
      return task;
    },

    async findByIdAndUpdate(id, updates) {
      const task = mockTasks.get(id);
      if (!task) return null;
      Object.assign(task, updates);
      task.updatedAt = new Date();
      persistToDisk();
      return task;
    },

    async findByIdAndDelete(id) {
      const task = mockTasks.get(id);
      if (!task) return null;
      mockTasks.delete(id);
      persistToDisk();
      return task;
    },
  },

  isMockMode: true,
};

module.exports = { mockStorage };
