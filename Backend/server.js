import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { connectDB, isDbReady, isDatabaseError, requireDatabase } from './src/config/db.js';
import { seedStaffUsers } from './src/utils/seed.js';
import { seedComplaintCategories } from './src/utils/seedCategories.js';
import authRoutes from './src/routes/authRoutes.js';
import complaintRoutes from './src/routes/complaintRoutes.js';
import obRoutes from './src/routes/obRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import { UPLOADS_ROOT } from './src/middleware/uploadProfileImage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_ROOT));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/', (_req, res) => {
  res.json({
    name: 'Citizen Complaint Management API',
    status: 'running',
    version: '1.0.0',
  });
});

app.get('/api/health', (_req, res) => {
  const connected = isDbReady();
  return res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    message: connected
      ? 'Backend is running successfully'
      : 'Authentication service is temporarily unavailable. Please try again.',
    database: {
      connected,
      name: 'Citizen_Police_Portal',
    },
  });
});

app.use(requireDatabase);
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/ob', obRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}.`,
    });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(' '),
    });
  }

  if (isDatabaseError(err)) {
    console.error('Database error:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Authentication service is temporarily unavailable. Please try again.',
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: 'Unable to complete the request. Please try again.',
  });
});

const startServer = async () => {
  try {
    await connectDB();
    await seedStaffUsers();
    await seedComplaintCategories();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
