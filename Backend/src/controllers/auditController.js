import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/helpers.js';

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const AUTH_ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'PASSWORD_CHANGE_REQUIRED',
  'LOGIN',
];

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

function buildAuditFilter(query = {}) {
  const {
    search = '',
    action = '',
    status = '',
    role = '',
    recordType = '',
    accessSource = '',
    category = '',
    from = '',
    to = '',
    range = '',
  } = query;

  const filter = {};

  if (String(category).trim() === 'auth') {
    filter.action = { $in: AUTH_ACTIONS };
  } else if (String(action).trim()) {
    const normalized = String(action).trim().toUpperCase();
    filter.action = normalized === 'LOGIN_SUCCESS' ? { $in: ['LOGIN_SUCCESS', 'LOGIN'] } : normalized;
  }

  if (String(status).trim()) {
    filter.status = String(status).trim().toLowerCase();
  }

  if (String(role).trim()) {
    filter.actorRole = String(role).trim().toLowerCase();
  }

  if (String(recordType).trim()) {
    filter.recordType = String(recordType).trim();
  }

  if (String(accessSource).trim()) {
    filter.accessSource = new RegExp(escapeRegex(String(accessSource).trim()), 'i');
  }

  const { start, end } = resolveDateRange({ range, from, to });
  if (start || end) {
    filter.createdAt = {};
    if (start) filter.createdAt.$gte = start;
    if (end) filter.createdAt.$lte = end;
    if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
  }

  if (String(search).trim()) {
    const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [
      { actorName: regex },
      { email: regex },
      { action: regex },
      { recordLabel: regex },
      { recordType: regex },
      { recordId: regex },
      { details: regex },
      { previousValue: regex },
      { newValue: regex },
      { ipAddress: regex },
      { accessSource: regex },
      { browser: regex },
      { device: regex },
      { operatingSystem: regex },
    ];
  }

  return filter;
}

export const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const sortField = String(req.query.sortField || 'createdAt');
  const sortDir = String(req.query.sortDir || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const allowedSort = new Set([
    'createdAt',
    'actorName',
    'action',
    'status',
    'actorRole',
  ]);
  const sortKey = allowedSort.has(sortField) ? sortField : 'createdAt';

  const filter = buildAuditFilter(req.query);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ [sortKey]: sortDir }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: {
      logs: logs.map((item) => item.toClientObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

export const getAuditLogById = asyncHandler(async (req, res) => {
  const log = await AuditLog.findById(req.params.id);

  if (!log) {
    return res.status(404).json({
      success: false,
      message: 'Audit log not found.',
    });
  }

  return res.json({
    success: true,
    data: {
      log: log.toClientObject(),
    },
  });
});

export const getAuthTimeline = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = buildAuditFilter({ ...req.query, category: 'auth' });

  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit);

  return res.json({
    success: true,
    data: {
      events: logs.map((item) => item.toClientObject()),
    },
  });
});
