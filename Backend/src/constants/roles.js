export const ROLES = {
  CITIZEN: 'citizen',
  ADMIN: 'admin',
  POLICE: 'police',
};

export const USER_ROLE_VALUES = Object.values(ROLES);

export const MOBILE_ONLY_ROLES = [ROLES.CITIZEN];

/** Staff roles that may use the web portal. Add new web roles here. */
export const WEB_STAFF_ROLES = [ROLES.ADMIN, ROLES.POLICE];

export const isMobileOnlyRole = (role) => MOBILE_ONLY_ROLES.includes(role);

export const isWebStaffRole = (role) => WEB_STAFF_ROLES.includes(role);
