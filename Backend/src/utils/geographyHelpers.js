import GeographicLocation from '../models/GeographicLocation.js';

export async function applyGeographicLocation(user, geographicLocationId) {
  if (!geographicLocationId) {
    return { ok: false, message: 'Please select a district.' };
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

/**
 * Apply geography from district (preferred) and optional region/village/area.
 * Village must belong to the selected district; area must belong to the village.
 * Region is resolved from the database when omitted.
 */
export async function applyGeographicSelection(
  user,
  { region, district, village = '', area = '' }
) {
  const trimmedDistrict = String(district ?? '').trim();
  let trimmedRegion = String(region ?? '').trim();
  const trimmedVillage = String(village ?? '').trim();
  const trimmedArea = String(area ?? '').trim();

  if (!trimmedDistrict) {
    return { ok: false, message: 'Please select a district.' };
  }

  if (trimmedArea && !trimmedVillage) {
    return {
      ok: false,
      message: 'Please select a village before selecting an area.',
    };
  }

  const districtMatch = await GeographicLocation.findOne({
    district: trimmedDistrict,
    ...(trimmedRegion ? { region: trimmedRegion } : {}),
    isActive: true,
  }).sort({ village: 1, area: 1 });

  if (!districtMatch) {
    return { ok: false, message: 'Selected district was not found.' };
  }

  trimmedRegion = districtMatch.region;

  if (trimmedVillage) {
    const villageExists = await GeographicLocation.exists({
      region: trimmedRegion,
      district: trimmedDistrict,
      village: trimmedVillage,
      isActive: true,
    });

    if (!villageExists) {
      return {
        ok: false,
        message: 'Selected village does not belong to the selected district.',
      };
    }
  }

  if (trimmedArea) {
    const areaExists = await GeographicLocation.exists({
      region: trimmedRegion,
      district: trimmedDistrict,
      village: trimmedVillage,
      area: trimmedArea,
      isActive: true,
    });

    if (!areaExists) {
      return {
        ok: false,
        message: 'Selected area does not belong to the selected village.',
      };
    }
  }

  let location = await GeographicLocation.findOne({
    region: trimmedRegion,
    district: trimmedDistrict,
    village: trimmedVillage,
    area: trimmedArea,
    isActive: true,
  });

  if (!location && trimmedVillage) {
    location = await GeographicLocation.findOne({
      region: trimmedRegion,
      district: trimmedDistrict,
      village: trimmedVillage,
      isActive: true,
    }).sort({ area: 1 });
  }

  if (!location) {
    location = districtMatch;
  }

  user.geographicLocationId = location._id;
  user.region = trimmedRegion;
  user.district = trimmedDistrict;
  user.village = trimmedVillage;
  user.area = trimmedArea;

  return { ok: true, location };
}
