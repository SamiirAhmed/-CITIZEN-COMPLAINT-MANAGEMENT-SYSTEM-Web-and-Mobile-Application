import { getHomePath } from '../auth/roles';
import { policeNavigation } from './policeNavigation';

export const adminNavigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: 'dashboard',
    moduleKey: 'dashboard',
    section: 'main',
  },
  {
    id: 'citizens',
    label: 'Citizens',
    path: '/citizens',
    icon: 'citizens',
    moduleKey: 'citizens',
    section: 'main',
  },
  {
    id: 'complaints',
    label: 'Complaints',
    path: '/complaints',
    icon: 'complaints',
    moduleKey: 'complaints',
    section: 'main',
  },
  {
    id: 'ob-records',
    label: 'OB Records',
    path: '/ob-records',
    icon: 'ob',
    moduleKey: 'ob-records',
    section: 'main',
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: 'reports',
    moduleKey: 'reports',
    section: 'main',
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    path: '/audit-logs',
    icon: 'audit',
    moduleKey: 'audit-logs',
    section: 'main',
  },
  {
    id: 'sms-portal',
    label: 'SMS Portal',
    path: '/sms-portal',
    icon: 'sms',
    moduleKey: 'sms-portal',
    section: 'main',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'settings',
    moduleKey: 'settings',
    section: 'system',
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: 'profile',
    moduleKey: 'profile',
    section: 'system',
  },
];

export function isSettingsPath(pathname) {
  return pathname === '/settings' || pathname.startsWith('/settings/');
}

export function userHasModule(user, moduleKey) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const permissions = Array.isArray(user.menuPermissions) ? user.menuPermissions : [];
  return permissions.includes(moduleKey);
}

export function filterNavigationForUser(user) {
  if (!user) return [];
  if (user.role === 'police') return policeNavigation;
  if (user.role === 'admin') {
    return adminNavigation.filter((item) => userHasModule(user, item.moduleKey));
  }
  return adminNavigation.filter((item) => item.id === 'profile');
}

export { getHomePath };

export function getFirstAllowedPath(user) {
  if (user?.role !== 'admin') return getHomePath(user);
  const items = filterNavigationForUser(user);
  if (!items.length) return '/profile';
  return items[0].path;
}

export function resolveNotificationPath(notification, user) {
  const type = String(notification?.type || '');
  const isPolice = user?.role === 'police';

  if (notification?.linkPath) {
    if (notification.linkPath === '/dashboard' || notification.linkPath === '/admin/dashboard') {
      return getHomePath(user);
    }
    if (isPolice && notification.relatedOB && notification.linkPath.startsWith('/ob-records')) {
      return `/ob-records/${notification.relatedOB}`;
    }
    if (isPolice && notification.linkPath.startsWith('/complaints')) {
      return notification.relatedOB
        ? `/ob-records/${notification.relatedOB}`
        : '/ob-records';
    }
    if (isPolice && notification.linkPath.startsWith('/citizens')) {
      return '/profile';
    }
    if (isPolice && notification.linkPath.startsWith('/settings')) {
      return '/profile';
    }
    return notification.linkPath;
  }

  if (isPolice && notification?.relatedOB) {
    return `/ob-records/${notification.relatedOB}`;
  }
  if (notification?.relatedUser && type.includes('citizen')) {
    return `/citizens/${notification.relatedUser}`;
  }
  if (notification?.relatedOB) return `/ob-records?id=${notification.relatedOB}`;
  if (notification?.relatedComplaint) return `/complaints?id=${notification.relatedComplaint}`;
  if (notification?.relatedUser) {
    return isPolice ? '/profile' : `/settings/users?id=${notification.relatedUser}`;
  }
  return getHomePath(user);
}
