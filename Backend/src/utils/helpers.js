import jwt from 'jsonwebtoken';
import Complaint from '../models/Complaint.js';
import OBRecord from '../models/OBRecord.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'general',
  status = 'info',
  alertAction = '',
  actorName = '',
  actorRole = '',
  email = '',
  ipAddress = '',
  accessSource = '',
  failureReason = '',
  relatedComplaint = null,
  relatedOB = null,
  relatedUser = null,
  linkPath = '',
}) => {
  if (!userId) return null;

  try {
    return await Notification.create({
      user: userId,
      title,
      message,
      type,
      status,
      alertAction,
      actorName,
      actorRole,
      email,
      ipAddress,
      accessSource,
      failureReason,
      relatedComplaint,
      relatedOB,
      relatedUser,
      linkPath: linkPath || '',
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

export const notifyRole = async (role, payload, { excludeUserId } = {}) => {
  const users = await User.find({ role, isActive: true }).select('_id');
  await Promise.all(
    users
      .filter(
        (user) =>
          !excludeUserId || user._id.toString() !== String(excludeUserId)
      )
      .map((user) => createNotification({ ...payload, userId: user._id }))
  );
};

export const createAuditLog = async ({
  actor = null,
  email = '',
  action,
  status = '',
  recordType = '',
  recordId = '',
  recordLabel = '',
  previousValue = '',
  newValue = '',
  details = '',
  ipAddress = '',
  userAgent = '',
  device = '',
  browser = '',
  operatingSystem = '',
  accessSource = '',
  location = '',
  actorName = '',
  actorRole = '',
}) => {
  if (!action) return null;

  try {
    return await AuditLog.create({
      actor: actor?._id || actor || null,
      actorName: actorName || actor?.name || 'System',
      actorRole: actorRole || actor?.role || '',
      email: email || actor?.email || '',
      action,
      status,
      recordType,
      recordId: recordId ? String(recordId) : '',
      recordLabel,
      previousValue:
        previousValue === undefined || previousValue === null
          ? ''
          : String(previousValue),
      newValue:
        newValue === undefined || newValue === null ? '' : String(newValue),
      details,
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
      device: device || '',
      browser: browser || '',
      operatingSystem: operatingSystem || '',
      accessSource: accessSource || '',
      location: location || 'Not available',
    });
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
    return null;
  }
};

export const getRequestIp = (req) =>
  req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  '';

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
