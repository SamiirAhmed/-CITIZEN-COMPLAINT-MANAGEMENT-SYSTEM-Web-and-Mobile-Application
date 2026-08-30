import User from '../models/User.js';
import SmsLog from '../models/SmsLog.js';
import { asyncHandler, createAuditLog, getRequestIp } from '../utils/helpers.js';
import { getRequestContext } from '../utils/requestContext.js';
import { actorFields, notifyUser } from '../utils/notifyEvent.js';
import {
  fetchSmsBalance,
  isSmsConfigured,
  isValidSomaliMobile,
  maskPhone,
  resolveUserPhone,
  sendTabaarakSms,
} from '../services/tabaarakSmsService.js';

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SMS_MAX_LENGTH = 500;
const SMS_SEGMENT_LENGTH = 160;

function buildMessagePreview(message = '') {
  const trimmed = String(message).trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}...`;
}

function toRecipientObject(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone || '',
    badgeNumber: user.badgeNumber || '',
    station: user.station || '',
    district: user.district || '',
    profileImage: user.profileImage || '',
    isActive: user.isActive !== false,
    role: user.role,
    hasValidPhone: isValidSomaliMobile(user.phone) || isValidSomaliMobile(user.tell),
  };
}

export const getSmsStats = asyncHandler(async (_req, res) => {
  const [policeTotal, policeActive, historyCount, policeUsers] = await Promise.all([
    User.countDocuments({ role: 'police' }),
    User.countDocuments({ role: 'police', isActive: true }),
    SmsLog.countDocuments(),
    User.find({ role: 'police' }).select('name').sort({ name: 1 }).limit(200),
  ]);

  return res.json({
    success: true,
    data: {
      policeTotal,
      policeActive,
      historyCount,
      policeUsers: policeUsers.map((user) => ({
        id: user._id.toString(),
        name: user.name,
      })),
    },
  });
});

export const getSmsBalance = asyncHandler(async (_req, res) => {
  if (!isSmsConfigured()) {
    return res.json({
      success: false,
      message:
        'SMS service is not configured. Set TABAARAK_SMS_USERNAME and TABAARAK_SMS_PASSWORD in Backend/.env, then restart the backend.',
      data: {
        balance: null,
        status: 'unavailable',
        provider: 'Tabaarak',
        configured: false,
      },
    });
  }

  try {
    const result = await fetchSmsBalance();
    return res.json({
      success: true,
      data: {
        balance: result.balance,
        status: result.status,
        provider: result.provider || 'Tabaarak',
        accountType: result.accountType || 'Prepaid',
        configured: true,
      },
    });
  } catch (error) {
    const code = error.code || 'SMS_BALANCE_FAILED';
    const message =
      code === 'SMS_NOT_CONFIGURED' || code === 'SMS_AUTH_FAILED' || code === 'SMS_UNAVAILABLE'
        ? error.message
        : 'Unable to retrieve Tabaarak SMS balance.';

    return res.json({
      success: false,
      message,
      data: { balance: null, status: 'unavailable', provider: 'Tabaarak', configured: true },
    });
  }
});

export const listSmsRecipients = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const { name = '', phone = '', search = '' } = req.query;

  const includeInactive = String(req.query.status || '') === 'all';
  const filter = { role: 'police' };
  if (!includeInactive) filter.isActive = true;

  const clauses = [];
  const combinedSearch = String(search || '').trim();
  const nameTerm = String(name || '').trim() || combinedSearch;
  const phoneTerm = String(phone || '').trim() || combinedSearch;

  if (combinedSearch) {
    const regex = new RegExp(escapeRegex(combinedSearch), 'i');
    const phoneRegex = new RegExp(escapeRegex(combinedSearch.replace(/\s+/g, '')), 'i');
    clauses.push({
      $or: [
        { name: regex },
        { phone: phoneRegex },
        { tell: phoneRegex },
        { badgeNumber: regex },
        { station: regex },
      ],
    });
  } else {
    if (nameTerm) {
      clauses.push({ name: new RegExp(escapeRegex(nameTerm), 'i') });
    }
    if (phoneTerm) {
      const phoneRegex = new RegExp(escapeRegex(phoneTerm.replace(/\s+/g, '')), 'i');
      clauses.push({
        $or: [{ phone: phoneRegex }, { tell: phoneRegex }],
      });
    }
  }

  if (clauses.length === 1) {
    Object.assign(filter, clauses[0]);
  } else if (clauses.length > 1) {
    filter.$and = clauses;
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: {
      recipients: users.map(toRecipientObject),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

export const sendSms = asyncHandler(async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const title = String(req.body?.title || '').trim();
  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a message.',
    });
  }

  if (message.length > SMS_MAX_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Message must be ${SMS_MAX_LENGTH} characters or fewer.`,
    });
  }

  if (!userIds.length) {
    return res.status(400).json({
      success: false,
      message: 'Select at least one Police recipient.',
    });
  }

  const uniqueIds = [...new Set(userIds.map((id) => String(id).trim()).filter(Boolean))];
  const policeUsers = await User.find({
    _id: { $in: uniqueIds },
    role: 'police',
    isActive: true,
  });

  const foundIds = new Set(policeUsers.map((user) => user._id.toString()));
  const invalidIds = uniqueIds.filter((id) => !foundIds.has(id));

  if (!policeUsers.length) {
    return res.status(400).json({
      success: false,
      message: 'No valid Police recipients were found.',
    });
  }

  const recipientResults = [];
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const sendable = [];

  for (const user of policeUsers) {
    const phone = resolveUserPhone(user);
    if (!isValidSomaliMobile(phone)) {
      skippedCount += 1;
      recipientResults.push({
        user: user._id,
        name: user.name,
        phoneMasked: maskPhone(phone),
        status: 'skipped',
        error: 'This Police user does not have a valid phone number.',
        providerRef: '',
      });
      continue;
    }
    sendable.push({ user, phone });
  }

  if (sendable.length) {
    try {
      const sendResult = await sendTabaarakSms(
        sendable.map((item) => item.phone),
        message
      );
      const delivered = sendResult.success || sendResult.acceptedForDelivery;
      for (const item of sendable) {
        if (delivered) {
          successCount += 1;
          recipientResults.push({
            user: item.user._id,
            name: item.user.name,
            phoneMasked: maskPhone(item.phone),
            status: 'sent',
            error: '',
            providerRef: '',
          });
        } else {
          failedCount += 1;
          recipientResults.push({
            user: item.user._id,
            name: item.user.name,
            phoneMasked: maskPhone(item.phone),
            status: 'failed',
            error: sendResult.error || 'SMS could not be sent.',
            providerRef: '',
          });
        }
      }
    } catch (error) {
      for (const item of sendable) {
        failedCount += 1;
        recipientResults.push({
          user: item.user._id,
          name: item.user.name,
          phoneMasked: maskPhone(item.phone),
          status: 'failed',
          error:
            error.code === 'SMS_NOT_CONFIGURED' ||
            error.code === 'SMS_AUTH_FAILED' ||
            error.code === 'SMS_UNAVAILABLE'
              ? error.message
              : 'SMS could not be sent.',
          providerRef: '',
        });
      }
    }
  }

  const recipientCount = recipientResults.length;
  let status = 'failed';
  if (successCount === recipientCount && recipientCount > 0) status = 'success';
  else if (successCount > 0) status = 'partial';

  const requestContext = getRequestContext(req);
  const lastLog = await SmsLog.findOne().sort({ msgNo: -1 }).select('msgNo');
  const smsLog = await SmsLog.create({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    msgNo: (lastLog?.msgNo || 0) + 1,
    title,
    message,
    messagePreview: buildMessagePreview(message),
    status,
    recipientCount,
    successCount,
    failedCount,
    skippedCount,
    recipients: recipientResults,
    ipAddress: getRequestIp(req),
  });

  const auditAction =
    status === 'success'
      ? 'SMS_SENT'
      : status === 'partial'
        ? 'SMS_PARTIALLY_SENT'
        : 'SMS_SEND_FAILED';

  await createAuditLog({
    actor: req.user,
    email: req.user.email,
    action: auditAction,
    status: status === 'success' ? 'success' : status === 'partial' ? 'partial' : 'failed',
    recordType: 'SMS',
    recordId: smsLog._id.toString(),
    recordLabel: `${successCount}/${recipientCount} recipients`,
    newValue: status === 'success' ? 'Successful' : status === 'partial' ? 'Partial' : 'Failed',
    details: `Recipients: ${recipientCount}, Successful: ${successCount}, Failed: ${failedCount + skippedCount}`,
    ipAddress: getRequestIp(req),
    userAgent: requestContext.userAgent,
    device: requestContext.device,
    browser: requestContext.browser,
    operatingSystem: requestContext.operatingSystem,
    accessSource: requestContext.accessSource,
  });

  let balance = null;
  let balanceStatus = 'unavailable';
  let accountType = '';
  try {
    const balanceResult = await fetchSmsBalance();
    balance = balanceResult.balance;
    balanceStatus = balanceResult.status;
    accountType = balanceResult.accountType || '';
  } catch {
    // Keep last known provider state; never invent a local deduction.
  }

  const firstError =
    recipientResults.find((item) => item.error)?.error || '';
  const responseMessage =
    status === 'success'
      ? 'SMS Sent Successfully'
      : status === 'partial'
        ? 'SMS Partially Sent'
        : firstError || 'SMS Could Not Be Sent';

  if (successCount > 0) {
    const preview = buildMessagePreview(message);
    await Promise.all(
      recipientResults
        .filter((item) => item.status === 'sent')
        .map((item) =>
          notifyUser({
            userId: item.user,
            title: title || 'SMS Message',
            message: preview,
            type: 'admin_sms',
            linkPath: '/profile',
            ...actorFields(req.user),
          })
        )
    );
  }

  return res.json({
    success: status !== 'failed',
    message: responseMessage,
    data: {
      status,
      recipientCount,
      successCount,
      failedCount: failedCount + skippedCount,
      skippedCount,
      invalidRecipientIds: invalidIds,
      recipients: recipientResults.map((item) => ({
        userId: item.user.toString(),
        name: item.name,
        phoneMasked: item.phoneMasked,
        status: item.status,
        error: item.error,
      })),
      smsLogId: smsLog._id.toString(),
      balance,
      balanceStatus,
      accountType,
      provider: 'Tabaarak',
    },
  });
});

export const listSmsHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
  const skip = (page - 1) * limit;
  const {
    dateFrom = '',
    dateTo = '',
    policeUser = '',
    status = '',
    search = '',
  } = req.query;

  const filter = {};

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!Number.isNaN(from.getTime())) {
        from.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = from;
      }
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }
    if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
  }

  if (['success', 'partial', 'failed'].includes(String(status))) {
    filter.status = status;
  }

  if (policeUser) {
    filter['recipients.user'] = policeUser;
  }

  if (String(search).trim()) {
    const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [
      { title: regex },
      { message: regex },
      { actorName: regex },
      { 'recipients.name': regex },
    ];
  }

  const [records, total] = await Promise.all([
    SmsLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SmsLog.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: {
      records: records.map((item, index) => {
        const client = item.toClientObject();
        return {
          ...client,
          displayNo: total - skip - index,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    },
  });
});
