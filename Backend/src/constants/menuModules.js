export const MENU_MODULES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Overview and statistics' },
  { key: 'citizens', label: 'Citizens', description: 'Citizen management' },
  { key: 'complaints', label: 'Complaints', description: 'Complaint records' },
  { key: 'ob-records', label: 'OB Records', description: 'Occurrence Book records' },
  { key: 'reports', label: 'Reports', description: 'System reports' },
  { key: 'audit-logs', label: 'Audit Logs', description: 'Activity audit trail' },
  { key: 'sms-portal', label: 'SMS Portal', description: 'Send SMS to Police users' },
  { key: 'settings', label: 'Settings', description: 'Users, permissions, and categories' },
  { key: 'profile', label: 'Profile', description: 'Personal profile' },
];

export const MENU_MODULE_KEYS = MENU_MODULES.map((item) => item.key);

export const DEFAULT_POLICE_PERMISSIONS = [
  'dashboard',
  'complaints',
  'ob-records',
  'profile',
];

export const ALL_ADMIN_PERMISSIONS = [...MENU_MODULE_KEYS];

export const normalizePermissions = (permissions = []) => {
  const unique = [...new Set(permissions.map((item) => String(item).trim()).filter(Boolean))];
  return unique.filter((key) => MENU_MODULE_KEYS.includes(key));
};
