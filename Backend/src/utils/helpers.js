import jwt from 'jsonwebtoken';
import Complaint from '../models/Complaint.js';
import OBRecord from '../models/OBRecord.js';
import Notification from '../models/Notification.js';

export const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'general',
  relatedComplaint = null,
  relatedOB = null,
}) => {
  if (!userId) return null;

  return Notification.create({
    user: userId,
    title,
    message,
    type,
    relatedComplaint,
    relatedOB,
  });
};

export const generateComplaintNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;
  const latest = await Complaint.findOne({
    complaintNumber: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .select('complaintNumber');

  let next = 1;
  if (latest?.complaintNumber) {
    const parts = latest.complaintNumber.split('-');
    const last = Number(parts[2]);
    if (!Number.isNaN(last)) {
      next = last + 1;
    }
  }

  return `${prefix}${String(next).padStart(5, '0')}`;
};

export const generateOBNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `OB-${year}-`;
  const latest = await OBRecord.findOne({
    obNumber: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .select('obNumber');

  let next = 1;
  if (latest?.obNumber) {
    const parts = latest.obNumber.split('-');
    const last = Number(parts[2]);
    if (!Number.isNaN(last)) {
      next = last + 1;
    }
  }

  return `${prefix}${String(next).padStart(5, '0')}`;
};

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
