import { createAuditLog, createNotification, notifyRole } from './helpers.js';
import { actorFields, notifyUser } from './notifyEvent.js';
import { getRequestContext } from './requestContext.js';

const NOTIFY_AUTH_ACTIONS = new Set([
  'PASSWORD_CHANGED',
  'PASSWORD_CHANGE_REQUIRED',
]);

export const HIDDEN_NOTIFICATION_TYPES = [
  'login_success',
  'login',
  'logout',
  'login_failed',
  'user_login',
  'user_logout',
  'successful_login',
  'user_logged_out',
];

export const HIDDEN_ALERT_ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGOUT',
  'LOGIN',
  'LOGIN_FAILED',
];

export const HIDDEN_NOTIFICATION_TITLES = [
  'Successful Login',
  'User Logged Out',
  'Failed Login Attempt',
  'Police Login',
  'Admin Login',
  'Police Logout',
  'Admin Logout',
  'Citizen Login',
  'Citizen Logout',
];

const SECURITY_NOTIFICATION_TYPES = new Set([
  'password_changed',
  'password_change_required',
  'account_activated',
  'account_deactivated',
  'security_alert',
]);

export { SECURITY_NOTIFICATION_TYPES };

export function hiddenNotificationClause() {
  return {
    type: { $nin: HIDDEN_NOTIFICATION_TYPES },
    alertAction: { $nin: HIDDEN_ALERT_ACTIONS },
    title: { $nin: HIDDEN_NOTIFICATION_TITLES },
  };
}

const ALERT_TITLES = {
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

  if (notifyAdmins && NOTIFY_AUTH_ACTIONS.has(action)) {
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
    case 'PASSWORD_CHANGED':
      return `${actorName} changed their account password via ${accessSource}.`;
    case 'PASSWORD_CHANGE_REQUIRED':
      return `${actorName} signed in and must change their password before continuing.`;
    default:
      return `${actorName} — ${action}`;
  }
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
  }, { excludeUserId: actor?._id });

  await notifyUser({
    userId: targetUser._id,
    title: isActive ? 'Account Activated' : 'Account Status Updated',
    message: isActive
      ? 'Your account has been activated. You can now sign in to the Police Portal.'
      : 'Your account status has been changed to Inactive.',
    type: isActive ? 'account_activated' : 'account_deactivated',
    status: 'info',
    alertAction,
    ...actorFields(actor),
    relatedUser: targetUser._id,
    linkPath: '/profile',
  });
};

export const createSecurityNotification = createNotification;

