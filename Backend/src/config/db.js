import mongoose from 'mongoose';
import OBRecord from '../models/OBRecord.js';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.log('No MONGO_URI provided. Skipping MongoDB connection.');
    return false;
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected successfully');

  // Drop legacy unique complaint index that blocks standalone OB creates (null duplicates)
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
};
