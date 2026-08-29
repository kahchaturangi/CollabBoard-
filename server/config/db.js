const mongoose = require('mongoose');
const { setMockMode } = require('../utils/dbProvider');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    setMockMode(false);
    const { syncDatabaseWithDisk } = require('../utils/syncStorage');
    await syncDatabaseWithDisk();
  } catch (error) {
    console.warn(`⚠️  MongoDB Connection Failed: ${error.message}`);
    console.log('📦 Running in MOCK mode without persistent database storage');
    console.log('   To enable MongoDB, install it or set MONGO_URI to a valid connection string');
    setMockMode(true);
    // Don't exit - allow the server to run in mock mode
  }
};

module.exports = connectDB;
