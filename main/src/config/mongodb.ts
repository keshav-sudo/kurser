import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});
