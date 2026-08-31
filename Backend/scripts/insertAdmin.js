import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

dotenv.config();

const adminUser = {
  name: 'System Administrator',
  email: 'admin@spf.gov.so',
  password: 'admin123',
  role: 'admin',
  phone: '0610000001',
  niraId: '10000000001',
  badgeNumber: 'ADM-001',
  station: 'HQ Mogadishu',
  tell: '0610000001',
};

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing in Backend/.env');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  let user = await User.findOne({ email: adminUser.email }).select('+password');
  if (user) {
    user.password = adminUser.password;
    user.role = 'admin';
    user.isActive = true;
    user.name = adminUser.name;
    user.phone = adminUser.phone;
    user.badgeNumber = adminUser.badgeNumber;
    user.station = adminUser.station;
    await user.save();
    console.log(`Updated admin: ${user.email} (${user._id})`);
  } else {
    user = await User.create(adminUser);
    console.log(`Inserted admin: ${user.email} (${user._id})`);
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
