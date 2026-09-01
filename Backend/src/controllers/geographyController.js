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
  const region = String(req.query.region ?? '').trim();

  // No region → all active districts (with region) for district-only dropdowns.
  if (!region) {
    const rows = await GeographicLocation.aggregate([
      { $match: { isActive: true, district: { $nin: [null, ''] } } },
      {
        $group: {
          _id: { district: '$district', region: '$region' },
        },
      },
      { $sort: { '_id.district': 1, '_id.region': 1 } },
    ]);

    const districts = rows.map((row) => ({
      district: row._id.district,
      region: row._id.region,
      label: row._id.district,
    }));

    return res.json({
      success: true,
      data: {
        districts,
        // Backward-compatible flat names
        names: [...new Set(districts.map((item) => item.district))],
      },
    });
  }

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
  const filter = { isActive: true };

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
    },
  });
});
