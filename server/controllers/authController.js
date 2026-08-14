const User = require('../models/User');
const Board = require('../models/Board');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, boardId) => {
  return jwt.sign({ id, boardId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check for empty fields
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with that email' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      // Auto-create a default board for the new user
      const board = await Board.create({
        name: `${username}'s Board`,
        description: 'My default CollabBoard',
        owner: user._id,
        members: [user._id],
      });

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for email and password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
// Find user's default board
const board = await Board.findOne({ owner: user._id });

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
  success: true,
  _id: user._id,
  username: user.username,
  email: user.email,
  token: generateToken(user._id),
  boardId: board ? board._id : null,
});
    
    
    
    
    
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const board = await Board.findOne({ owner: req.user.id });
    res.status(200).json({
      success: true,
      data: { ...user.toObject(), boardId: board ? board._id : null },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
