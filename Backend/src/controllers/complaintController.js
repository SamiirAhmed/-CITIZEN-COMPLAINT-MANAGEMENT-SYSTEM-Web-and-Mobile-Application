import Complaint, {
  COMPLAINT_CATEGORIES,
} from '../models/Complaint.js';
import OBRecord from '../models/OBRecord.js';
import {
  asyncHandler,
  createNotification,
  generateComplaintNumber,
  generateOBNumber,
} from '../utils/helpers.js';

export const getCategories = asyncHandler(async (_req, res) => {
  return res.json({
    success: true,
    data: { categories: COMPLAINT_CATEGORIES },
  });
});

export const submitComplaint = asyncHandler(async (req, res) => {
  const {
    category,
    description,
    incidentDate,
    location,
    relatedInformation,
    evidenceNotes,
  } = req.body;

  if (!category || !description || !incidentDate || !location) {
    return res.status(400).json({
      success: false,
      message: 'Category, description, incident date, and location are required.',
    });
  }

  if (!COMPLAINT_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid complaint category.',
    });
  }

  const parsedDate = new Date(incidentDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid incident date.',
    });
  }

  const complaintNumber = await generateComplaintNumber();

  const complaint = await Complaint.create({
    complaintNumber,
    citizen: req.user._id,
    category,
    description: String(description).trim(),
    incidentDate: parsedDate,
    location: String(location).trim(),
    relatedInformation: relatedInformation
      ? String(relatedInformation).trim()
      : '',
    evidenceNotes: evidenceNotes ? String(evidenceNotes).trim() : '',
    status: 'Submitted',
    statusHistory: [
      {
        status: 'Submitted',
        note: 'Complaint submitted by citizen.',
        changedBy: req.user._id,
        changedAt: new Date(),
      },
    ],
  });

  await createNotification({
    userId: req.user._id,
    title: 'Complaint Submitted',
    message: `Your complaint ${complaintNumber} has been submitted successfully.`,
    type: 'complaint_submitted',
    relatedComplaint: complaint._id,
  });

  return res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully.',
    data: { complaint: complaint.toCitizenObject() },
  });
});

export const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ citizen: req.user._id }).sort({
    createdAt: -1,
  });

  return res.json({
    success: true,
    data: {
      complaints: complaints.map((item) => item.toCitizenObject()),
    },
  });
});

export const getMyComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    citizen: req.user._id,
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found.',
    });
  }

  return res.json({
    success: true,
    data: { complaint: complaint.toCitizenObject() },
  });
});

export const getCitizenDashboard = asyncHandler(async (req, res) => {
  const citizenId = req.user._id;

  const [complaints, obRecords] = await Promise.all([
    Complaint.find({ citizen: citizenId }).sort({ updatedAt: -1 }),
    OBRecord.find({ citizen: citizenId })
      .populate('complaint')
      .populate('assignedOfficer', 'name badgeNumber station')
      .sort({ updatedAt: -1 }),
  ]);

  const activeStatuses = [
    'Submitted',
    'Under Review',
    'Verified',
    'OB Created',
    'Under Investigation',
    'Investigation Completed',
    'Reopened',
  ];

  const activeComplaints = complaints.filter((c) =>
    activeStatuses.includes(c.status)
  );
  const activeOBs = obRecords.filter(
    (ob) => !['Closed', 'Resolved'].includes(ob.status)
  );

  const latestComplaint = complaints[0] || null;
  const latestOB = obRecords[0] || null;

  let latestStatus = null;
  if (latestOB) {
    latestStatus = {
      source: 'ob',
      label: latestOB.status,
      reference: latestOB.obNumber,
      updatedAt: latestOB.updatedAt,
    };
  } else if (latestComplaint) {
    latestStatus = {
      source: 'complaint',
      label: latestComplaint.status,
      reference: latestComplaint.complaintNumber,
      updatedAt: latestComplaint.updatedAt,
    };
  }

  const recentUpdates = [];

  for (const complaint of complaints.slice(0, 5)) {
    const history = [...(complaint.statusHistory || [])].sort(
      (a, b) => new Date(b.changedAt) - new Date(a.changedAt)
    );
    if (history[0]) {
      recentUpdates.push({
        type: 'complaint',
        title: complaint.complaintNumber,
        status: history[0].status,
        note: history[0].note || '',
        updatedAt: history[0].changedAt,
        id: complaint._id.toString(),
      });
    }
  }

  for (const ob of obRecords.slice(0, 5)) {
    const updates = [...(ob.updates || [])]
      .filter((u) => u.visibleToCitizen)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (updates[0]) {
      recentUpdates.push({
        type: 'ob',
        title: ob.obNumber,
        status: ob.status,
        note: updates[0].note || updates[0].title,
        updatedAt: updates[0].createdAt,
        id: ob._id.toString(),
      });
    }
  }

  recentUpdates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return res.json({
    success: true,
    data: {
      summary: {
        totalComplaints: complaints.length,
        activeComplaints: activeComplaints.length,
        activeOBs: activeOBs.length,
        closedComplaints: complaints.filter((c) =>
          ['Closed', 'Resolved', 'Rejected'].includes(c.status)
        ).length,
      },
      activeComplaint: activeComplaints[0]
        ? activeComplaints[0].toCitizenObject()
        : null,
      activeOB: activeOBs[0]
        ? activeOBs[0].toCitizenObject(activeOBs[0].complaint)
        : null,
      latestStatus,
      recentUpdates: recentUpdates.slice(0, 8),
    },
  });
});

const pushComplaintStatus = async (complaint, status, note, userId) => {
  complaint.status = status;
  complaint.statusHistory.push({
    status,
    note: note || '',
    changedBy: userId,
    changedAt: new Date(),
  });
  await complaint.save();
};

export const adminListComplaints = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const complaints = await Complaint.find(filter)
    .populate('citizen', 'name email phone niraId')
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: { complaints },
  });
});

export const adminReviewComplaint = asyncHandler(async (req, res) => {
  const { action, note } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found.',
    });
  }

  if (!['review', 'verify', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Action must be review, verify, or reject.',
    });
  }

  if (action === 'review') {
    await pushComplaintStatus(
      complaint,
      'Under Review',
      note || 'Complaint is under review.',
      req.user._id
    );
    await createNotification({
      userId: complaint.citizen,
      title: 'Complaint Reviewed',
      message: `Your complaint ${complaint.complaintNumber} is under review.`,
      type: 'complaint_reviewed',
      relatedComplaint: complaint._id,
    });
  }

  if (action === 'verify') {
    await pushComplaintStatus(
      complaint,
      'Verified',
      note || 'Complaint verified.',
      req.user._id
    );
    complaint.reviewedBy = req.user._id;
    complaint.reviewedAt = new Date();
    await complaint.save();
    await createNotification({
      userId: complaint.citizen,
      title: 'Complaint Verified',
      message: `Your complaint ${complaint.complaintNumber} has been verified.`,
      type: 'complaint_verified',
      relatedComplaint: complaint._id,
    });
  }

  if (action === 'reject') {
    complaint.rejectionReason = note || 'Complaint rejected.';
    await pushComplaintStatus(
      complaint,
      'Rejected',
      complaint.rejectionReason,
      req.user._id
    );
    await createNotification({
      userId: complaint.citizen,
      title: 'Complaint Rejected',
      message: `Your complaint ${complaint.complaintNumber} was rejected.`,
      type: 'complaint_rejected',
      relatedComplaint: complaint._id,
    });
  }

  return res.json({
    success: true,
    message: 'Complaint updated successfully.',
    data: { complaint },
  });
});

export const adminCreateOB = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found.',
    });
  }

  if (!['Verified', 'Under Review', 'Submitted'].includes(complaint.status)) {
    const existing = await OBRecord.findOne({ complaint: complaint._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An OB already exists for this complaint.',
        data: { ob: existing },
      });
    }
  }

  const existingOB = await OBRecord.findOne({ complaint: complaint._id });
  if (existingOB) {
    return res.status(409).json({
      success: false,
      message: 'An OB already exists for this complaint.',
      data: { ob: existingOB },
    });
  }

  if (complaint.status === 'Rejected') {
    return res.status(400).json({
      success: false,
      message: 'Cannot create OB for a rejected complaint.',
    });
  }

  const obNumber = await generateOBNumber();
  const ob = await OBRecord.create({
    obNumber,
    complaint: complaint._id,
    citizen: complaint.citizen,
    createdBy: req.user._id,
    status: 'Opened',
    citizenSummary: req.body.citizenSummary || 'Occurrence Book opened for your complaint.',
    updates: [
      {
        title: 'OB Created',
        note: 'An Occurrence Book has been created for your complaint.',
        visibleToCitizen: true,
        createdBy: req.user._id,
        createdAt: new Date(),
      },
    ],
  });

  await pushComplaintStatus(
    complaint,
    'OB Created',
    `OB ${obNumber} created.`,
    req.user._id
  );

  await createNotification({
    userId: complaint.citizen,
    title: 'OB Created',
    message: `Occurrence Book ${obNumber} has been created for complaint ${complaint.complaintNumber}.`,
    type: 'ob_created',
    relatedComplaint: complaint._id,
    relatedOB: ob._id,
  });

  return res.status(201).json({
    success: true,
    message: 'OB created successfully.',
    data: { ob },
  });
});
