const mongoose = require('mongoose');
const { mockStorage } = require('./mockStorage');

let useMockMode = false;

// Initialize DB mode
const initDBMode = () => {
  const mongoUri = process.env.MONGO_URI;
  // Check if mongoose is connected
  if (mongoose.connection.readyState !== 1) {
    useMockMode = true;
    console.log('ℹ️  Database mode: MOCK (in-memory storage)');
  } else {
    useMockMode = false;
    console.log('ℹ️  Database mode: MONGODB');
  }
};

// Get models based on current mode
const getModels = () => {
  if (useMockMode) {
    return mockStorage;
  }
  return {
    User: require('../models/User'),
    Board: require('../models/Board'),
    Task: require('../models/Task'),
  };
};

module.exports = {
  initDBMode,
  getModels,
  isMockMode: () => useMockMode,
  setMockMode: (value) => {
    useMockMode = value;
  },
};
