const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kirana_store';
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ WARNING: MONGODB_URI environment variable is not set!');
    }
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('Checklist:');
    console.error(' 1. In MongoDB Atlas -> Network Access, add 0.0.0.0/0 (Allow access from anywhere).');
    console.error(' 2. Ensure your MONGODB_URI in Render Environment Variables has the correct username and password.');
    console.error(' 3. Ensure special characters in password are URL-encoded.');
  }
};

module.exports = connectDB;
