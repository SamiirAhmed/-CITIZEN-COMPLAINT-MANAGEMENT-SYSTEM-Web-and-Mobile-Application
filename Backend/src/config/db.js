import mongoose from 'mongoose';

export const DB_NAME = 'Citizen_Police_Portal';

const SERVICE_UNAVAILABLE_MESSAGE =
  'Authentication service is temporarily unavailable. Please try again.';

mongoose.set('bufferCommands', false);

let listenersBound = false;

const bindConnectionEvents = () => {
  if (listenersBound) return;
  listenersBound = true;

  mongoose.connection.on('connected', () => {
    console.log(`MongoDB connected (${DB_NAME})`);
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.error('MongoDB disconnected');
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
    /buffering timed out|ECONNREFUSED|server selection timed out|failed to connect|topology is closed|not connected/i.test(
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

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not configured.');
  }

  bindConnectionEvents();

  await mongoose.connect(uri, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 8000,
  });

  if (!isDbReady()) {
    throw new Error('MongoDB connection did not become ready.');
  }

  return true;
};
