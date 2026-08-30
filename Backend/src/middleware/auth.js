import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { databaseUnavailableMessage, isDatabaseError, isDbReady } from '../config/db.js';

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7).trim();
};

export const protect = async (req, res, next) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({
        success: false,
        message: databaseUnavailableMessage(),
      });
    }

    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Session is invalid. Please log in again.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (isDatabaseError(error)) {
      console.error('Auth database error:', error.message);
      return res.status(503).json({
        success: false,
        message: databaseUnavailableMessage(),
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please log in again.',
    });
  }
};

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action.',
      });
    }
    return next();
  };

export const citizenOnly = [protect, authorize('citizen')];
export const staffOnly = [protect, authorize('admin', 'police')];
export const adminOnly = [protect, authorize('admin')];
