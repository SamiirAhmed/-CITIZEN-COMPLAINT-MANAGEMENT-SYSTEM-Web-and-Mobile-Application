import AuditLog from '../models/AuditLog.js';
import { createAuditLog, createNotification, notifyRole } from './helpers.js';
import { getRequestContext } from './requestContext.js';

const AUTH_ACTIONS = new Set([
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'PASSWORD_CHANGE_REQUIRED',
]);

const SECURITY_NOTIFICATION_TYPES = new Set([
  'login_success',
  'login_failed',
  'logout',
  'password_changed',
  'password_change_required',
  'account_activated',
  'account_deactivated',
  'security_alert',
]);

export { SECURITY_NOTIFICATION_TYPES };

const ALERT_TITLES = {
  LOGIN_SUCCESS: 'Successful Login',
  LOGIN_FAILED: 'Failed Login Attempt',
  LOGOUT: 'User Logged Out',
  PASSWORD_CHANGED: 'Password Changed',
  PASSWORD_CHANGE_REQUIRED: 'Password Change Required',
};

const isStaffPortalRequest = (accessSource = '') =>
  /admin web|police web|admin portal|police portal/i.test(accessSource);

export const shouldNotifyAdminsForFailedLogin = ({ user, accessSource }) => {
  if (user && (user.role === 'admin' || user.role === 'police')) return true;
  return isStaffPortalRequest(accessSource);
};

export const recordAuthAuditEvent = async (
  req,
  {
    actor = null,
    email = '',
    action,
    status = 'success',
    failureReason = '',
    accessSource = '',
    details = '',
    notifyAdmins = false,
    excludeNotificationUserId = null,
  } = {}
) => {
  if (!action) return null;

  const ctx = getRequestContext(req);
  const resolvedAccess = accessSource || ctx.accessSource;
  const resolvedEmail = String(email || actor?.email || '').trim().toLowerCase();
  const actorName = actor?.name || (resolvedEmail || 'Unknown');
  const actorRole = actor?.role || '';

  const audit = await createAuditLog({
    actor,
    email: resolvedEmail,
    action,
    status,
    recordType: 'Authentication',
    recordId: actor?._id ? String(actor._id) : '',
    recordLabel: actorName,
    actorName,
    actorRole,
    previousValue: '',
    newValue: status === 'success' ? 'Successful' : 'Failed',
    details: details || failureReason || `${action} via ${resolvedAccess}`,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    device: ctx.device,
    browser: ctx.browser,
    operatingSystem: ctx.operatingSystem,
    accessSource: resolvedAccess,
    location: ctx.location,
  });

  if (notifyAdmins && AUTH_ACTIONS.has(action)) {
    const title = ALERT_TITLES[action] || action.replace(/_/g, ' ');
    const message = buildAlertMessage({
      action,
      actorName,
      actorRole,
      email: resolvedEmail,
      failureReason,
      accessSource: resolvedAccess,
    });

    await notifyRole(
      'admin',
      {
        title,
        message,
        type: action.toLowerCase(),
        status,
        alertAction: action,
        actorName,
        actorRole,
        email: resolvedEmail,
        ipAddress: ctx.ipAddress,
        accessSource: resolvedAccess,
        failureReason: failureReason || '',
        linkPath: '/audit-logs',
      },
      { excludeUserId: excludeNotificationUserId }
    );
  }

  if (action === 'LOGIN_FAILED') {
    await detectRepeatedFailedLogins({
      ipAddress: ctx.ipAddress,
      email: resolvedEmail,
      accessSource: resolvedAccess,
    });
  }

  return audit;
};

function buildAlertMessage({
  action,
  actorName,
  actorRole,
  email,
  failureReason,
  accessSource,
}) {
  switch (action) {
    case 'LOGIN_SUCCESS':
      return `${actorName} (${actorRole || 'user'}) successfully logged in via ${accessSource}.`;
    case 'LOGIN_FAILED':
      return `A login attempt failed for ${email || 'an unknown account'}. ${failureReason || 'Invalid credentials'}.`;
    case 'LOGOUT':
      return `${actorName} (${actorRole || 'user'}) logged out via ${accessSource}.`;
    case 'PASSWORD_CHANGED':
      return `${actorName} changed their account password via ${accessSource}.`;
    case 'PASSWORD_CHANGE_REQUIRED':
      return `${actorName} signed in and must change their password before continuing.`;
    default:
      return `${actorName} — ${action}`;
  }
}

async function detectRepeatedFailedLogins({ ipAddress, email, accessSource }) {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const baseFilter = {
    action: 'LOGIN_FAILED',
    createdAt: { $gte: since },
  };

  const [ipCount, emailCount] = await Promise.all([
    ipAddress
      ? AuditLog.countDocuments({ ...baseFilter, ipAddress })
      : Promise.resolve(0),
    email
      ? AuditLog.countDocuments({ ...baseFilter, email })
      : Promise.resolve(0),
  ]);

  const threshold = 3;
  if (ipCount < threshold && emailCount < threshold) return;

  const count = Math.max(ipCount, emailCount);
  const detailParts = [];
  if (email) detailParts.push(`account ${email}`);
  if (ipAddress) detailParts.push(`IP ${ipAddress}`);

  await notifyRole('admin', {
    title: 'Multiple Failed Login Attempts',
    message: `${count} unsuccessful login attempts detected in the last 15 minutes (${detailParts.join(', ') || 'unknown source'}).`,
    type: 'security_alert',
    status: 'warning',
    alertAction: 'SECURITY_ALERT',
    actorName: email || 'Unknown',
    actorRole: '',
    email: email || '',
    ipAddress: ipAddress || '',
    accessSource,
    failureReason: 'Repeated failed login attempts',
    linkPath: '/audit-logs',
  });
}

export const notifyAccountStatusChange = async (req, { actor, targetUser, isActive }) => {
  const ctx = getRequestContext(req);
  const action = isActive ? 'ACTIVATE' : 'DEACTIVATE';
  const alertAction = isActive ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED';

  await notifyRole('admin', {
    title: isActive ? 'Account Activated' : 'Account Deactivated',
    message: `${targetUser.name} (${targetUser.role}) was ${isActive ? 'activated' : 'deactivated'} by ${actor.name}.`,
    type: isActive ? 'account_activated' : 'account_deactivated',
    status: 'info',
    alertAction,
    actorName: targetUser.name,
    actorRole: targetUser.role,
    email: targetUser.email || '',
    ipAddress: ctx.ipAddress,
    accessSource: ctx.accessSource,
    failureReason: '',
    relatedUser: targetUser._id,
    linkPath: '/settings/users',
  });
};

export const createSecurityNotification = createNotification;
