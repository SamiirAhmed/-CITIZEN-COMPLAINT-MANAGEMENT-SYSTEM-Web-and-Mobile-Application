import OBRecord, { OB_STATUSES } from '../models/OBRecord.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import {
  asyncHandler,
  createAuditLog,
  createNotification,
  getRequestIp,
} from '../utils/helpers.js';
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
    .populate('assignedOfficer', 'name badgeNumber station');

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

  ob.assignedOfficer = officer._id;
  ob.assignedAt = new Date();
  ob.status = 'Assigned';
  ob.updates.push({
    title: 'Police Assigned',
    note: `An investigating officer has been assigned to ${ob.obNumber}.`,
    visibleToCitizen: true,
    createdBy: req.user._id,
    createdAt: new Date(),
  });
  await ob.save();

  await createNotification({
    userId: ob.citizen,
    title: 'Police Assigned',
    message: `A police officer has been assigned to OB ${ob.obNumber}.`,
    type: 'police_assigned',
    relatedComplaint: ob.complaint,
    relatedOB: ob._id,
  });

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

  return res.json({
    success: true,
    message: 'Officer assigned successfully.',
    data: { ob },
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
    await createNotification({
      userId: ob.citizen,
      title: 'Investigation Started',
      message: `Investigation has started for OB ${ob.obNumber}.`,
      type: 'investigation_started',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
    });
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
    if (shareWithCitizen) {
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
    await createNotification({
      userId: ob.citizen,
      title: 'Investigation Completed',
      message: `Investigation completed for OB ${ob.obNumber}.`,
      type: 'investigation_completed',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
    });
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
    const matchingComplaints = await Complaint.find({
      $or: [{ complaintNumber: regex }, { category: regex }, { location: regex }],
    }).select('_id');

    filter.$or = [
      { obNumber: regex },
      { citizenSummary: regex },
      { citizen: { $in: matchingCitizens.map((c) => c._id) } },
      { complaint: { $in: matchingComplaints.map((c) => c._id) } },
    ];
  }

  const records = await OBRecord.find(filter)
    .populate('complaint')
    .populate('citizen', 'name email phone niraId')
    .populate('assignedOfficer', 'name badgeNumber station email')
    .populate('createdBy', 'name email')
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
    .populate('createdBy', 'name email');

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
    await createNotification({
      userId: ob.citizen,
      title: 'OB Resolved',
      message: `OB ${ob.obNumber} has been resolved.`,
      type: 'ob_resolved',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
    });
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
    await createNotification({
      userId: ob.citizen,
      title: 'OB Closed',
      message: `OB ${ob.obNumber} has been closed.`,
      type: 'ob_closed',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
    });
  }

  if (action === 'reopen') {
    ob.status = 'Reopened';
    ob.closedAt = null;
    ob.updates.push({
      title: 'OB Reopened',
      note: note || 'Your case has been reopened.',
      visibleToCitizen: true,
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    await ob.save();
    await syncComplaintFromOB(ob, 'Reopened', note, req.user._id);
    await createNotification({
      userId: ob.citizen,
      title: 'OB Reopened',
      message: `OB ${ob.obNumber} has been reopened.`,
      type: 'ob_reopened',
      relatedComplaint: ob.complaint,
      relatedOB: ob._id,
    });
  }

  return res.json({
    success: true,
    message: 'OB status updated successfully.',
    data: { ob },
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

export { OB_STATUSES };
