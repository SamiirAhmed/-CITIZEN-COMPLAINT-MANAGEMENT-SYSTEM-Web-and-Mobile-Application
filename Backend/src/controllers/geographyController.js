import GeographicLocation from '../models/GeographicLocation.js';
import { asyncHandler } from '../utils/helpers.js';

export const listRegions = asyncHandler(async (_req, res) => {
  const regions = await GeographicLocation.distinct('region', { isActive: true });
  regions.sort((a, b) => a.localeCompare(b));

  return res.json({
    success: true,
    data: { regions },
  });
});

export const listDistrictsByRegion = asyncHandler(async (req, res) => {
  const region = String(req.query.region ?? 'Banaadir').trim() || 'Banaadir';

  const districts = await GeographicLocation.distinct('district', {
    region,
    isActive: true,
  });
  districts.sort((a, b) => a.localeCompare(b));

  return res.json({
    success: true,
    data: {
      districts,
      names: districts,
      region,
    },
  });
});

export const listVillages = asyncHandler(async (req, res) => {
  let region = String(req.query.region ?? '').trim();
  const district = String(req.query.district ?? '').trim();

  if (!district) {
    return res.status(400).json({
      success: false,
      message: 'District is required.',
    });
  }

  if (!region) {
    const row = await GeographicLocation.findOne({
      district,
      isActive: true,
    }).sort({ village: 1, area: 1 });
    if (!row) {
      return res.json({ success: true, data: { villages: [] } });
    }
    region = row.region;
  }

  const villages = await GeographicLocation.distinct('village', {
    region,
    district,
    isActive: true,
    village: { $ne: '' },
  });
  villages.sort((a, b) => a.localeCompare(b));

  return res.json({
    success: true,
    data: { villages, region },
  });
});

export const listAreas = asyncHandler(async (req, res) => {
  let region = String(req.query.region ?? '').trim();
  const district = String(req.query.district ?? '').trim();
  const village = String(req.query.village ?? '').trim();

  if (!district || !village) {
    return res.status(400).json({
      success: false,
      message: 'District and village are required.',
    });
  }

  if (!region) {
    const row = await GeographicLocation.findOne({
      district,
      village,
      isActive: true,
    }).sort({ area: 1 });
    if (!row) {
      return res.json({ success: true, data: { areas: [] } });
    }
    region = row.region;
  }

  const areas = await GeographicLocation.distinct('area', {
    region,
    district,
    village,
    isActive: true,
    area: { $ne: '' },
  });
  areas.sort((a, b) => a.localeCompare(b));

  return res.json({
    success: true,
    data: { areas, region },
  });
});

export const resolveLocationId = asyncHandler(async (req, res) => {
  const region = String(req.body.region ?? req.query.region ?? '').trim();
  const district = String(req.body.district ?? req.query.district ?? '').trim();
  const village = String(req.body.village ?? req.query.village ?? '').trim();
  const area = String(req.body.area ?? req.query.area ?? '').trim();

  if (!region || !district) {
    return res.status(400).json({
      success: false,
      message: 'Region and district are required.',
    });
  }

  const location = await GeographicLocation.findOne({
    region,
    district,
    village: village || '',
    area: area || '',
    isActive: true,
  });

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'Selected location was not found.',
    });
  }

  return res.json({
    success: true,
    data: { location: location.toSafeObject() },
  });
});

export const listGeographyTable = asyncHandler(async (req, res) => {
  const { search = '' } = req.query;
  const region = String(req.query.region ?? 'Banaadir').trim() || 'Banaadir';
  const filter = { isActive: true, region };

  if (search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { region: regex },
      { district: regex },
      { village: regex },
      { area: regex },
    ];
  }

  const locations = await GeographicLocation.find(filter)
    .sort({ region: 1, district: 1, village: 1, area: 1 });

  return res.json({
    success: true,
    data: {
      locations: locations.map((item) => item.toSafeObject()),
      region,
    },
  });
});

export const createGeography = asyncHandler(async (req, res) => {
  const region = 'Banaadir';
  const district = String(req.body.district ?? '').trim();
  const village = String(req.body.village ?? '').trim();
  const area = String(req.body.area ?? '').trim();

  if (!district) {
    return res.status(400).json({
      success: false,
      message: 'District is required.',
    });
  }

  const duplicate = await GeographicLocation.findOne({
    region,
    district,
    village,
    area,
  });

  if (duplicate) {
    if (duplicate.isActive) {
      return res.status(409).json({
        success: false,
        message: 'This district location already exists.',
      });
    }
    duplicate.isActive = true;
    await duplicate.save();
    return res.status(201).json({
      success: true,
      message: 'District restored successfully.',
      data: { location: duplicate.toSafeObject() },
    });
  }

  const location = await GeographicLocation.create({
    region,
    district,
    village,
    area,
    isActive: true,
  });

  return res.status(201).json({
    success: true,
    message: 'District registered successfully.',
    data: { location: location.toSafeObject() },
  });
});

export const updateGeography = asyncHandler(async (req, res) => {
  const location = await GeographicLocation.findById(req.params.id);
  if (!location || !location.isActive) {
    return res.status(404).json({
      success: false,
      message: 'District record not found.',
    });
  }

  const district = String(req.body.district ?? location.district).trim();
  const village =
    req.body.village !== undefined
      ? String(req.body.village ?? '').trim()
      : location.village || '';
  const area =
    req.body.area !== undefined
      ? String(req.body.area ?? '').trim()
      : location.area || '';

  if (!district) {
    return res.status(400).json({
      success: false,
      message: 'District is required.',
    });
  }

  const previousDistrict = location.district;
  location.region = 'Banaadir';
  location.district = district;
  location.village = village;
  location.area = area;

  try {
    await location.save();
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Another record already uses this district location.',
      });
    }
    throw error;
  }

  if (previousDistrict !== district && !village && !area) {
    await GeographicLocation.updateMany(
      { region: 'Banaadir', district: previousDistrict, _id: { $ne: location._id } },
      { $set: { district } }
    );
  }

  return res.json({
    success: true,
    message: 'District updated successfully.',
    data: { location: location.toSafeObject() },
  });
});

export const deleteGeography = asyncHandler(async (req, res) => {
  const location = await GeographicLocation.findById(req.params.id);
  if (!location || !location.isActive) {
    return res.status(404).json({
      success: false,
      message: 'District record not found.',
    });
  }

  const { district } = location;
  await GeographicLocation.updateMany(
    { region: 'Banaadir', district, isActive: true },
    { $set: { isActive: false } }
  );

  return res.json({
    success: true,
    message: `District "${district}" removed.`,
  });
});
