import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { createNotification } from './helpers.js';

const REPEATING_TYPES = new Set([
  'investigation_update',
  'investigation_update_admin',
  'investigation_progress',
  'investigation_started_admin',
  'investigation_completed_admin',
  'evidence_added',
  'admin_sms',
  'permissions_updated',
  'permissions_updated_admin',
  'police_profile_updated',
  'staff_user_updated',
  'complaint_status_changed',
  'ob_status_officer',
]);

export function complaintPath(complaintId) {
  return complaintId ? `/complaints?id=${complaintId}` : '/complaints';
}

export function obPath(obId, { forPolice = false } = {}) {
  if (!obId) return '/ob-records';
  return forPolice ? `/ob-records/${obId}` : `/ob-records?id=${obId}`;
}

export function citizenPath(userId) {
  return userId ? `/citizens/${userId}` : '/citizens';
}

export function staffUserPath(userId) {
  return userId ? `/settings/users?id=${userId}` : '/settings/users';
}

export function actorFields(actor) {
  if (!actor) return {};
  return {
    actorName: actor.name || '',
    actorRole: actor.role || '',
    email: actor.email || '',
  };
}

async function alreadyNotified(payload) {
  const filter = {
    user: payload.userId,
    type: payload.type,
  };

  if (payload.relatedComplaint) filter.relatedComplaint = payload.relatedComplaint;
  if (payload.relatedOB) filter.relatedOB = payload.relatedOB;
  if (payload.relatedUser) filter.relatedUser = payload.relatedUser;

  if (REPEATING_TYPES.has(payload.type)) {
    filter.createdAt = { $gte: new Date(Date.now() - 45_000) };
  }

  return Notification.findOne(filter).select('_id').lean();
}

export async function notifyUser(payload, { dedupe = true } = {}) {
  if (!payload?.userId) return null;

  try {
    if (dedupe) {
      const existing = await alreadyNotified(payload);
      if (existing) return existing;
    }
    return await createNotification(payload);
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
}

export async function notifyAdmins(payload, { excludeUserId } = {}) {
  const users = await User.find({ role: 'admin', isActive: true }).select('_id');
  await Promise.all(
    users
      .filter(
        (user) => !excludeUserId || user._id.toString() !== String(excludeUserId)
      )
      .map((user) => notifyUser({ ...payload, userId: user._id }))
  );
}
