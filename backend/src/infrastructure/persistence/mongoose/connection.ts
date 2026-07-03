import mongoose from 'mongoose';
import { env } from '../../../config/env.js';
import { logger } from '../../logging/logger.js';

export async function connectMongo(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  logger.info({ component: 'mongo' }, 'connected to MongoDB');
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
