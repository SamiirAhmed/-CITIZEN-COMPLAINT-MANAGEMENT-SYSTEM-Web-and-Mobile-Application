import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/helpers.js';

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listAuditLogs = asyncHandler(async (req, res) => {
  const {
    search = '',
    action = '',
    role = '',
    recordType = '',
    from = '',
    to = '',
  } = req.query;

  const filter = {};

  if (String(action).trim()) {
    filter.action = String(action).trim().toUpperCase();
  }

  if (String(role).trim()) {
    filter.actorRole = String(role).trim().toLowerCase();
  }

  if (String(recordType).trim()) {
    filter.recordType = String(recordType).trim();
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const start = new Date(from);
      if (!Number.isNaN(start.getTime())) filter.createdAt.$gte = start;
    }
    if (to) {
      const end = new Date(to);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
  }

  if (String(search).trim()) {
    const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [
      { actorName: regex },
      { action: regex },
      { recordLabel: regex },
      { recordType: regex },
      { details: regex },
      { previousValue: regex },
      { newValue: regex },
    ];
  }

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(300);

  return res.json({
    success: true,
    data: {
      logs: logs.map((item) => item.toClientObject()),
    },
  });
});
