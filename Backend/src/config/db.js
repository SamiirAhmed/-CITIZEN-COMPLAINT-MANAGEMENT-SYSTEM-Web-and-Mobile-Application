import mongoose from 'mongoose';
import OBRecord from '../models/OBRecord.js';

export const DB_NAME = 'Citizen_Police_Portal';

const SERVICE_UNAVAILABLE_MESSAGE =
  'Authentication service is temporarily unavailable. Please try again.';

const MAX_CONNECT_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 2000;
const RECONNECT_DELAY_MS = 3000;

const connectOptions = {
  dbName: DB_NAME,
  serverSelectionTimeoutMS: 15000,
  family: 4,
};

mongoose.set('bufferCommands', false);

let listenersBound = false;
let reconnectTimer = null;
let reconnecting = false;

const maskMongoUri = (uri) =>
  String(uri || '').replace(
    /(mongodb(?:\+srv)?:\/\/)([^:@/]+):([^@/]+)@/i,
    '$1$2:****@'
  );

export const classifyMongoError = (error) => {
  const message = String(error?.message || '');
  const code = String(error?.code || '');
  const name = String(error?.name || '');

  if (
    /querySrv|ENOTFOUND|ESERVFAIL|getaddrinfo/i.test(message) ||
    (code === 'ECONNREFUSED' && /querySrv|_mongodb\._tcp/i.test(message))
  ) {
    return 'DNS/SRV error';
  }

  if (
    /authentication failed|bad auth|invalid credentials|auth failed/i.test(
      message
    ) ||
    error?.code === 18 ||
    error?.codeName === 'AuthenticationFailed'
  ) {
    return 'Authentication error';
  }

  if (/tls|ssl|certificate/i.test(message)) {
    return 'TLS error';
  }

  if (
    /paused|cluster.*unavailable|maintenance/i.test(message) ||
    name === 'MongoServerSelectionError'
  ) {
    return 'Cluster unavailable';
  }

  if (/whitelist|ip address/i.test(message)) {
    return 'Network error (verify Atlas cluster is active and Network Access allows your environment)';
  }

  if (
    /server selection timed out|could not connect|ECONNREFUSED|ETIMEDOUT|network/i.test(
      message
    )
  ) {
    return 'Network error';
  }

  return 'Network error';
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scheduleReconnect = () => {
  if (reconnectTimer || reconnecting || isDbReady()) return;

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    reconnecting = true;
    try {
      const uri = process.env.MONGO_URI;
      if (!uri) return;

      console.warn('Attempting MongoDB reconnect...');
      await mongoose.connect(uri, connectOptions);
      console.log(`MongoDB reconnected (${DB_NAME})`);
    } catch (error) {
      console.error(`MongoDB reconnect failed: ${classifyMongoError(error)}`);
      scheduleReconnect();
    } finally {
      reconnecting = false;
    }
  }, RECONNECT_DELAY_MS);
};

const bindConnectionEvents = () => {
  if (listenersBound) return;
  listenersBound = true;

  mongoose.connection.on('connected', () => {
    console.log(`MongoDB connected successfully (${DB_NAME})`);
  });

  mongoose.connection.on('error', (error) => {
    console.error(
      `MongoDB connection error: ${classifyMongoError(error)} (${error.message})`
    );
  });

  mongoose.connection.on('disconnected', () => {
    console.error('MongoDB disconnected');
    scheduleReconnect();
  });
};

export const isDbReady = () => mongoose.connection.readyState === 1;

export const isDatabaseError = (error) => {
  const name = String(error?.name || '');
  const message = String(error?.message || '');
  return (
    name === 'MongooseError' ||
    name === 'MongoServerError' ||
    name === 'MongoNetworkError' ||
    name === 'MongoTimeoutError' ||
    name === 'MongoServerSelectionError' ||
    /buffering timed out|ECONNREFUSED|ENOTFOUND|getaddrinfo|server selection timed out|failed to connect|topology is closed|not connected/i.test(
      message
    )
  );
};

export const databaseUnavailableMessage = () => SERVICE_UNAVAILABLE_MESSAGE;

export const requireDatabase = (req, res, next) => {
  if (isDbReady()) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: SERVICE_UNAVAILABLE_MESSAGE,
  });
};

const resetMongooseConnection = async () => {
  if (mongoose.connection.readyState === 0) return;
  try {
    await mongoose.disconnect();
  } catch {
    // Ignore disconnect errors between retries.
  }
};

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not configured.');
  }

  bindConnectionEvents();

  let lastError;

  for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt += 1) {
    try {
      if (attempt === 1) {
        console.log(`Connecting to MongoDB (${maskMongoUri(uri)})...`);
      } else {
        console.warn(`MongoDB retry attempt ${attempt}/${MAX_CONNECT_ATTEMPTS}...`);
      }

      await mongoose.connect(uri, connectOptions);

      if (!isDbReady()) {
        throw new Error('MongoDB connection did not become ready.');
      }

      try {
        const indexes = await OBRecord.collection.indexes();
        for (const index of indexes) {
          const keys = Object.keys(index.key || {});
          if (
            keys.length === 1 &&
            keys[0] === 'complaint' &&
            index.unique &&
            index.name !== 'complaint_unique_when_set'
          ) {
            await OBRecord.collection.dropIndex(index.name);
            console.log(`Dropped legacy OB index: ${index.name}`);
          }
        }
        await OBRecord.syncIndexes();
      } catch (err) {
        console.warn('OB index sync warning:', err.message);
      }

      return true;
    } catch (error) {
      lastError = error;
      const kind = classifyMongoError(error);
      console.error(`MongoDB connection failed: ${kind}`);

      if (attempt < MAX_CONNECT_ATTEMPTS) {
        await resetMongooseConnection();
        await sleep(RETRY_BASE_DELAY_MS * attempt);
      }
    }
  }

  const kind = classifyMongoError(lastError);
  throw new Error(`MongoDB connection failed: ${kind}`);
};
