const jwt = require('jsonwebtoken');
const { getModels } = require('../utils/dbProvider');
const { mockStorage } = require('../utils/mockStorage');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');

      // Get user from the token
      const { User } = getModels();
      let user = null;
      try {
        const q = User.findById(decoded.id);
        if (q && typeof q.select === 'function') {
          user = await q.select('-password');
        } else {
          user = await q;
        }
      } catch (e) {}

      if (!user) {
        user = await mockStorage.User.findById(decoded.id);
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
      }

      req.user = user;
      if (!req.user.id && req.user._id) {
        req.user.id = req.user._id.toString();
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};
