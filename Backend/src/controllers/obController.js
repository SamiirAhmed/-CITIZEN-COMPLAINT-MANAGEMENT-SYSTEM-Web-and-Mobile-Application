import OBRecord from '../models/OBRecord.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import {
  asyncHandler,
  createNotification,
} from '../utils/helpers.js';

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
    linkPath: '/ob-records',
  });

  return res.json({
    success: true,
    message: 'Officer assigned successfully.',
    data: { ob },
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

  const isAssignedOfficer =
    ob.assignedOfficer &&
    ob.assignedOfficer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedOfficer && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only the assigned officer or an admin can update this OB.',
    });
  }

  if (action === 'start') {
    ob.status = 'Under Investigation';
    if (note) {
      ob.investigationNotes = `${ob.investigationNotes || ''}\n${note}`.trim();
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
  } else if (action === 'note') {
    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'Note is required.',
      });
    }
    ob.investigationNotes = `${ob.investigationNotes || ''}\n${note}`.trim();
    if (citizenSummary) {
      ob.citizenSummary = citizenSummary;
    }
    ob.updates.push({
      title: 'Investigation Update',
      note: citizenSummary || 'An investigation update is available.',
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
  } else if (action === 'complete') {
    ob.status = 'Investigation Completed';
    if (note) {
      ob.investigationNotes = `${ob.investigationNotes || ''}\n${note}`.trim();
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
      message: 'Action must be start, note, or complete.',
    });
  }

  return res.json({
    success: true,
    message: 'OB updated successfully.',
    data: { ob },
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

export const staffListOBs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'police') {
    filter.assignedOfficer = req.user._id;
  }

  const records = await OBRecord.find(filter)
    .populate('complaint')
    .populate('citizen', 'name email phone niraId')
    .populate('assignedOfficer', 'name badgeNumber station')
    .sort({ updatedAt: -1 });

  return res.json({
    success: true,
    data: { records },
  });
});
