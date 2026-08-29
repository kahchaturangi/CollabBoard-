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

      req.user = user;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};
