export const adminNavigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
  },
  {
    id: 'citizens',
    label: 'Citizens',
    path: '/citizens',
    icon: 'citizens',
  },
  {
    id: 'complaints',
    label: 'Complaints',
    path: '/complaints',
    icon: 'complaints',
    comingSoon: true,
  },
  {
    id: 'ob-records',
    label: 'OB Records',
    path: '/ob-records',
    icon: 'ob',
    comingSoon: true,
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: 'reports',
    comingSoon: true,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: 'notifications',
    comingSoon: true,
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    path: '/audit-logs',
    icon: 'audit',
    comingSoon: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'settings',
    expandable: true,
    children: [
      {
        id: 'users',
        label: 'Users',
        path: '/settings/users',
        icon: 'users',
      },
      {
        id: 'permissions',
        label: 'Permissions',
        path: '/settings/permissions',
        icon: 'permissions',
      },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: 'profile',
    comingSoon: true,
  },
];

export function isSettingsPath(pathname) {
  return pathname === '/settings' || pathname.startsWith('/settings/');
}
