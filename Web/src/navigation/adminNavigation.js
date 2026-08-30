import { policeNavigation } from './policeNavigation';

export const adminNavigation = [
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
    label: 'Occurrences / OB Records',
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
<<<<<<< HEAD
=======
    comingSoon: true,
>>>>>>> d269264ca61b14242d16ca766361ed8ac7cfe9a9
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
      {
        id: 'districts',
        label: 'Districts',
        path: '/settings/districts',
        icon: 'districts',
        moduleKey: 'settings',
      },
    ],
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
