import GeographicLocation from '../models/GeographicLocation.js';

export async function applyGeographicLocation(user, geographicLocationId) {
  if (!geographicLocationId) {
    return { ok: false, message: 'District is required.' };
  }

  const location = await GeographicLocation.findOne({
    _id: geographicLocationId,
    isActive: true,
  });

  if (!location) {
    return { ok: false, message: 'Selected district/location was not found.' };
  }

  user.geographicLocationId = location._id;
  user.region = location.region;
  user.district = location.district;
  user.village = location.village || '';
  user.area = location.area || '';

  return { ok: true, location };
}

export async function applyGeographicSelection(user, { region, district, village = '', area = '' }) {
  const trimmedRegion = String(region ?? '').trim();
  const trimmedDistrict = String(district ?? '').trim();
  const trimmedVillage = String(village ?? '').trim();
  const trimmedArea = String(area ?? '').trim();

  if (!trimmedRegion || !trimmedDistrict) {
    return { ok: false, message: 'Region and district are required.' };
  }

  const location = await GeographicLocation.findOne({
    region: trimmedRegion,
    district: trimmedDistrict,
    village: trimmedVillage,
    area: trimmedArea,
    isActive: true,
  });

  if (!location) {
    const districtLevel = await GeographicLocation.findOne({
      region: trimmedRegion,
      district: trimmedDistrict,
      village: '',
      area: '',
      isActive: true,
    });
    if (!districtLevel) {
      return { ok: false, message: 'Selected district was not found.' };
    }
    user.geographicLocationId = districtLevel._id;
    user.region = districtLevel.region;
    user.district = districtLevel.district;
    user.village = trimmedVillage;
    user.area = trimmedArea;
    return { ok: true, location: districtLevel };
  }

  user.geographicLocationId = location._id;
  user.region = location.region;
  user.district = location.district;
  user.village = location.village || '';
  user.area = location.area || '';

  return { ok: true, location };
}
