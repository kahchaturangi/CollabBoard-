const { getModels, isMockMode } = require('../utils/dbProvider');
const jwt = require('jsonwebtoken');
const { mockStorage } = require('../utils/mockStorage');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id, boardId) => {
  return jwt.sign({ id, boardId }, process.env.JWT_SECRET || 'secretkey123', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { User, Board } = getModels();
    let { username, email, password } = req.body;

    // Check for empty fields
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    username = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existing = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: username },
      ],
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with that email or username' });
    }

    // Create user in active DB
    const user = await User.create({
      username,
      email: normalizedEmail,
      password,
    });

    if (user) {
      // Auto-create a default board for the new user
      let board = await Board.findOne({ owner: user._id });
      if (!board) {
        board = await Board.create({
          name: `${username}'s Board`,
          description: 'My default CollabBoard',
          owner: user._id,
          members: [user._id],
        });
      }

      // Also ensure mockStorage / local_db.json is updated as persistent backup
      try {
        await mockStorage.User.create({
          username: user.username,
          email: user.email,
          password: user.password || password,
        });
        await mockStorage.Board.create({
          name: board.name,
          description: board.description,
          owner: user._id,
          members: [user._id],
        });
      } catch (backupErr) {
        // Non-blocking backup
      }

      res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        boardId: board._id,
        token: generateToken(user._id, board._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { User, Board } = getModels();
    const { email, password } = req.body;

    // Check for email and password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or username and password' });
    }

    const inputIdentifier = email.trim();
    const normalizedEmail = inputIdentifier.toLowerCase();

    // Query user by email OR username with password included
    let user = null;
    try {
      const q = User.findOne({
        $or: [
          { email: normalizedEmail },
          { username: inputIdentifier },
        ],
      });
      if (q && typeof q.select === 'function') {
        user = await q.select('+password');
      } else {
        user = await q;
      }
    } catch (err) {
      console.warn('Primary DB findOne error:', err.message);
    }

    // Fallback: Check mockStorage / local_db if not found in primary DB
    if (!user) {
      const fallbackUser = await mockStorage.User.findOne({
        $or: [
          { email: normalizedEmail },
          { username: inputIdentifier },
        ],
        select: '+password',
      });

      if (fallbackUser) {
        const isFallbackMatch = await fallbackUser.matchPassword(password);
        if (isFallbackMatch) {
          user = fallbackUser;
          // If MongoDB is running, auto-sync this user into MongoDB
          if (!isMockMode()) {
            try {
              const MongoUser = require('../models/User');
              const MongoBoard = require('../models/Board');
              let syncedUser = await MongoUser.findOne({ email: fallbackUser.email.toLowerCase() }).select('+password');
              if (!syncedUser) {
                let passwordHash = fallbackUser.password;
                if (!passwordHash.startsWith('$2a$') && !passwordHash.startsWith('$2b$')) {
                  const salt = await bcrypt.genSalt(10);
                  passwordHash = await bcrypt.hash(passwordHash, salt);
                }
                syncedUser = new MongoUser({
                  username: fallbackUser.username,
                  email: fallbackUser.email.toLowerCase(),
                });
                syncedUser.password = passwordHash;
                await syncedUser.save({ validateBeforeSave: false });

                await MongoBoard.create({
                  name: `${syncedUser.username}'s Board`,
                  description: 'My default CollabBoard',
                  owner: syncedUser._id,
                  members: [syncedUser._id],
                });
              }
              user = syncedUser;
            } catch (syncErr) {
              console.warn('Auto-sync to MongoDB error:', syncErr.message);
            }
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Find user's default board
    let board = await Board.findOne({ owner: user._id });
    if (!board) {
      board = await Board.create({
        name: `${user.username}'s Board`,
        description: 'My default CollabBoard',
        owner: user._id,
        members: [user._id],
      });
    }

    res.status(200).json({
      success: true,
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id, board ? board._id : null),
      boardId: board ? board._id : null,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const { User, Board } = getModels();
    let user = await User.findById(req.user.id);
    if (!user) {
      user = await mockStorage.User.findById(req.user.id);
    }
    const board = await Board.findOne({ owner: req.user.id });
    res.status(200).json({
      success: true,
      data: { ...user, boardId: board ? board._id : null },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
