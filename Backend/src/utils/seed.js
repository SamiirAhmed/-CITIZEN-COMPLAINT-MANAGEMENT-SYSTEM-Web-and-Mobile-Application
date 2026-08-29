import User from '../models/User.js';
import { DEFAULT_POLICE_PERMISSIONS } from '../constants/menuModules.js';

const ADMIN_EMAIL = 'admin@spf.gov.so';
const ADMIN_PASSWORD = 'admin123';

const ensureAdminAccount = async () => {
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email }).select('+password');

  if (!existing) {
    await User.create({
      name: 'System Administrator',
      email,
      password: ADMIN_PASSWORD,
      role: 'admin',
      phone: '0610000001',
      niraId: 'ADMIN000001',
      badgeNumber: 'ADM-001',
      station: 'HQ Mogadishu',
      tell: '0610000001',
      isActive: true,
      menuPermissions: [],
    });
    console.log(`Seeded admin account: ${email}`);
    return;
  }

  let changed = false;

  if (existing.role !== 'admin') {
    existing.role = 'admin';
    changed = true;
  }

  if (existing.isActive === false) {
    existing.isActive = true;
    changed = true;
  }

  const passwordMatches = await existing.comparePassword(ADMIN_PASSWORD);
  if (!passwordMatches) {
    existing.password = ADMIN_PASSWORD;
    changed = true;
  }

  if (changed) {
    await existing.save();
    console.log(`Updated admin account: ${email}`);
  }
};

export const seedStaffUsers = async () => {
  await ensureAdminAccount();

  const policeEmail = 'police@spf.gov.so';
  const existingPolice = await User.findOne({ email: policeEmail });
  if (!existingPolice) {
    await User.create({
      name: 'Investigating Officer',
      email: policeEmail,
      password: 'Police@123',
      role: 'police',
      phone: '0610000002',
      niraId: 'POLICE00001',
      badgeNumber: 'POL-101',
      station: 'Hodan Station',
      tell: '0610000002',
      isActive: true,
      menuPermissions: DEFAULT_POLICE_PERMISSIONS,
    });
    console.log(`Seeded police account: ${policeEmail}`);
  } else if (
    existingPolice.role === 'police' &&
    (!existingPolice.menuPermissions || existingPolice.menuPermissions.length === 0)
  ) {
    existingPolice.menuPermissions = DEFAULT_POLICE_PERMISSIONS;
    await existingPolice.save();
    console.log(`Updated police permissions for: ${policeEmail}`);
  }
};
