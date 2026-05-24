const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<')) {
    console.warn('MongoDB connection skipped: set a real MONGO_URI in server/.env to enable auth persistence.');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
