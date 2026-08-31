import mongoose from 'mongoose';
import OBRecord, { OB_STATUSES } from '../models/OBRecord.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import {
  asyncHandler,
  createAuditLog,
  getRequestIp,
} from '../utils/helpers.js';
import {
  actorFields,
  notifyAdmins,
  notifyUser,
  obPath,
} from '../utils/notifyEvent.js';
import {
  evidencePublicPath,
  removeEvidenceFile,
} from '../middleware/uploadEvidence.js';
import {
  buildReportsFilter,
  toReportRecord,
} from '../utils/obReportHelpers.js';

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

const populateStaffOB = (query) =>
  query
    .populate('complaint')
    .populate('citizen', 'name email phone niraId')
    .populate('assignedOfficer', 'name badgeNumber station')
    .populate('createdBy', 'name email')
    .populate('updates.createdBy', 'name email')
    .populate('evidence.createdBy', 'name email')
    .populate('assignmentHistory.officer', 'name badgeNumber station')
    .populate('assignmentHistory.assignedBy', 'name email');

const loadStaffOB = async (id, { withNotes = false } = {}) => {
  let query = OBRecord.findById(id);
  if (withNotes) query = query.select('+investigationNotes');
  return populateStaffOB(query);
};

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  if (typeof record.toStaffObject === 'function') {
    const staff = record.toStaffObject(record.complaint, record.citizen);
    return {
      ...staff,
      createdBy: mapUserRef(record.createdBy || record.toObject?.()?.createdBy),
    };
  }
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
    investigationNoteEntries: obj.investigationNoteEntries || [],
    investigationProgress: Number(obj.investigationProgress || 0),
    investigationStartedAt: obj.investigationStartedAt,
    investigationCompletedAt: obj.investigationCompletedAt,
    citizenSummary: obj.citizenSummary || '',
    closureReason: obj.closureReason || '',
    closedAt: obj.closedAt,
    assignmentHistory: obj.assignmentHistory || [],
    evidence: (obj.evidence || []).map((item) => ({
      id: item._id?.toString?.() || item.id,
      fileName: item.fileName || '',
      originalName: item.originalName || '',
      mimeType: item.mimeType || '',
      url: item.url || '',
      note: item.note || '',
      createdAt: item.createdAt,
    })),
    updates: obj.updates || [],
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const getCitizenComplaintIds = async (userId) =>
  Complaint.find({ citizen: userId }).distinct('_id');

const citizenCanAccessOB = async (record, userId) => {
  if (!record) return false;
  const citizenId = userId.toString();
  const ownerId =
    record.citizen?._id?.toString?.() || record.citizen?.toString?.() || '';
  if (ownerId && ownerId === citizenId) return true;

  const complaintId =
    record.complaint?._id?.toString?.() || record.complaint?.toString?.() || '';
  if (!complaintId) return false;

  const owned = await Complaint.exists({
    _id: complaintId,
    citizen: userId,
  });
  return Boolean(owned);
};

const findCitizenOBRecords = async (userId) => {
  const complaintIds = await getCitizenComplaintIds(userId);
  const filter =
    complaintIds.length > 0
      ? {
          $or: [{ citizen: userId }, { complaint: { $in: complaintIds } }],
        }
      : { citizen: userId };

  return OBRecord.find(filter)
    .populate('complaint')
    .populate('assignedOfficer', 'name badgeNumber station')
    .sort({ updatedAt: -1, createdAt: -1 });
};

export const getMyOBRecords = asyncHandler(async (req, res) => {
  const records = await findCitizenOBRecords(req.user._id);

  return res.json({
    success: true,
    data: {
      records: records.map((item) => item.toCitizenObject(item.complaint)),
    },
  });
});

export const getMyOBById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trimmedId = String(id || '').trim();

  let record = null;

  if (mongoose.isValidObjectId(trimmedId)) {
    record = await OBRecord.findById(trimmedId)
      .populate('complaint')
      .populate('assignedOfficer', 'name badgeNumber station');
  } else if (/^OB-/i.test(trimmedId)) {
    record = await OBRecord.findOne({
      obNumber: new RegExp(`^${escapeRegex(trimmedId)}$`, 'i'),
    })
      .populate('complaint')
      .populate('assignedOfficer', 'name badgeNumber station');
  }

  if (!(await citizenCanAccessOB(record, req.user._id))) {
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

const appendAssignmentHistory = (ob, officer, assignedBy, note = '') => {
  ob.assignmentHistory = Array.isArray(ob.assignmentHistory)
    ? ob.assignmentHistory
    : [];
  ob.assignmentHistory.push({
    officer: officer._id,
    officerName: officer.name || '',
    badgeNumber: officer.badgeNumber || '',
    station: officer.station || '',
    assignedAt: new Date(),
    assignedBy: assignedBy || null,
    note: note || '',
  });
};

const ensurePreviousAssignmentInHistory = async (ob) => {
  if (!ob.assignedOfficer) return null;
  const previousId = String(ob.assignedOfficer._id || ob.assignedOfficer);
  ob.assignmentHistory = Array.isArray(ob.assignmentHistory)
    ? ob.assignmentHistory
    : [];
  const alreadyTracked = ob.assignmentHistory.some(
    (item) => String(item.officer?._id || item.officer) === previousId
  );
  if (alreadyTracked) {
    return typeof ob.assignedOfficer === 'object' && ob.assignedOfficer.name
      ? ob.assignedOfficer
      : await User.findById(previousId).select('name badgeNumber station role');
  }

  const previous =
    typeof ob.assignedOfficer === 'object' && ob.assignedOfficer.name
      ? ob.assignedOfficer
      : await User.findById(previousId).select('name badgeNumber station role');

  if (previous) {
    ob.assignmentHistory.push({
      officer: previous._id,
      officerName: previous.name || '',
      badgeNumber: previous.badgeNumber || '',
      station: previous.station || '',
      assignedAt: ob.assignedAt || ob.createdAt || new Date(),
      assignedBy: null,
      note: 'Previous assignment preserved before reassignment.',
    });
  }
  return previous;
};

export const adminAssignOfficer = asyncHandler(async (req, res) => {
  const { officerId } = req.body;
  const ob = await OBRecord.findById(req.params.id);

  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  if (ob.status === 'Closed') {
    return res.status(400).json({
      success: false,
      message: 'This record is closed and cannot be assigned.',
    });
  }

  if (ob.status === 'Resolved') {
    return res.status(400).json({
      success: false,
      message: 'This record is resolved and cannot be assigned.',
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

  const previousOfficerId = ob.assignedOfficer
    ? String(ob.assignedOfficer._id || ob.assignedOfficer)
    : '';
  const previousOfficer = await ensurePreviousAssignmentInHistory(ob);

  // Same OBE record — never clone. Preserve investigation workflow after reopen.
  const keepUnderInvestigation =
    ob.status === 'Under Investigation' ||
    ob.status === 'Reopened' ||
    Boolean(ob.investigationStartedAt);

  ob.assignedOfficer = officer._id;
  ob.assignedAt = new Date();
  if (!keepUnderInvestigation) {
    ob.status = 'Assigned';
  }

  const historyNote = previousOfficer
    ? `Reassigned from ${previousOfficer.name} to ${officer.name}.`
    : `Assigned to ${officer.name}.`;

  appendAssignmentHistory(ob, officer, req.user._id, historyNote);

  ob.updates.push({
    title: previousOfficer ? 'Police Reassigned' : 'Police Assigned',
    note: previousOfficer
      ? `Previous officer ${previousOfficer.name} preserved in history. Now assigned to ${officer.name} (${officer.badgeNumber || 'no badge'}).`
      : `An investigating officer (${officer.name}) has been assigned to ${ob.obNumber}.`,
    visibleToCitizen: true,
    createdBy: req.user._id,
    createdAt: new Date(),
  });
  await ob.save();

  await notifyUser({
    userId: ob.citizen,
    title: 'Police Officer Assigned',
    message: `A Police officer has been assigned to handle your case ${ob.obNumber}.`,
    type: 'police_assigned',
    relatedComplaint: ob.complaint,
    relatedOB: ob._id,
    linkPath: obPath(ob._id),
    ...actorFields(req.user),
  });

  await notifyUser({
    userId: officer._id,
    title: 'New Case Assigned',
    message: `You have been assigned to ${ob.obNumber}.`,
    type: 'ob_assigned_officer',
    relatedComplaint: ob.complaint,
    relatedOB: ob._id,
    relatedUser: officer._id,
    linkPath: obPath(ob._id, { forPolice: true }),
    ...actorFields(req.user),
  });

  if (previousOfficerId && previousOfficerId !== String(officer._id)) {
    await notifyUser({
      userId: previousOfficerId,
      title: 'Case Reassigned',
      message: `${ob.obNumber} has been reassigned to another officer.`,
      type: 'case_reassigned',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
      linkPath: '/ob-records',
      ...actorFields(req.user),
    });
  }

  await notifyAdmins(
    {
      title: 'Police Assigned to Case',
      message: `${officer.name} was assigned to ${ob.obNumber}.`,
      type: 'ob_assigned_admin',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
      relatedUser: officer._id,
      linkPath: obPath(ob._id),
      ...actorFields(req.user),
    },
    { excludeUserId: req.user._id }
  );

  const updated = await loadStaffOB(ob._id, { withNotes: true });
  return res.json({
    success: true,
    message: 'Officer assigned successfully.',
    data: { ob: updated ? toAdminOB(updated) : toAdminOB(ob) },
  });
});

export const policeUpdateInvestigation = asyncHandler(async (req, res) => {
  const { action, note, citizenSummary } = req.body;
  const ob = await OBRecord.findById(req.params.id).select('+investigationNotes');

  if (!ob) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  if (ob.status === 'Closed') {
    return res.status(400).json({
      success: false,
      message: 'This record is closed and cannot be modified.',
    });
  }

  if (ob.status === 'Resolved') {
    return res.status(400).json({
      success: false,
      message: 'This record is resolved and cannot be modified.',
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
    ob.status = 'Under Investigation';
    if (!ob.investigationStartedAt) {
      ob.investigationStartedAt = new Date();
    }
    ob.investigationCompletedAt = null;
    if (note) {
      appendInvestigationNote(ob, note, req.user._id);
    }
    ob.updates.push({
      title: 'Investigation Started',
      note: note || 'Investigation has started on your case.',
      visibleToCitizen: true,
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    await ob.save();
    await syncComplaintFromOB(ob, 'Under Investigation', note, req.user._id);
    await notifyUser({
      userId: ob.citizen,
      title: 'Investigation Started',
      message: `Investigation has started for ${ob.obNumber}.`,
      type: 'investigation_started',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
      linkPath: obPath(ob._id),
      ...actorFields(req.user),
    });
    await notifyAdmins(
      {
        title: 'Investigation Updated',
        message: `Investigation started for ${ob.obNumber}.`,
        type: 'investigation_started_admin',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
        linkPath: obPath(ob._id),
        ...actorFields(req.user),
      },
      { excludeUserId: req.user._id }
    );
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
      await notifyUser({
        userId: ob.citizen,
        title: 'Investigation Updated',
        message: `There is a new update on your complaint (${ob.obNumber}).`,
        type: 'investigation_update',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
        linkPath: obPath(ob._id),
        ...actorFields(req.user),
      });
      await notifyAdmins(
        {
          title: 'Investigation Updated',
          message: `${ob.obNumber} has a new investigation update.`,
          type: 'investigation_update_admin',
          relatedComplaint: ob.complaint,
          relatedOB: ob._id,
          linkPath: obPath(ob._id),
          ...actorFields(req.user),
        },
        { excludeUserId: req.user._id }
      );
    } else {
      await ob.save();
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
    ob.status = 'Investigation Completed';
    ob.investigationCompletedAt = new Date();
    ob.investigationProgress = 100;
    if (note) {
      appendInvestigationNote(ob, note, req.user._id);
    }
    if (citizenSummary) {
      ob.citizenSummary = citizenSummary;
    }
    ob.updates.push({
      title: 'Investigation Completed',
      note: citizenSummary || note || 'Investigation has been completed.',
      visibleToCitizen: true,
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    await ob.save();
    await syncComplaintFromOB(
      ob,
      'Investigation Completed',
      note,
      req.user._id
    );
    await notifyUser({
      userId: ob.citizen,
      title: 'Investigation Completed',
      message: `Investigation completed for ${ob.obNumber}.`,
      type: 'investigation_completed',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
      linkPath: obPath(ob._id),
      ...actorFields(req.user),
    });
    await notifyAdmins(
      {
        title: 'Investigation Updated',
        message: `Investigation completed for ${ob.obNumber}.`,
        type: 'investigation_completed_admin',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
        linkPath: obPath(ob._id),
        ...actorFields(req.user),
      },
      { excludeUserId: req.user._id }
    );
  } else {
    return res.status(400).json({
      success: false,
      message: 'Action must be start, note, or complete.',
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

  if (ob.status === 'Closed') {
    if (req.file?.filename) {
      removeEvidenceFile(evidencePublicPath(req.file.filename));
    }
    return res.status(400).json({
      success: false,
      message: 'This record is closed and cannot be modified.',
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

  await notifyAdmins(
    {
      title: 'Investigation Updated',
      message: `New evidence was added to ${ob.obNumber}.`,
      type: 'evidence_added',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
      linkPath: obPath(ob._id),
      ...actorFields(req.user),
    },
    { excludeUserId: req.user._id }
  );

  const updated = await loadStaffOB(ob._id, { withNotes: true });

  return res.json({
    success: true,
    message: 'Evidence added successfully.',
    data: { ob: updated.toStaffObject(updated.complaint, updated.citizen) },
  });
});

export const staffListOBs = asyncHandler(async (req, res) => {
  const isReportQuery =
    req.query.page ||
    req.query.range ||
    req.query.dateFrom ||
    req.query.dateTo ||
    req.query.category ||
    req.query.station;

  if (isReportQuery) {
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
  }

  const { status, search = '' } = req.query;
  const filter = {};

  if (req.user.role === 'police') {
    filter.assignedOfficer = req.user._id;
  }

  if (status) {
    filter.status = status;
  }

  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    const matchingCitizens = await User.find({
      role: 'citizen',
      $or: [{ name: regex }, { email: regex }, { phone: regex }, { niraId: regex }],
    }).select('_id');
    const matchingOfficers = await User.find({
      role: { $in: ['police', 'admin'] },
      $or: [{ name: regex }, { email: regex }, { badgeNumber: regex }],
    }).select('_id');
    const matchingComplaints = await Complaint.find({
      $or: [{ complaintNumber: regex }, { category: regex }, { location: regex }],
    }).select('_id');

    filter.$or = [
      { obNumber: regex },
      { citizenSummary: regex },
      { citizen: { $in: matchingCitizens.map((c) => c._id) } },
      { assignedOfficer: { $in: matchingOfficers.map((o) => o._id) } },
      { complaint: { $in: matchingComplaints.map((c) => c._id) } },
    ];
  }

  const records = await OBRecord.find(filter)
    .populate('complaint')
    .populate('citizen', 'name email phone niraId')
    .populate('assignedOfficer', 'name badgeNumber station email')
    .populate('createdBy', 'name email')
    .populate('updates.createdBy', 'name email')
    .populate('evidence.createdBy', 'name email')
    .sort({ updatedAt: -1 });

  return res.json({
    success: true,
    data: {
      records: records.map((item) =>
        req.user.role === 'police'
          ? item.toStaffObject(item.complaint, item.citizen)
          : toAdminOB(item)
      ),
    },
  });
});

export const staffGetOBById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === 'police') {
    filter.assignedOfficer = req.user._id;
  }

  const record = await OBRecord.findOne(filter)
    .select('+investigationNotes')
    .populate('complaint')
    .populate('citizen', 'name email phone niraId')
    .populate('assignedOfficer', 'name badgeNumber station email')
    .populate('createdBy', 'name email')
    .populate('updates.createdBy', 'name email')
    .populate('evidence.createdBy', 'name email');

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'OB record not found.',
    });
  }

  return res.json({
    success: true,
    data: {
      record:
        req.user.role === 'police'
          ? record.toStaffObject(record.complaint, record.citizen)
          : toAdminOB(record),
    },
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

  if (ob.status === 'Closed' && action !== 'reopen') {
    return res.status(400).json({
      success: false,
      message: 'This record is closed and its status cannot be changed.',
    });
  }

  if (ob.status === 'Resolved' && action !== 'reopen') {
    return res.status(400).json({
      success: false,
      message: 'This record is resolved and cannot be modified.',
    });
  }

  if (action === 'reopen') {
    const eligible = await OBRecord.findOne({
      _id: req.params.id,
      status: 'Closed',
    });

    if (!eligible) {
      const existing = await OBRecord.findById(req.params.id).select('status obNumber');
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'OB record not found.',
        });
      }
      return res.status(409).json({
        success: false,
        message:
          existing.status === 'Closed'
            ? 'Unable to reopen OBE. Please try again.'
            : `This OBE (${existing.obNumber}) is already reopened or is not eligible for reopen.`,
      });
    }

    const ob = eligible;
    // Reactivate the SAME OB record. Do not create a new OB, complaint,
    // notes, findings, evidence, closure history, and prior updates.
    const previousStatus = ob.status;
    const previousClosedAt = ob.closedAt;
    const previousOfficerId = ob.assignedOfficer
      ? String(ob.assignedOfficer._id || ob.assignedOfficer)
      : null;

    // Preserve previous officer in assignment history before continuing the same OBE.
    await ensurePreviousAssignmentInHistory(ob);

    ob.status = 'Under Investigation';
    if (!ob.investigationStartedAt) {
      ob.investigationStartedAt = new Date();
    }
    // Allow investigation workflow to continue; keep notes/progress/evidence
    ob.investigationCompletedAt = null;
    // Keep closedAt + closureReason as historical closure information
    // Keep assignedOfficer + assignedAt unchanged (no duplicate assignment / no clone)

    const reopenNote =
      note ||
      'This closed OBE case has been reopened and returned to Under Investigation. Previous citizen, complaint, assignment, investigation, findings, and evidence remain on the same OB record.';

    ob.updates.push({
      title: 'OB Re-opened',
      note: reopenNote,
      visibleToCitizen: true,
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    await ob.save();
    await syncComplaintFromOB(
      ob,
      'Under Investigation',
      reopenNote,
      req.user._id
    );

    await createAuditLog({
      actor: req.user,
      action: 'OB_REOPENED',
      status: 'success',
      recordType: 'OBRecord',
      recordId: ob._id,
      recordLabel: ob.obNumber,
      previousValue: previousStatus,
      newValue: 'Under Investigation',
      details: [
        `OB ${ob.obNumber} reopened from Closed to Under Investigation.`,
        `Actor: ${req.user.name || req.user.email} (${req.user.role}).`,
        previousClosedAt
          ? `Previous closedAt: ${new Date(previousClosedAt).toISOString()}.`
          : null,
        previousOfficerId
          ? `Assigned officer preserved: ${previousOfficerId}.`
          : 'No assigned officer at reopen.',
        `Evidence count preserved: ${(ob.evidence || []).length}.`,
      ]
        .filter(Boolean)
        .join(' '),
      ipAddress: getRequestIp(req),
    });

    if (ob.assignedOfficer) {
      await notifyUser({
        userId: ob.assignedOfficer,
        title: 'OB Case Re-opened',
        message: `${ob.obNumber} has been reopened and requires further investigation.`,
        type: 'ob_reopened',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
        linkPath: obPath(ob._id, { forPolice: true }),
        ...actorFields(req.user),
      });
    } else {
      await notifyAdmins(
        {
          title: 'OB Case Re-opened',
          message: `${ob.obNumber} has been reopened and requires further investigation.`,
          type: 'ob_reopened_admin',
          relatedComplaint: ob.complaint,
          relatedOB: ob._id,
          linkPath: obPath(ob._id),
          ...actorFields(req.user),
        },
        { excludeUserId: req.user._id }
      );
    }

    await notifyUser({
      userId: ob.citizen,
      title: 'Case Reopened',
      message: `Your case ${ob.obNumber} has been reopened for further investigation.`,
      type: 'ob_reopened',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
      linkPath: obPath(ob._id),
      ...actorFields(req.user),
    });

    const updated = await loadStaffOB(ob._id, { withNotes: true });
    return res.json({
      success: true,
      message:
        'OBE reopened successfully. The case has been returned to the active investigation workflow.',
      data: {
        ob: updated ? toAdminOB(updated) : toAdminOB(ob),
      },
    });
  }

  if (action === 'resolve') {
    ob.status = 'Resolved';
    ob.updates.push({
      title: 'OB Resolved',
      note: note || 'Your case has been resolved.',
      visibleToCitizen: true,
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    await ob.save();
    await syncComplaintFromOB(ob, 'Resolved', note, req.user._id);
    await notifyUser({
      userId: ob.citizen,
      title: 'Case Resolved',
      message: `Your complaint has been resolved (${ob.obNumber}).`,
      type: 'ob_resolved',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
      linkPath: obPath(ob._id),
      ...actorFields(req.user),
    });
    if (ob.assignedOfficer && String(ob.assignedOfficer) !== String(req.user._id)) {
      await notifyUser({
        userId: ob.assignedOfficer,
        title: 'Case Status Changed',
        message: `${ob.obNumber} is now Resolved.`,
        type: 'ob_status_officer',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
        linkPath: obPath(ob._id, { forPolice: true }),
        ...actorFields(req.user),
      });
    }
    await notifyAdmins(
      {
        title: 'OB Status Changed',
        message: `${ob.obNumber} is now Resolved.`,
        type: 'ob_resolved_admin',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
        linkPath: obPath(ob._id),
        ...actorFields(req.user),
      },
      { excludeUserId: req.user._id }
    );
  }

  if (action === 'close') {
    ob.status = 'Closed';
    ob.closureReason = note || 'Case closed.';
    ob.closedAt = new Date();
    ob.updates.push({
      title: 'OB Closed',
      note: ob.closureReason,
      visibleToCitizen: true,
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    await ob.save();
    await syncComplaintFromOB(ob, 'Closed', note, req.user._id);
    await notifyUser({
      userId: ob.citizen,
      title: 'Case Closed',
      message: `Your complaint has been closed (${ob.obNumber}).`,
      type: 'ob_closed',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
      linkPath: obPath(ob._id),
      ...actorFields(req.user),
    });
    if (ob.assignedOfficer && String(ob.assignedOfficer) !== String(req.user._id)) {
      await notifyUser({
        userId: ob.assignedOfficer,
        title: 'Case Status Changed',
        message: `${ob.obNumber} is now Closed.`,
        type: 'ob_status_officer',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
        linkPath: obPath(ob._id, { forPolice: true }),
        ...actorFields(req.user),
      });
    }
    await notifyAdmins(
      {
        title: 'OB Status Changed',
        message: `${ob.obNumber} is now Closed.`,
        type: 'ob_closed_admin',
        relatedComplaint: ob.complaint,
        relatedOB: ob._id,
        linkPath: obPath(ob._id),
        ...actorFields(req.user),
      },
      { excludeUserId: req.user._id }
    );
  }

  const updated = await loadStaffOB(ob._id, { withNotes: true });
  return res.json({
    success: true,
    message: 'OB status updated successfully.',
    data: { ob: updated ? toAdminOB(updated) : toAdminOB(ob) },
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

  if (ob.status === 'Closed') {
    return res.status(400).json({
      success: false,
      message: 'This record is closed and cannot be deleted.',
    });
  }

  if (ob.status === 'Resolved') {
    return res.status(400).json({
      success: false,
      message: 'This record is resolved and cannot be deleted.',
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

export { OB_STATUSES };
