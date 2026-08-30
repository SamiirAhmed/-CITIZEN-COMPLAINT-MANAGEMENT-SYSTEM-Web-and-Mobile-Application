import OBRecord, {
  COMPLAINT_CATEGORY_TO_OB,
  OB_CATEGORIES,
  OB_PRIORITIES,
  OB_STATUSES,
} from '../models/OBRecord.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import {
  asyncHandler,
  createAuditLog,
  createNotification,
  generateOBNumber,
  getRequestIp,
} from '../utils/helpers.js';
import {
  evidencePublicPath,
  removeEvidenceFile,
} from '../middleware/uploadEvidence.js';

const COMPLETED_STATUSES = [
  'Investigation Completed',
  'Resolved',
  'Closed',
];

const canAccessAssignedOB = (ob, user) => {
  if (!ob || !user) return false;
  if (user.role === 'admin') return true;
  const officerId = ob.assignedOfficer?._id || ob.assignedOfficer;
  return officerId && officerId.toString() === user._id.toString();
};

const appendInvestigationNote = (ob, note, userId) => {
  const trimmed = String(note || '').trim();
  if (!trimmed) return;
  ob.investigationNotes = `${ob.investigationNotes || ''}\n${trimmed}`.trim();
  ob.investigationNoteEntries = ob.investigationNoteEntries || [];
  ob.investigationNoteEntries.push({
    note: trimmed,
    createdBy: userId,
    createdAt: new Date(),
  });
};

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const STAFF_POPULATE = [
  { path: 'complaint', select: 'complaintNumber category status description location incidentDate' },
  { path: 'citizen', select: 'name email phone niraId' },
  { path: 'assignedOfficer', select: 'name badgeNumber station role email' },
  { path: 'recordedBy', select: 'name badgeNumber station role' },
  { path: 'createdBy', select: 'name badgeNumber station role email' },
  { path: 'updatedBy', select: 'name badgeNumber station role' },
  { path: 'closedBy', select: 'name badgeNumber station role' },
  { path: 'activityHistory.user', select: 'name badgeNumber station role' },
];

const loadStaffOB = async (id, { withNotes = false } = {}) => {
  let query = OBRecord.findById(id);
  if (withNotes) query = query.select('+investigationNotes');
  return query.populate(STAFF_POPULATE);
};

const mapUserRef = (user) => {
  if (!user) return null;
  if (typeof user === 'string') return { id: user };
  return {
    id: user._id?.toString?.() || user.id || String(user),
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    niraId: user.niraId || '',
    badgeNumber: user.badgeNumber || '',
    station: user.station || '',
  };
};

const mapComplaintRef = (complaint) => {
  if (!complaint) return null;
  if (typeof complaint === 'string') return { id: complaint };
  return {
    id: complaint._id?.toString?.() || complaint.id || String(complaint),
    complaintNumber: complaint.complaintNumber || '',
    category: complaint.category || '',
    status: complaint.status || '',
    description: complaint.description || '',
    location: complaint.location || '',
    incidentDate: complaint.incidentDate || null,
  };
};

const toAdminOB = (record) => {
  if (!record) return null;
  const obj = typeof record.toObject === 'function' ? record.toObject({ getters: true }) : record;
  return {
    id: obj._id?.toString?.() || obj.id,
    obNumber: obj.obNumber,
    complaint: mapComplaintRef(obj.complaint),
    citizen: mapUserRef(obj.citizen),
    createdBy: mapUserRef(obj.createdBy),
    assignedOfficer: mapUserRef(obj.assignedOfficer),
    assignedAt: obj.assignedAt,
    status: obj.status,
    investigationNotes: obj.investigationNotes || '',
    citizenSummary: obj.citizenSummary || '',
    closureReason: obj.closureReason || '',
    closedAt: obj.closedAt,
    updates: obj.updates || [],
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const OPEN_STATUSES = ['Opened', 'Assigned', 'Reopened'];
const CLOSED_LIKE = ['Closed', 'Resolved'];

function nowTimeString(date = new Date()) {
  return date.toTimeString().slice(0, 5);
}

function pushActivity(ob, { action, userId, previousValue = '', newValue = '', note = '' }) {
  ob.activityHistory.push({
    action,
    user: userId,
    previousValue,
    newValue,
    note,
    createdAt: new Date(),
  });
}

function canPoliceModify(ob, user) {
  if (user.role === 'admin') return true;
  if (user.role !== 'police') return false;
  if (!ob.assignedOfficer) return false;
  return ob.assignedOfficer.toString() === user._id.toString();
}

function parseDateBoundary(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

function resolveDateRange(query = {}) {
  const { range, dateFrom, dateTo } = query;
  const now = new Date();
  let from = null;
  let to = null;

  if (range === 'today') {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
  } else if (range === 'this_week') {
    from = new Date(now);
    const day = from.getDay();
    const diff = day === 0 ? 6 : day - 1;
    from.setDate(from.getDate() - diff);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
  } else if (range === 'this_month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (range === 'last_month') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    from = parseDateBoundary(dateFrom, false);
    to = parseDateBoundary(dateTo, true);
  }

  return { from, to };
}

function buildStaffFilter(req) {
  const {
    search = '',
    status = '',
    category = '',
    priority = '',
    station = '',
    district = '',
    assignedOfficer = '',
    dateFrom = '',
    dateTo = '',
    range = '',
  } = req.query;

  const filter = {};

  if (req.user.role === 'police') {
    filter.$or = [
      { assignedOfficer: req.user._id },
      { createdBy: req.user._id },
      { recordedBy: req.user._id },
    ];
  }

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (station) filter.station = new RegExp(escapeRegex(station), 'i');
  if (district) filter.district = new RegExp(escapeRegex(district), 'i');
  if (assignedOfficer) filter.assignedOfficer = assignedOfficer;

  const { from, to } = resolveDateRange({ range, dateFrom, dateTo });
  if (from || to) {
    filter.occurrenceDate = {};
    if (from) filter.occurrenceDate.$gte = from;
    if (to) filter.occurrenceDate.$lte = to;
  }

  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    const searchClause = {
      $or: [
        { obNumber: regex },
        { complainantName: regex },
        { subject: regex },
        { location: regex },
        { station: regex },
        { district: regex },
        { description: regex },
      ],
    };

    if (filter.$or) {
      // Police visibility already set — combine with $and
      filter.$and = [{ $or: filter.$or }, searchClause];
      delete filter.$or;
    } else {
      Object.assign(filter, searchClause);
    }
  }

  return filter;
}

function validateOccurrencePayload(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  const requireField = (key, label) => {
    const value = body[key];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`${label} is required.`);
      return null;
    }
    return typeof value === 'string' ? value.trim() : value;
  };

  if (!partial) {
    data.occurrenceDate = requireField('occurrenceDate', 'Date');
    data.occurrenceTime = requireField('occurrenceTime', 'Time');
    data.station = requireField('station', 'Station');
    data.complainantName = requireField('complainantName', 'Complainant name');
    data.complainantPhone = requireField('complainantPhone', 'Complainant phone');
    data.category = requireField('category', 'Category');
    data.subject = requireField('subject', 'Subject');
    data.description = requireField('description', 'Description');
    data.location = requireField('location', 'Location');
    data.district = requireField('district', 'District');
    data.priority = requireField('priority', 'Priority');
  } else {
    const optionalStringFields = [
      'occurrenceTime',
      'timeReported',
      'station',
      'complainantName',
      'complainantPhone',
      'complainantAddress',
      'occurrenceType',
      'subject',
      'description',
      'location',
      'district',
      'actionTaken',
      'followUpNotes',
      'outcome',
      'additionalNotes',
      'citizenSummary',
    ];
    optionalStringFields.forEach((key) => {
      if (body[key] !== undefined) {
        data[key] = String(body[key] ?? '').trim();
      }
    });
    if (body.occurrenceDate !== undefined) data.occurrenceDate = body.occurrenceDate;
    if (body.dateReported !== undefined) data.dateReported = body.dateReported;
    if (body.followUpDate !== undefined) data.followUpDate = body.followUpDate || null;
    if (body.category !== undefined) data.category = body.category;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.status !== undefined) data.status = body.status;
    if (body.assignedOfficer !== undefined) data.assignedOfficer = body.assignedOfficer || null;
  }

  if (data.category && !OB_CATEGORIES.includes(data.category)) {
    errors.push('Invalid occurrence category.');
  }
  if (data.priority && !OB_PRIORITIES.includes(data.priority)) {
    errors.push('Invalid priority. Use LOW, MEDIUM, HIGH, or CRITICAL.');
  }
  if (data.status && !OB_STATUSES.includes(data.status)) {
    errors.push('Invalid occurrence status.');
  }
  if (data.occurrenceDate) {
    const d = new Date(data.occurrenceDate);
    if (Number.isNaN(d.getTime())) errors.push('Invalid occurrence date.');
    else data.occurrenceDate = d;
  }
  if (data.dateReported) {
    const d = new Date(data.dateReported);
    if (Number.isNaN(d.getTime())) errors.push('Invalid reported date.');
    else data.dateReported = d;
  }
  if (data.followUpDate) {
    const d = new Date(data.followUpDate);
    if (Number.isNaN(d.getTime())) errors.push('Invalid follow-up date.');
    else data.followUpDate = d;
  }

  return { ok: errors.length === 0, errors, data };
}

// ─── Citizen endpoints (unchanged behaviour) ─────────────────────────────────

export const getMyOBRecords = asyncHandler(async (req, res) => {
  const records = await OBRecord.find({ citizen: req.user._id })
    .populate('complaint')
    .populate('assignedOfficer', 'name badgeNumber station')
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: {
      records: records.map((item) => item.toCitizenObject(item.complaint)),
    },
  });
});

export const getMyOBById = asyncHandler(async (req, res) => {
  const record = await OBRecord.findOne({
    _id: req.params.id,
    citizen: req.user._id,
  })
    .populate('complaint')
    .populate('assignedOfficer', 'name badgeNumber station');

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  return res.json({
    success: true,
    data: { record: record.toCitizenObject(record.complaint) },
  });
});

const syncComplaintFromOB = async (ob, status, note, userId) => {
  if (!ob.complaint) return;

  const complaint = await Complaint.findById(ob.complaint);
  if (!complaint) return;

  const mapped = {
    'Under Investigation': 'Under Investigation',
    'Investigation Completed': 'Investigation Completed',
    Resolved: 'Resolved',
    Closed: 'Closed',
    Reopened: 'Reopened',
    Assigned: 'OB Created',
  };

  const nextStatus = mapped[status];
  if (!nextStatus) return;

  complaint.status = nextStatus;
  complaint.statusHistory.push({
    status: nextStatus,
    note: note || '',
    changedBy: userId,
    changedAt: new Date(),
  });
  await complaint.save();
};

// ─── Staff list / meta / stats / reports ─────────────────────────────────────

export const getOBMeta = asyncHandler(async (_req, res) => {
  const officers = await User.find({
    role: { $in: ['police', 'admin'] },
    isActive: true,
  })
    .select('name badgeNumber station role')
    .sort({ name: 1 });

  return res.json({
    success: true,
    data: {
      statuses: OB_STATUSES,
      priorities: OB_PRIORITIES,
      categories: OB_CATEGORIES,
      officers: officers.map((o) => ({
        id: o._id.toString(),
        name: o.name,
        badgeNumber: o.badgeNumber || '',
        station: o.station || '',
        role: o.role,
      })),
    },
  });
});

export const staffListOBs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const skip = (page - 1) * limit;
  const filter = buildStaffFilter(req);

  // Officer name search (after basic filter) — resolve matching officer IDs
  if (req.query.search?.trim()) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    const officers = await User.find({
      role: { $in: ['police', 'admin'] },
      name: regex,
    }).select('_id');
    if (officers.length) {
      const officerIds = officers.map((o) => o._id);
      const officerClause = { assignedOfficer: { $in: officerIds } };
      if (filter.$and) {
        filter.$and[1].$or.push(officerClause);
      } else if (filter.$or) {
        filter.$or.push(officerClause);
      }
    }
  }

  const [records, total] = await Promise.all([
    OBRecord.find(filter)
      .populate(STAFF_POPULATE)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    OBRecord.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: {
      records: records.map((item) => item.toStaffObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

export const staffGetOBById = asyncHandler(async (req, res) => {
  const record = await loadStaffOB(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  if (req.user.role === 'police') {
    const allowed =
      (record.assignedOfficer &&
        record.assignedOfficer._id?.toString() === req.user._id.toString()) ||
      (record.createdBy && record.createdBy._id?.toString() === req.user._id.toString()) ||
      (record.recordedBy && record.recordedBy._id?.toString() === req.user._id.toString());

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this occurrence.',
      });
    }
  }

  return res.json({
    success: true,
    data: { record: record.toStaffObject() },
  });
});

export const staffCreateOB = asyncHandler(async (req, res) => {
  const validation = validateOccurrencePayload(req.body, { partial: false });
  if (!validation.ok) {
    return res.status(400).json({
      success: false,
      message: validation.errors[0],
      errors: validation.errors,
    });
  }

  const { data } = validation;
  const now = new Date();
  let assignedOfficer = null;

  const rawOfficerId = req.body.assignedOfficer;
  if (rawOfficerId && String(rawOfficerId).trim()) {
    if (!mongoose.Types.ObjectId.isValid(String(rawOfficerId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assigned officer id.',
      });
    }

    assignedOfficer = await User.findOne({
      _id: rawOfficerId,
      role: { $in: ['police', 'admin'] },
      isActive: true,
    });
    if (!assignedOfficer) {
      return res.status(404).json({
        success: false,
        message: 'Assigned officer not found.',
      });
    }
  }

  const obNumber = await generateOBNumber();
  const status = assignedOfficer ? 'Assigned' : 'Opened';

  // Standalone OB — do not set complaint/citizen (avoids unique-null index conflicts)
  const createPayload = {
    obNumber,
    occurrenceDate: data.occurrenceDate,
    occurrenceTime: data.occurrenceTime,
    dateReported: data.dateReported || now,
    timeReported: req.body.timeReported || nowTimeString(now),
    station: data.station,
    complainantName: data.complainantName,
    complainantPhone: data.complainantPhone,
    complainantAddress: String(req.body.complainantAddress || '').trim(),
    category: data.category,
    occurrenceType: String(req.body.occurrenceType || data.category).trim(),
    subject: data.subject,
    description: data.description,
    location: data.location,
    district: data.district,
    priority: data.priority,
    recordedBy: req.user._id,
    createdBy: req.user._id,
    updatedBy: req.user._id,
    status,
    actionTaken: String(req.body.actionTaken || '').trim(),
    followUpNotes: String(req.body.followUpNotes || '').trim(),
    additionalNotes: String(req.body.additionalNotes || '').trim(),
    updates: [
      {
        title: 'OB Created',
        note: 'Occurrence Book entry created.',
        visibleToCitizen: false,
        createdBy: req.user._id,
        createdAt: now,
      },
    ],
    activityHistory: [
      {
        action: 'Created',
        user: req.user._id,
        previousValue: '',
        newValue: status,
        note: `Occurrence ${obNumber} created.`,
        createdAt: now,
      },
    ],
  };

  if (assignedOfficer) {
    createPayload.assignedOfficer = assignedOfficer._id;
    createPayload.assignedAt = now;
  }

  if (req.body.followUpDate && String(req.body.followUpDate).trim()) {
    const followUp = new Date(req.body.followUpDate);
    if (!Number.isNaN(followUp.getTime())) {
      createPayload.followUpDate = followUp;
    }
  }

  const ob = await OBRecord.create(createPayload);

  if (assignedOfficer) {
    pushActivity(ob, {
      action: 'Assigned',
      userId: req.user._id,
      previousValue: '',
      newValue: assignedOfficer.name,
      note: 'Officer assigned at creation.',
    });
    await ob.save();
  }

  const populated = await loadStaffOB(ob._id);
  const record = populated ? populated.toStaffObject() : ob.toStaffObject();

  return res.status(201).json({
    success: true,
    message: 'Data has been saved successfully.',
    data: { record },
  });
});

export const staffUpdateOB = asyncHandler(async (req, res) => {
  const ob = await OBRecord.findById(req.params.id);
  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  if (!canPoliceModify(ob, req.user) && req.user.role !== 'admin') {
    // Police who created unassigned OBs may still edit
    const isCreator = ob.createdBy?.toString() === req.user._id.toString();
    if (!(req.user.role === 'police' && isCreator && !ob.assignedOfficer)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this occurrence.',
      });
    }
  }

  const validation = validateOccurrencePayload(req.body, { partial: true });
  if (!validation.ok) {
    return res.status(400).json({
      success: false,
      message: validation.errors[0],
      errors: validation.errors,
    });
  }

  const { data } = validation;
  const trackedFields = [
    'subject',
    'category',
    'priority',
    'station',
    'district',
    'location',
    'complainantName',
    'actionTaken',
    'outcome',
    'followUpNotes',
    'additionalNotes',
  ];

  trackedFields.forEach((field) => {
    if (data[field] !== undefined && String(ob[field] || '') !== String(data[field] || '')) {
      pushActivity(ob, {
        action: 'Updated',
        userId: req.user._id,
        previousValue: String(ob[field] || ''),
        newValue: String(data[field] || ''),
        note: `${field} updated.`,
      });
    }
  });

  Object.assign(ob, data);

  if (req.body.followUpDate !== undefined) {
    ob.followUpDate = req.body.followUpDate ? new Date(req.body.followUpDate) : null;
  }

  if (data.actionTaken !== undefined && data.actionTaken) {
    pushActivity(ob, {
      action: 'Action added',
      userId: req.user._id,
      previousValue: '',
      newValue: data.actionTaken,
      note: 'Action taken recorded.',
    });
  }

  ob.updatedBy = req.user._id;
  await ob.save();

  const populated = await loadStaffOB(ob._id);
  return res.json({
    success: true,
    message: 'Occurrence updated successfully.',
    data: { record: populated.toStaffObject() },
  });
});

export const staffChangeStatus = asyncHandler(async (req, res) => {
  const { status, note = '' } = req.body;
  if (!status || !OB_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'A valid status is required.',
    });
  }

  const ob = await OBRecord.findById(req.params.id);
  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  // Admin can always change; police only if assigned/creator
  if (req.user.role === 'police' && !canPoliceModify(ob, req.user)) {
    const isCreator = ob.createdBy?.toString() === req.user._id.toString();
    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to change this status.',
      });
    }
  }

  // Only admin may close/reopen/resolve via dedicated endpoints preferred,
  // but allow status change to Pending / Under Investigation for police
  if (['Closed', 'Resolved', 'Reopened'].includes(status) && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only an admin can set this status. Use close/reopen endpoints.',
    });
  }

  const previous = ob.status;
  ob.status = status;
  ob.updatedBy = req.user._id;
  pushActivity(ob, {
    action: 'Status changed',
    userId: req.user._id,
    previousValue: previous,
    newValue: status,
    note: note || `Status changed from ${previous} to ${status}.`,
  });
  ob.updates.push({
    title: 'Status Updated',
    note: note || `Status changed to ${status}.`,
    visibleToCitizen: Boolean(ob.citizen),
    createdBy: req.user._id,
    createdAt: new Date(),
  });
  await ob.save();
  await syncComplaintFromOB(ob, status, note, req.user._id);

  if (ob.citizen) {
    await createNotification({
      userId: ob.citizen,
      title: 'OB Status Updated',
      message: `OB ${ob.obNumber} status is now ${status}.`,
      type: 'investigation_update',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
    });
  }

  const populated = await loadStaffOB(ob._id);
  return res.json({
    success: true,
    message: 'Status updated successfully.',
    data: { record: populated.toStaffObject() },
  });
});

export const staffCloseOB = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only an admin can close an occurrence.',
    });
  }

  const ob = await OBRecord.findById(req.params.id);
  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  const note = String(req.body.note || req.body.closureReason || 'Case closed.').trim();
  const previous = ob.status;
  ob.status = 'Closed';
  ob.closureReason = note;
  ob.closedAt = new Date();
  ob.closedBy = req.user._id;
  ob.updatedBy = req.user._id;
  if (req.body.outcome) ob.outcome = String(req.body.outcome).trim();

  pushActivity(ob, {
    action: 'Closed',
    userId: req.user._id,
    previousValue: previous,
    newValue: 'Closed',
    note,
  });
  ob.updates.push({
    title: 'OB Closed',
    note,
    visibleToCitizen: Boolean(ob.citizen),
    createdBy: req.user._id,
    createdAt: new Date(),
  });
  await ob.save();
  await syncComplaintFromOB(ob, 'Closed', note, req.user._id);

  if (ob.citizen) {
    await createNotification({
      userId: ob.citizen,
      title: 'OB Closed',
      message: `OB ${ob.obNumber} has been closed.`,
      type: 'ob_closed',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
    });
  }

  const populated = await loadStaffOB(ob._id);
  return res.json({
    success: true,
    message: 'Occurrence closed successfully.',
    data: { record: populated.toStaffObject() },
  });
});

export const staffReopenOB = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only an admin can reopen an occurrence.',
    });
  }

  const ob = await OBRecord.findById(req.params.id);
  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  if (!['Closed', 'Resolved'].includes(ob.status)) {
    return res.status(400).json({
      success: false,
      message: 'Only closed or resolved occurrences can be reopened.',
    });
  }

  const note = String(req.body.note || 'Occurrence reopened.').trim();
  const previous = ob.status;
  ob.status = 'Reopened';
  ob.closedAt = null;
  ob.updatedBy = req.user._id;

  pushActivity(ob, {
    action: 'Reopened',
    userId: req.user._id,
    previousValue: previous,
    newValue: 'Reopened',
    note,
  });
  ob.updates.push({
    title: 'OB Reopened',
    note,
    visibleToCitizen: Boolean(ob.citizen),
    createdBy: req.user._id,
    createdAt: new Date(),
  });
  await ob.save();
  await syncComplaintFromOB(ob, 'Reopened', note, req.user._id);

  if (ob.citizen) {
    await createNotification({
      userId: ob.citizen,
      title: 'OB Reopened',
      message: `OB ${ob.obNumber} has been reopened.`,
      type: 'ob_reopened',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
    });
  }

  const populated = await loadStaffOB(ob._id);
  return res.json({
    success: true,
    message: 'Occurrence reopened successfully.',
    data: { record: populated.toStaffObject() },
  });
});

export const staffDeleteOB = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only an admin can delete an occurrence.',
    });
  }

  const ob = await OBRecord.findById(req.params.id);
  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  await ob.deleteOne();

  return res.json({
    success: true,
    message: 'Occurrence deleted successfully.',
  });
});

export const staffOBStats = asyncHandler(async (req, res) => {
  const baseFilter = buildStaffFilter(req);

  const [total, byStatus, byCategory, byPriority, byDistrict, byStation, openCount, closedCount] =
    await Promise.all([
      OBRecord.countDocuments(baseFilter),
      OBRecord.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      OBRecord.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      OBRecord.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      OBRecord.aggregate([
        { $match: baseFilter },
        { $group: { _id: { $ifNull: ['$district', ''] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      OBRecord.aggregate([
        { $match: baseFilter },
        { $group: { _id: { $ifNull: ['$station', ''] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      OBRecord.countDocuments({
        ...baseFilter,
        status: { $in: [...OPEN_STATUSES, 'Pending', 'Under Investigation', 'Investigation Completed'] },
      }),
      OBRecord.countDocuments({
        ...baseFilter,
        status: { $in: CLOSED_LIKE },
      }),
    ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));

  const trendGranularity = ['day', 'week', 'month'].includes(req.query.trend)
    ? req.query.trend
    : 'month';
  const dateField = { $ifNull: ['$occurrenceDate', '$createdAt'] };

  let trendGroupId;
  if (trendGranularity === 'day') {
    trendGroupId = {
      year: { $year: dateField },
      month: { $month: dateField },
      day: { $dayOfMonth: dateField },
    };
  } else if (trendGranularity === 'week') {
    trendGroupId = {
      year: { $isoWeekYear: dateField },
      week: { $isoWeek: dateField },
    };
  } else {
    trendGroupId = {
      year: { $year: dateField },
      month: { $month: dateField },
    };
  }

  const trendLimit = trendGranularity === 'day' ? 31 : trendGranularity === 'week' ? 12 : 24;

  const trendRows = await OBRecord.aggregate([
    { $match: baseFilter },
    { $group: { _id: trendGroupId, count: { $sum: 1 } } },
    { $sort: trendGranularity === 'day' ? { '_id.year': 1, '_id.month': 1, '_id.day': 1 } : trendGranularity === 'week' ? { '_id.year': 1, '_id.week': 1 } : { '_id.year': 1, '_id.month': 1 } },
    { $limit: trendLimit },
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

  const monthly = await OBRecord.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: {
          year: { $year: { $ifNull: ['$occurrenceDate', '$createdAt'] } },
          month: { $month: { $ifNull: ['$occurrenceDate', '$createdAt'] } },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 24 },
  ]);

  return res.json({
    success: true,
    data: {
      summary: {
        total,
        open: (statusMap.Opened || 0) + (statusMap.Assigned || 0) + (statusMap.Reopened || 0),
        underInvestigation: statusMap['Under Investigation'] || 0,
        pending: statusMap.Pending || 0,
        resolved: statusMap.Resolved || 0,
        closed: statusMap.Closed || 0,
        openVsClosed: { open: openCount, closed: closedCount },
      },
      byStatus: byStatus.map((s) => ({ status: s._id || 'Unknown', count: s.count })),
      byCategory: byCategory.map((s) => ({ category: s._id || 'Other', count: s.count })),
      byPriority: byPriority.map((s) => ({ priority: s._id || 'MEDIUM', count: s.count })),
      byDistrict: byDistrict
        .filter((s) => s._id)
        .map((s) => ({ district: s._id, count: s.count })),
      byStation: byStation
        .filter((s) => s._id)
        .map((s) => ({ station: s._id, count: s.count })),
      monthlyTrends: monthly.map((m) => ({
        year: m._id.year,
        month: m._id.month,
        label: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        count: m.count,
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
  const filter = buildStaffFilter(req);
  const records = await OBRecord.find(filter)
    .populate('assignedOfficer', 'name badgeNumber')
    .sort({ occurrenceDate: -1, createdAt: -1 })
    .limit(5000);

  const header = [
    'OB Number',
    'Date',
    'Time',
    'Station',
    'Complainant',
    'Phone',
    'Category',
    'Subject',
    'Location',
    'District',
    'Priority',
    'Status',
    'Assigned Officer',
    'Created At',
  ];

  const rows = records.map((r) => [
    r.obNumber,
    r.occurrenceDate ? new Date(r.occurrenceDate).toISOString().slice(0, 10) : '',
    r.occurrenceTime || '',
    r.station || '',
    r.complainantName || '',
    r.complainantPhone || '',
    r.category || '',
    r.subject || '',
    r.location || '',
    r.district || '',
    r.priority || '',
    r.status || '',
    r.assignedOfficer?.name || '',
    r.createdAt ? new Date(r.createdAt).toISOString() : '',
  ]);

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

// ─── Existing admin/police workflow (complaint-linked) ───────────────────────

export const adminAssignOfficer = asyncHandler(async (req, res) => {
  const { officerId } = req.body;
  const ob = await OBRecord.findById(req.params.id);

  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  const officer = await User.findOne({
    _id: officerId,
    role: { $in: ['police', 'admin'] },
    isActive: true,
  });

  if (!officer) {
    return res.status(404).json({
      success: false,
      message: 'Police officer not found.',
    });
  }

  const previousOfficer = ob.assignedOfficer?.toString() || '';
  ob.assignedOfficer = officer._id;
  ob.assignedAt = new Date();
  ob.status = 'Assigned';
  ob.updatedBy = req.user._id;
  ob.updates.push({
    title: 'Police Assigned',
    note: `An investigating officer has been assigned to ${ob.obNumber}.`,
    visibleToCitizen: Boolean(ob.citizen),
    createdBy: req.user._id,
    createdAt: new Date(),
  });
  pushActivity(ob, {
    action: 'Assigned',
    userId: req.user._id,
    previousValue: previousOfficer,
    newValue: officer.name,
    note: `Assigned to ${officer.name}.`,
  });
  await ob.save();

  if (ob.citizen) {
    await createNotification({
      userId: ob.citizen,
      title: 'Police Assigned',
      message: `A police officer has been assigned to OB ${ob.obNumber}.`,
      type: 'police_assigned',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
    });
  }

  await createNotification({
    userId: officer._id,
    title: 'New OB Assignment',
    message: `You have been assigned to OB ${ob.obNumber}.`,
    type: 'ob_assigned_officer',
    relatedComplaint: ob.complaint,
    relatedOB: ob._id,
    relatedUser: officer._id,
    linkPath: `/ob-records/${ob._id}`,
  });

  const populated = await loadStaffOB(ob._id);
  return res.json({
    success: true,
    message: 'Officer assigned successfully.',
    data: { record: populated.toStaffObject(), ob: populated },
  });
});

export const policeUpdateInvestigation = asyncHandler(async (req, res) => {
  const { action, note, citizenSummary, title, progress, visibleToCitizen } =
    req.body;
  const ob = await OBRecord.findById(req.params.id).select('+investigationNotes');

  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  if (!canAccessAssignedOB(ob, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Only the assigned officer or an admin can update this OB.',
    });
  }

  if (action === 'start') {
    if (COMPLETED_STATUSES.includes(ob.status)) {
      return res.status(400).json({
        success: false,
        message: 'A completed investigation cannot be started again.',
      });
    }
    if (ob.status === 'Under Investigation' && ob.investigationStartedAt) {
      return res.status(400).json({
        success: false,
        message: 'Investigation has already been started.',
      });
    }
    const previous = ob.status;
    ob.status = 'Under Investigation';
    if (!ob.investigationStartedAt) {
      ob.investigationStartedAt = new Date();
    }
    ob.investigationCompletedAt = null;
    if (note) {
      appendInvestigationNote(ob, note, req.user._id);
      ob.actionTaken = note;
    }
    ob.updatedBy = req.user._id;
    ob.updates.push({
      title: 'Investigation Started',
      note: note || 'Investigation has started on your case.',
      visibleToCitizen: Boolean(ob.citizen),
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    pushActivity(ob, {
      action: 'Status changed',
      userId: req.user._id,
      previousValue: previous,
      newValue: 'Under Investigation',
      note: note || 'Investigation started.',
    });
    await ob.save();
    await syncComplaintFromOB(ob, 'Under Investigation', note, req.user._id);
    if (ob.citizen) {
      await createNotification({
        userId: ob.citizen,
        title: 'Investigation Started',
        message: `Investigation has started for OB ${ob.obNumber}.`,
        type: 'investigation_started',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
      });
    }
  } else if (action === 'progress') {
    if (ob.status !== 'Under Investigation') {
      return res.status(400).json({
        success: false,
        message: 'Start the investigation before recording progress.',
      });
    }
    const nextProgress = Number(progress);
    if (Number.isNaN(nextProgress) || nextProgress < 0 || nextProgress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be a number between 0 and 100.',
      });
    }
    ob.investigationProgress = nextProgress;
    if (note) {
      appendInvestigationNote(ob, note, req.user._id);
    }
    ob.updates.push({
      title: 'Investigation Progress',
      note: note || `Investigation progress updated to ${nextProgress}%.`,
      visibleToCitizen: false,
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    await ob.save();
  } else if (action === 'note') {
    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'Note is required.',
      });
    }
    appendInvestigationNote(ob, note, req.user._id);
    if (citizenSummary) {
      ob.citizenSummary = citizenSummary;
      ob.updates.push({
        title: 'Investigation Update',
        note: citizenSummary,
        visibleToCitizen: true,
        createdBy: req.user._id,
        createdAt: new Date(),
      });
      await ob.save();
      await createNotification({
        userId: ob.citizen,
        title: 'Case Update',
        message: `There is a new update on OB ${ob.obNumber}.`,
        type: 'investigation_update',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
      });
    } else {
      await ob.save();
    }
    ob.followUpNotes = note;
    ob.updatedBy = req.user._id;
    pushActivity(ob, {
      action: 'Action added',
      userId: req.user._id,
      previousValue: '',
      newValue: note,
      note: 'Investigation note added.',
    });
    await ob.save();
  } else if (action === 'update') {
    const updateNote = String(note || '').trim();
    if (!updateNote) {
      return res.status(400).json({
        success: false,
        message: 'Update note is required.',
      });
    }
    const shareWithCitizen = Boolean(visibleToCitizen);
    ob.updates.push({
      title: String(title || 'Investigation Update').trim() || 'Investigation Update',
      note: updateNote,
      visibleToCitizen: shareWithCitizen,
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    await ob.save();
    if (shareWithCitizen && ob.citizen) {
      await createNotification({
        userId: ob.citizen,
        title: 'Case Update',
        message: `There is a new update on OB ${ob.obNumber}.`,
        type: 'investigation_update',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
      });
    }
  } else if (action === 'complete') {
    if (COMPLETED_STATUSES.includes(ob.status)) {
      return res.status(400).json({
        success: false,
        message: 'This investigation is already completed.',
      });
    }
    if (ob.status !== 'Under Investigation' && ob.status !== 'Reopened') {
      return res.status(400).json({
        success: false,
        message: 'Start the investigation before completing it.',
      });
    }
    const previous = ob.status;
    ob.status = 'Investigation Completed';
    ob.investigationCompletedAt = new Date();
    ob.investigationProgress = 100;
    if (note) {
      appendInvestigationNote(ob, note, req.user._id);
      ob.outcome = note;
    }
    if (citizenSummary) {
      ob.citizenSummary = citizenSummary;
    }
    ob.updatedBy = req.user._id;
    ob.updates.push({
      title: 'Investigation Completed',
      note: citizenSummary || note || 'Investigation has been completed.',
      visibleToCitizen: Boolean(ob.citizen),
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    pushActivity(ob, {
      action: 'Status changed',
      userId: req.user._id,
      previousValue: previous,
      newValue: 'Investigation Completed',
      note: note || 'Investigation completed.',
    });
    await ob.save();
    await syncComplaintFromOB(
      ob,
      'Investigation Completed',
      note,
      req.user._id
    );
    if (ob.citizen) {
      await createNotification({
        userId: ob.citizen,
        title: 'Investigation Completed',
        message: `Investigation completed for OB ${ob.obNumber}.`,
        type: 'investigation_completed',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Action must be start, progress, note, update, or complete.',
    });
  }

  const updated = await loadStaffOB(ob._id, { withNotes: true });

  return res.json({
    success: true,
    message: 'OB updated successfully.',
    data: { ob: updated.toStaffObject(updated.complaint, updated.citizen) },
  });
});

export const policeAddEvidence = asyncHandler(async (req, res) => {
  const note = String(req.body?.note || '').trim();
  const ob = await OBRecord.findById(req.params.id).select('+investigationNotes');

  if (!ob) {
    if (req.file?.filename) {
      removeEvidenceFile(evidencePublicPath(req.file.filename));
    }
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  if (!canAccessAssignedOB(ob, req.user)) {
    if (req.file?.filename) {
      removeEvidenceFile(evidencePublicPath(req.file.filename));
    }
    return res.status(403).json({
      success: false,
      message: 'Only the assigned officer or an admin can update this OB.',
    });
  }

  if (!req.file && !note) {
    return res.status(400).json({
      success: false,
      message: 'Attach an evidence file or add an evidence note.',
    });
  }

  const fileUrl = req.file ? evidencePublicPath(req.file.filename) : '';
  ob.evidence = ob.evidence || [];
  ob.evidence.push({
    fileName: req.file?.filename || '',
    originalName: req.file?.originalname || '',
    mimeType: req.file?.mimetype || '',
    url: fileUrl,
    note,
    createdBy: req.user._id,
    createdAt: new Date(),
  });
  ob.updates.push({
    title: 'Evidence Added',
    note: note || (req.file ? `Evidence file added: ${req.file.originalname}` : 'Evidence added.'),
    visibleToCitizen: false,
    createdBy: req.user._id,
    createdAt: new Date(),
  });
  await ob.save();

  const updated = await loadStaffOB(ob._id, { withNotes: true });

  return res.json({
    success: true,
    message: 'Evidence added successfully.',
    data: { ob: updated.toStaffObject(updated.complaint, updated.citizen) },
  });
});

export const adminResolveCloseReopen = asyncHandler(async (req, res) => {
  const { action, note } = req.body;
  const ob = await OBRecord.findById(req.params.id);

  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  if (!['resolve', 'close', 'reopen'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Action must be resolve, close, or reopen.',
    });
  }

  if (action === 'resolve') {
    const previous = ob.status;
    ob.status = 'Resolved';
    ob.updatedBy = req.user._id;
    if (note) ob.outcome = note;
    ob.updates.push({
      title: 'OB Resolved',
      note: note || 'Your case has been resolved.',
      visibleToCitizen: Boolean(ob.citizen),
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    pushActivity(ob, {
      action: 'Status changed',
      userId: req.user._id,
      previousValue: previous,
      newValue: 'Resolved',
      note: note || 'Resolved.',
    });
    await ob.save();
    await syncComplaintFromOB(ob, 'Resolved', note, req.user._id);
    if (ob.citizen) {
      await createNotification({
        userId: ob.citizen,
        title: 'OB Resolved',
        message: `OB ${ob.obNumber} has been resolved.`,
        type: 'ob_resolved',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
      });
    }
  }

  if (action === 'close') {
    const previous = ob.status;
    ob.status = 'Closed';
    ob.closureReason = note || 'Case closed.';
    ob.closedAt = new Date();
    ob.closedBy = req.user._id;
    ob.updatedBy = req.user._id;
    ob.updates.push({
      title: 'OB Closed',
      note: ob.closureReason,
      visibleToCitizen: Boolean(ob.citizen),
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    pushActivity(ob, {
      action: 'Closed',
      userId: req.user._id,
      previousValue: previous,
      newValue: 'Closed',
      note: ob.closureReason,
    });
    await ob.save();
    await syncComplaintFromOB(ob, 'Closed', note, req.user._id);
    if (ob.citizen) {
      await createNotification({
        userId: ob.citizen,
        title: 'OB Closed',
        message: `OB ${ob.obNumber} has been closed.`,
        type: 'ob_closed',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
      });
    }
  }

  if (action === 'reopen') {
    const previous = ob.status;
    ob.status = 'Reopened';
    ob.closedAt = null;
    ob.updatedBy = req.user._id;
    ob.updates.push({
      title: 'OB Reopened',
      note: note || 'Your case has been reopened.',
      visibleToCitizen: Boolean(ob.citizen),
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    pushActivity(ob, {
      action: 'Reopened',
      userId: req.user._id,
      previousValue: previous,
      newValue: 'Reopened',
      note: note || 'Reopened.',
    });
    await ob.save();
    await syncComplaintFromOB(ob, 'Reopened', note, req.user._id);
    if (ob.citizen) {
      await createNotification({
        userId: ob.citizen,
        title: 'OB Reopened',
        message: `OB ${ob.obNumber} has been reopened.`,
        type: 'ob_reopened',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
      });
    }
  }

  const populated = await loadStaffOB(ob._id);
  return res.json({
    success: true,
    message: 'OB status updated successfully.',
    data: { record: populated.toStaffObject(), ob: populated },
  });
});

export const adminDeleteOB = asyncHandler(async (req, res) => {
  const ob = await OBRecord.findById(req.params.id);
  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  const label = ob.obNumber;
  const complaintId = ob.complaint;
  await ob.deleteOne();

  const complaint = await Complaint.findById(complaintId);
  if (complaint && complaint.status === 'OB Created') {
    complaint.status = 'Verified';
    complaint.statusHistory.push({
      status: 'Verified',
      note: `OB ${label} deleted. Complaint returned to Verified.`,
      changedBy: req.user._id,
      changedAt: new Date(),
    });
    await complaint.save();
  }

  await createAuditLog({
    actor: req.user,
    action: 'DELETE',
    recordType: 'OBRecord',
    recordId: ob._id,
    recordLabel: label,
    previousValue: label,
    newValue: '',
    details: `OB record ${label} deleted.`,
    ipAddress: getRequestIp(req),
  });

  return res.json({
    success: true,
    message: 'OB record deleted successfully.',
  });
});

export { COMPLAINT_CATEGORY_TO_OB, OB_STATUSES };
