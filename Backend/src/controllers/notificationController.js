import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/helpers.js';
import { hiddenNotificationClause, SECURITY_NOTIFICATION_TYPES } from '../utils/authAudit.js';

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SECURITY_TYPES = [...SECURITY_NOTIFICATION_TYPES];

function resolveDateRange({ range = '', from = '', to = '' } = {}) {
  const now = new Date();
  let start = null;
  let end = null;

  if (range === 'today') {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (range === 'yesterday') {
    start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setHours(23, 59, 59, 999);
  } else if (range === 'last_7_days') {
    start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (range === 'last_30_days') {
    start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else {
    if (from) {
      start = new Date(from);
      if (!Number.isNaN(start.getTime())) start.setHours(0, 0, 0, 0);
      else start = null;
    }
    if (to) {
      end = new Date(to);
      if (!Number.isNaN(end.getTime())) end.setHours(23, 59, 59, 999);
      else end = null;
    }
  }

  return { start, end };
}

function buildNotificationFilter(req) {
  const {
    search = '',
    filter = '',
    status = '',
    role = '',
    range = '',
    from = '',
    to = '',
    unread = '',
    type = '',
  } = req.query;

  const securityOnly = String(req.query.security || '').trim() === '1';
  const query = {
    user: req.user._id,
    ...hiddenNotificationClause(),
  };

  if (securityOnly) {
    query.type = {
      $in: SECURITY_TYPES,
      $nin: hiddenNotificationClause().type.$nin,
    };
  }

  if (String(unread).trim() === '1' || String(filter).trim() === 'unread') {
    query.isRead = false;
  } else if (String(filter).trim() === 'read') {
    query.isRead = true;
  }

  if (String(type).trim() && !securityOnly) {
    query.type = String(type).trim();
  }

  if (String(filter).trim() === 'successful') {
    query.status = 'success';
  } else if (String(filter).trim() === 'failed') {
    query.status = 'failed';
  } else if (String(filter).trim() === 'security') {
    query.type = { $in: ['security_alert', 'account_deactivated'] };
  }

  if (String(status).trim()) {
    query.status = String(status).trim().toLowerCase();
  }

  if (String(role).trim()) {
    query.actorRole = String(role).trim().toLowerCase();
  }

  const { start, end } = resolveDateRange({ range, from, to });
  if (start || end) {
    query.createdAt = {};
    if (start) query.createdAt.$gte = start;
    if (end) query.createdAt.$lte = end;
    if (!Object.keys(query.createdAt).length) delete query.createdAt;
  }

  if (String(search).trim()) {
    const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
    query.$or = [
      { title: regex },
      { message: regex },
      { actorName: regex },
      { email: regex },
      { alertAction: regex },
      { ipAddress: regex },
      { accessSource: regex },
    ];
  }

  return query;
}

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
    ...hiddenNotificationClause(),
  });

  return res.json({
    success: true,
    data: { unreadCount },
  });
});

export const getMyNotifications = asyncHandler(async (req, res) => {
  const securityOnly = String(req.query.security || '').trim() === '1';
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;
  const filter = buildNotificationFilter(req);

  const [notifications, total, unreadCount, securityUnreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({
      user: req.user._id,
      isRead: false,
      ...hiddenNotificationClause(),
    }),
    Notification.countDocuments({
      user: req.user._id,
      isRead: false,
      type: { $in: SECURITY_TYPES },
      alertAction: hiddenNotificationClause().alertAction,
    }),
  ]);

  return res.json({
    success: true,
    data: {
      unreadCount: securityOnly ? securityUnreadCount : unreadCount,
      securityUnreadCount,
      notifications: notifications.map((item) => item.toClientObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found.',
    });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
    ...hiddenNotificationClause(),
  });

  return res.json({
    success: true,
    message: 'Notification marked as read.',
    data: { notification: notification.toClientObject(), unreadCount },
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const securityOnly = String(req.query.security || '').trim() === '1';
  const filter = {
    user: req.user._id,
    isRead: false,
  };

  if (securityOnly) {
    filter.type = { $in: SECURITY_TYPES };
  }

  await Notification.updateMany(filter, {
    $set: { isRead: true, readAt: new Date() },
  });

  return res.json({
    success: true,
    message: 'All notifications marked as read.',
    data: { unreadCount: 0 },
  });
});
