const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'local_db.json');

/**
 * Synchronize local_db.json with MongoDB so accounts created in mock mode
 * are available in MongoDB, and vice versa.
 */
async function syncDatabaseWithDisk() {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const User = require('../models/User');
    const Board = require('../models/Board');
    const Task = require('../models/Task');
    const { mockStorage } = require('./mockStorage');

    // 1. Load local_db.json into MongoDB if missing
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf-8');
      const data = JSON.parse(raw);

      if (Array.isArray(data.users)) {
        for (const [id, localUser] of data.users) {
          if (!localUser.email) continue;
          const emailLower = localUser.email.toLowerCase().trim();
          
          let existingUser = await User.findOne({ email: emailLower }).select('+password');
          if (!existingUser) {
            // Need to save into MongoDB
            console.log(`🔄 Syncing local user ${localUser.username} (${emailLower}) to MongoDB...`);
            const userDoc = new User({
              username: localUser.username,
              email: emailLower,
              password: localUser.password,
            });
            await userDoc.save();

            // Check or create default board for user
            let board = await Board.findOne({ owner: userDoc._id });
            if (!board) {
              await Board.create({
                name: `${userDoc.username}'s Board`,
                description: 'My default CollabBoard',
                owner: userDoc._id,
                members: [userDoc._id],
              });
            }
          }
        }
      }
    }

    // 2. Also export current MongoDB users to local_db.json / mockStorage so mock mode always has them
    const mongoUsers = await User.find({}).select('+password');
    const mongoBoards = await Board.find({});
    const mongoTasks = await Task.find({});

    for (const u of mongoUsers) {
      mockStorage.User.create({
        username: u.username,
        email: u.email,
        password: u.password,
      }).catch(() => {});
    }

    console.log(`✅ Data synchronization complete. (MongoDB Users: ${mongoUsers.length})`);
  } catch (err) {
    console.error('Error synchronizing database with disk storage:', err);
  }
}

module.exports = { syncDatabaseWithDisk };
