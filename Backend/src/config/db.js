import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.log('No MONGO_URI provided. Skipping MongoDB connection.');
    return false;
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected successfully');
  return true;
};
