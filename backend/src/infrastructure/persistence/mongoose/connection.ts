import mongoose from 'mongoose';
import { env } from '../../../config/env.js';

export async function connectMongo(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log(`[mongo] connected to ${env.mongoUri}`);
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
