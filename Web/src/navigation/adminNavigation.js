<<<<<<< HEAD
﻿export const adminNavigation = [
=======
import { policeNavigation } from './policeNavigation';

export const adminNavigation = [
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
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
<<<<<<< HEAD
=======
    moduleKey: 'ob-records',
    section: 'main',
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: 'reports',
<<<<<<< HEAD
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: 'notifications',
    comingSoon: true,
=======
    comingSoon: true,
    moduleKey: 'reports',
    section: 'main',
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
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
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'settings',
    expandable: true,
    moduleKey: 'settings',
    section: 'system',
    children: [
      {
        id: 'users',
        label: 'Users',
        path: '/settings/users',
        icon: 'users',
        moduleKey: 'settings',
      },
      {
        id: 'permissions',
        label: 'Permissions',
        path: '/settings/permissions',
        icon: 'permissions',
        moduleKey: 'settings',
      },
      {
        id: 'categories',
        label: 'Categories',
        path: '/settings/categories',
        icon: 'categories',
        moduleKey: 'settings',
      },
    ],
  },
  {
    id: 'profile',
    label: 'Edit Profile',
    path: '/profile',
    icon: 'profile',
<<<<<<< HEAD
=======
    moduleKey: 'profile',
    section: 'system',
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
  },
];

export function isSettingsPath(pathname) {
  return pathname === '/settings' || pathname.startsWith('/settings/');
}

<<<<<<< HEAD
=======
export function userHasModule(user, moduleKey) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const permissions = Array.isArray(user.menuPermissions) ? user.menuPermissions : [];
  return permissions.includes(moduleKey);
}

export function filterNavigationForUser(user) {
  if (!user) return [];
  if (user.role === 'police') {
    return policeNavigation;
  }
  return adminNavigation.filter((item) => userHasModule(user, item.moduleKey));
}

export function getHomePath(user) {
  if (user?.role === 'police') return '/police/dashboard';
  return '/dashboard';
}

export function getFirstAllowedPath(user) {
  if (user?.role === 'police') return getHomePath(user);
  const items = filterNavigationForUser(user);
  if (!items.length) return '/profile';
  const first = items[0];
  if (first.expandable && first.children?.length) {
    return first.children[0].path;
  }
  return first.path;
}

export function resolveNotificationPath(notification, user) {
  if (user?.role === 'police' && notification?.relatedOB) {
    return `/ob-records/${notification.relatedOB}`;
  }
  if (notification?.linkPath) {
    if (user?.role === 'police' && notification.linkPath === '/dashboard') {
      return '/police/dashboard';
    }
    return notification.linkPath;
  }
  if (notification?.relatedUser && String(notification.type || '').includes('citizen')) {
    return `/citizens/${notification.relatedUser}`;
  }
  if (notification?.relatedUser) return '/settings/users';
  if (notification?.relatedOB) return '/ob-records';
  if (notification?.relatedComplaint) return '/complaints';
  return getHomePath(user);
}
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
