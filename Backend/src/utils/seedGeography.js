import GeographicLocation from '../models/GeographicLocation.js';

/** Official 18 districts of Banaadir (Mogadishu), English names. */
export const BANAADIR_DISTRICTS = [
  'Abdiaziz',
  'Bondhere',
  'Daynile',
  'Dharkenley',
  'Hamar Jajab',
  'Hamar Weyne',
  'Hodan',
  'Howlwadag',
  'Huriwa',
  'Karan',
  'Shangani',
  'Shibis',
  'Waberi',
  'Wadajir',
  'Warta Nabada',
  'Yaqshid',
  'Kahda',
  'Garasbaley',
];

/** Other Somali regions with a representative district seat. */
const OTHER_REGION_SEATS = [
  { region: 'Awdal', district: 'Borama' },
  { region: 'Bakool', district: 'Hudur' },
  { region: 'Bari', district: 'Bosaso' },
  { region: 'Bay', district: 'Baidoa' },
  { region: 'Galgaduud', district: 'Dhusamareb' },
  { region: 'Gedo', district: 'Garbahaarey' },
  { region: 'Hiiraan', district: 'Beledweyne' },
  { region: 'Lower Juba', district: 'Kismayo' },
  { region: 'Lower Shabelle', district: 'Marka' },
  { region: 'Middle Juba', district: "Bu'aale" },
  { region: 'Middle Shabelle', district: 'Jowhar' },
  { region: 'Mudug', district: 'Galkacyo' },
  { region: 'Nugaal', district: 'Garowe' },
  { region: 'Sanaag', district: 'Erigavo' },
  { region: 'Sool', district: 'Las Anod' },
  { region: 'Togdheer', district: 'Burao' },
  { region: 'Woqooyi Galbeed', district: 'Hargeisa' },
];

/** Sample villages/areas under Hodan for dropdown demos. */
const HODAN_VILLAGES = [
  { village: 'Hodan', areas: ['Wadajir Zone', 'KM4 Area', 'Ex-Control'] },
];

async function ensureLocation(row) {
  const exists = await GeographicLocation.findOne(row);
  if (exists) return false;
  await GeographicLocation.create({ ...row, isActive: true });
  return true;
}

export async function seedGeography() {
  let created = 0;

  for (const district of BANAADIR_DISTRICTS) {
    const added = await ensureLocation({
      region: 'Banaadir',
      district,
      village: '',
      area: '',
    });
    if (added) created += 1;
  }

  for (const villageEntry of HODAN_VILLAGES) {
    for (const areaName of villageEntry.areas) {
      const added = await ensureLocation({
        region: 'Banaadir',
        district: 'Hodan',
        village: villageEntry.village,
        area: areaName,
      });
      if (added) created += 1;
    }
  }

  for (const entry of OTHER_REGION_SEATS) {
    const added = await ensureLocation({
      region: entry.region,
      district: entry.district,
      village: '',
      area: '',
    });
    if (added) created += 1;
  }

  if (created > 0) {
    console.log(`Geography seed: ${created} location record(s) added.`);
  }
}
