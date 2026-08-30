/**
 * Web dashboards that currently exist.
 * Add a new entry when a role gets a web portal — do not add another login page.
 */
export const WEB_ROLE_HOME = {
  admin: '/admin/dashboard',
  police: '/police/dashboard',
};

export const MOBILE_ONLY_ROLES = new Set(['citizen']);

export function isMobileOnlyUser(user) {
  return Boolean(user?.role && MOBILE_ONLY_ROLES.has(user.role));
}

export function isWebUser(user) {
  return Boolean(user?.role) && !isMobileOnlyUser(user);
}

export function isStaffUser(user) {
  return isWebUser(user);
}

export function hasWebDashboard(user) {
  return Boolean(user?.role && WEB_ROLE_HOME[user.role]);
}

export function getHomePath(user) {
  if (!isWebUser(user)) return '/login';
  return WEB_ROLE_HOME[user.role] || '/unauthorized';
}

export function getPortalLabel(role) {
  if (role === 'police') return 'POLICE PORTAL';
  if (role === 'admin') return 'ADMIN PORTAL';
  return 'STAFF PORTAL';
}
