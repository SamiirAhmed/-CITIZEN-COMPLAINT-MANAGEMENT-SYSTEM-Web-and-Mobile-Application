import GeographicLocation from '../models/GeographicLocation.js';

/** 18 official Somali regions (gobollada) with representative districts. */
const SOMALI_REGIONS = [
  { region: 'Awdal', district: 'Borama' },
  { region: 'Bakool', district: 'Hudur' },
  { region: 'Banaadir', district: 'Hodan', villages: [{ village: 'Hodan', areas: ['Wadajir Zone', 'KM4 Area'] }] },
  { region: 'Bari', district: 'Bosaso' },
  { region: 'Bay', district: 'Baidoa' },
  { region: 'Galgaduud', district: 'Dhusamareb' },
  { region: 'Gedo', district: 'Garbahaarey' },
  { region: 'Hiiraan', district: 'Beledweyne' },
  { region: 'Lower Juba', district: 'Kismayo' },
  { region: 'Lower Shabelle', district: 'Marka' },
  { region: 'Middle Juba', district: 'Bu\'aale' },
  { region: 'Middle Shabelle', district: 'Jowhar' },
  { region: 'Mudug', district: 'Galkacyo' },
  { region: 'Nugaal', district: 'Garowe' },
  { region: 'Sanaag', district: 'Erigavo' },
  { region: 'Sool', district: 'Las Anod' },
  { region: 'Togdheer', district: 'Burao' },
  { region: 'Woqooyi Galbeed', district: 'Hargeisa' },
];

export async function seedGeography() {
  let created = 0;

  for (const entry of SOMALI_REGIONS) {
    const base = {
      region: entry.region,
      district: entry.district,
      village: '',
      area: '',
    };

    const exists = await GeographicLocation.findOne(base);
    if (!exists) {
      await GeographicLocation.create({ ...base, isActive: true });
      created += 1;
    }

    if (Array.isArray(entry.villages)) {
      for (const villageEntry of entry.villages) {
        for (const areaName of villageEntry.areas || ['']) {
          const row = {
            region: entry.region,
            district: entry.district,
            village: villageEntry.village,
            area: areaName,
          };
          const rowExists = await GeographicLocation.findOne(row);
          if (!rowExists) {
            await GeographicLocation.create({ ...row, isActive: true });
            created += 1;
          }
        }
      }
    }
  }

  if (created > 0) {
    console.log(`Geography seed: ${created} location record(s) added.`);
  }
}
