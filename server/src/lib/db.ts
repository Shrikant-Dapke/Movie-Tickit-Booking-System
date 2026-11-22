import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const connectDB = async (uri: string = env.MONGODB_URI): Promise<typeof mongoose> => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  return mongoose;
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const newObjectId = (): mongoose.Types.ObjectId => new mongoose.Types.ObjectId();
