import User from '../models/User.js';

export const seedStaffUsers = async () => {
  const defaults = [
    {
      name: 'System Administrator',
      email: 'admin@spf.gov.so',
      password: 'admin123',
      role: 'admin',
      phone: '0610000001',
      niraId: 'ADMIN000001',
      badgeNumber: 'ADM-001',
      station: 'HQ Mogadishu',
      tell: '0610000001',
    },
    {
      name: 'Investigating Officer',
      email: 'police@spf.gov.so',
      password: 'Police@123',
      role: 'police',
      phone: '0610000002',
      niraId: 'POLICE00001',
      badgeNumber: 'POL-101',
      station: 'Hodan Station',
      tell: '0610000002',
    },
  ];

  for (const item of defaults) {
    const existing = await User.findOne({ email: item.email });
    if (!existing) {
      await User.create(item);
      console.log(`Seeded ${item.role} account: ${item.email}`);
    }
  }
};
