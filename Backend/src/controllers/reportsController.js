import OBRecord, { OB_STATUSES } from '../models/OBRecord.js';
import Complaint from '../models/Complaint.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/helpers.js';
import {
  buildReportsFilter,
  resolveDateRange,
  toReportRecord,
} from '../utils/obReportHelpers.js';

const OPEN_STATUSES = ['Opened', 'Assigned', 'Reopened'];
const CLOSED_LIKE = ['Closed', 'Resolved'];

export const getOBMeta = asyncHandler(async (_req, res) => {
  const [categories, officers] = await Promise.all([
    Category.find({ isActive: { $ne: false } }).select('name').sort({ name: 1 }),
    User.find({ role: { $in: ['police', 'admin'] }, isActive: true })
      .select('name badgeNumber station role')
      .sort({ name: 1 }),
  ]);

  const complaintCategories = await Complaint.distinct('category');
  const mergedCategories = [
    ...new Set([
      ...categories.map((item) => item.name).filter(Boolean),
      ...complaintCategories.filter(Boolean),
    ]),
  ].sort();

  return res.json({
    success: true,
    data: {
      statuses: OB_STATUSES,
      categories: mergedCategories,
      officers: officers.map((item) => ({
        id: item._id.toString(),
        name: item.name,
        badgeNumber: item.badgeNumber || '',
        station: item.station || '',
        role: item.role,
      })),
    },
  });
});

export const staffOBStats = asyncHandler(async (req, res) => {
  const baseFilter = await buildReportsFilter(req, { Complaint, User });

  const [total, byStatus, byCategoryRows, byStationRows, openCount, closedCount] =
    await Promise.all([
      OBRecord.countDocuments(baseFilter),
      OBRecord.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      OBRecord.aggregate([
        { $match: baseFilter },
        {
          $lookup: {
            from: 'complaints',
            localField: 'complaint',
            foreignField: '_id',
            as: 'complaintDoc',
          },
        },
        { $unwind: { path: '$complaintDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$complaintDoc.category', 'Other'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      OBRecord.aggregate([
        { $match: baseFilter },
        {
          $lookup: {
            from: 'users',
            localField: 'assignedOfficer',
            foreignField: '_id',
            as: 'officerDoc',
          },
        },
        { $unwind: { path: '$officerDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$officerDoc.station', ''] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      OBRecord.countDocuments({
        ...baseFilter,
        status: { $in: [...OPEN_STATUSES, 'Under Investigation', 'Investigation Completed'] },
      }),
      OBRecord.countDocuments({
        ...baseFilter,
        status: { $in: CLOSED_LIKE },
      }),
    ]);

  const statusMap = Object.fromEntries(byStatus.map((item) => [item._id, item.count]));

  const trendGranularity = ['day', 'week', 'month'].includes(req.query.trend)
    ? req.query.trend
    : 'month';

  let trendGroupId;
  if (trendGranularity === 'day') {
    trendGroupId = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
    };
  } else if (trendGranularity === 'week') {
    trendGroupId = {
      year: { $isoWeekYear: '$createdAt' },
      week: { $isoWeek: '$createdAt' },
    };
  } else {
    trendGroupId = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
    };
  }

  const trendLimit = trendGranularity === 'day' ? 31 : trendGranularity === 'week' ? 12 : 24;

  const trendRows = await OBRecord.aggregate([
    { $match: baseFilter },
    { $group: { _id: trendGroupId, count: { $sum: 1 } } },
    {
      $sort:
        trendGranularity === 'day'
          ? { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
          : trendGranularity === 'week'
            ? { '_id.year': 1, '_id.week': 1 }
            : { '_id.year': 1, '_id.month': 1 },
    },
    { $limit: trendLimit },
  ]);

  const monthly = await OBRecord.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 24 },
  ]);

  const formatTrendLabel = (id) => {
    if (trendGranularity === 'day') {
      return `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')}`;
    }
    if (trendGranularity === 'week') {
      return `${id.year}-W${String(id.week).padStart(2, '0')}`;
    }
    return `${id.year}-${String(id.month).padStart(2, '0')}`;
  };

  return res.json({
    success: true,
    data: {
      summary: {
        total,
        open: (statusMap.Opened || 0) + (statusMap.Assigned || 0) + (statusMap.Reopened || 0),
        underInvestigation: statusMap['Under Investigation'] || 0,
        pending: statusMap.Assigned || 0,
        resolved: statusMap.Resolved || 0,
        closed: statusMap.Closed || 0,
        openVsClosed: { open: openCount, closed: closedCount },
      },
      byStatus: byStatus.map((item) => ({ status: item._id || 'Unknown', count: item.count })),
      byCategory: byCategoryRows.map((item) => ({
        category: item._id || 'Other',
        count: item.count,
      })),
      byStation: byStationRows
        .filter((item) => item._id)
        .map((item) => ({ station: item._id, count: item.count })),
      monthlyTrends: monthly.map((item) => ({
        year: item._id.year,
        month: item._id.month,
        label: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count,
      })),
      trends: trendRows.map((row) => ({
        label: formatTrendLabel(row._id),
        count: row.count,
      })),
      trendGranularity,
    },
  });
});

export const staffExportOBs = asyncHandler(async (req, res) => {
  const filter = await buildReportsFilter(req, { Complaint, User });
  const records = await OBRecord.find(filter)
    .populate('complaint', 'complaintNumber category location incidentDate')
    .populate('citizen', 'name phone')
    .populate('assignedOfficer', 'name badgeNumber station')
    .sort({ createdAt: -1 })
    .limit(5000);

  const header = [
    'OB Number',
    'Date',
    'Citizen',
    'Phone',
    'Category',
    'Location',
    'Station',
    'Status',
    'Assigned Officer',
    'Created At',
  ];

  const rows = records.map((record) => {
    const report = toReportRecord(record);
    return [
      report.obNumber,
      report.occurrenceDate ? new Date(report.occurrenceDate).toISOString().slice(0, 10) : '',
      report.complainantName,
      record.citizen?.phone || '',
      report.category,
      report.location,
      report.station,
      report.status,
      report.assignedOfficer?.name || '',
      record.createdAt ? new Date(record.createdAt).toISOString() : '',
    ];
  });

  const escapeCsv = (value) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ob-export-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  return res.send(csv);
});

export const listReportOccurrences = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const skip = (page - 1) * limit;
  const filter = await buildReportsFilter(req, { Complaint, User });

  const [records, total] = await Promise.all([
    OBRecord.find(filter)
      .populate('complaint', 'complaintNumber category location incidentDate')
      .populate('citizen', 'name email phone niraId')
      .populate('assignedOfficer', 'name badgeNumber station email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    OBRecord.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: {
      records: records.map((item) => toReportRecord(item)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

export { resolveDateRange };
