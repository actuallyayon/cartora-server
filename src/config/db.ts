import dns from 'node:dns';
import mongoose from 'mongoose';
import { env, isProduction } from '@/config/env';

// Some networks' default DNS resolver refuses the SRV lookups that
// `mongodb+srv://` requires. When DNS_SERVERS is set, use those resolvers instead.
if (env.DNS_SERVERS.length > 0) {
  dns.setServers(env.DNS_SERVERS);
}

/**
 * MongoDB connection helper.
 *
 * On serverless platforms (Vercel) the same container can handle many requests,
 * so we cache the connection promise on `globalThis` and reuse a warm connection
 * instead of dialing a new one per invocation (which exhausts Atlas connections).
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as typeof globalThis & {
  __cartoraMongoose?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.__cartoraMongoose ?? {
  conn: null,
  promise: null,
};
globalForMongoose.__cartoraMongoose = cache;

let listenersBound = false;

const bindConnectionEvents = (): void => {
  if (listenersBound) return;
  listenersBound = true;

  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB connected [${mongoose.connection.name}]`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
};

export const connectDB = async (): Promise<typeof mongoose> => {
  if (cache.conn) return cache.conn;

  // Fail fast rather than buffering queries indefinitely when the DB is down.
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);

  if (!cache.promise) {
    bindConnectionEvents();
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      autoIndex: !isProduction, // build indexes in dev; manage explicitly in prod
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
};

export const disconnectDB = async (): Promise<void> => {
  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
};

/** Human-readable connection state, surfaced by the health endpoint. */
export const getDBState = (): 'disconnected' | 'connected' | 'connecting' | 'disconnecting' => {
  const states: Record<number, 'disconnected' | 'connected' | 'connecting' | 'disconnecting'> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] ?? 'disconnected';
};
