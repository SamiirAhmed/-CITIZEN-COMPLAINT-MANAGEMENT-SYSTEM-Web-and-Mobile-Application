import Complaint, { COMPLAINT_STATUSES } from '../models/Complaint.js';
import Category from '../models/Category.js';
import OBRecord from '../models/OBRecord.js';
import User from '../models/User.js';
import {
  asyncHandler,
  createAuditLog,
  createNotification,
  generateComplaintNumber,
  generateOBNumber,
  getRequestIp,
  notifyRole,
} from '../utils/helpers.js';

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
  };
};

const toAdminComplaint = (complaint) => {
  if (!complaint) return null;
  const obj = typeof complaint.toObject === 'function' ? complaint.toObject() : complaint;
  return {
    id: obj._id?.toString?.() || obj.id,
    complaintNumber: obj.complaintNumber,
    citizen: mapUserRef(obj.citizen),
    category: obj.category,
    description: obj.description,
    incidentDate: obj.incidentDate,
    location: obj.location,
    relatedInformation: obj.relatedInformation || '',
    evidenceNotes: obj.evidenceNotes || '',
    status: obj.status,
    statusHistory: obj.statusHistory || [],
    reviewedBy: mapUserRef(obj.reviewedBy),
    reviewedAt: obj.reviewedAt,
    rejectionReason: obj.rejectionReason || '',
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  return res.json({
    success: true,
    data: {
      categories: categories.map((item) => item.name),
    },
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

  const activeCategory = await Category.findOne({
    name: String(category).trim(),
    isActive: true,
  });

  if (!activeCategory) {
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

  await notifyRole('admin', {
    title: 'New Complaint Submitted',
    message: `${req.user.name} submitted complaint ${complaintNumber} (${activeCategory.name}).`,
    type: 'complaint_submitted_admin',
    relatedComplaint: complaint._id,
    relatedUser: req.user._id,
    linkPath: '/complaints',
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
  const { status, search = '', category } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }
  if (category) {
    filter.category = String(category).trim();
  }

  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    const matchingCitizens = await User.find({
      role: 'citizen',
      $or: [{ name: regex }, { email: regex }, { phone: regex }, { niraId: regex }],
    }).select('_id');

    filter.$or = [
      { complaintNumber: regex },
      { category: regex },
      { location: regex },
      { description: regex },
      { citizen: { $in: matchingCitizens.map((c) => c._id) } },
    ];
  }

  const complaints = await Complaint.find(filter)
    .populate('citizen', 'name email phone niraId')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: { complaints: complaints.map(toAdminComplaint) },
  });
});

export const adminGetComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('citizen', 'name email phone niraId')
    .populate('reviewedBy', 'name email');

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found.',
    });
  }

  const ob = await OBRecord.findOne({ complaint: complaint._id }).select(
    'obNumber status createdAt'
  );

  return res.json({
    success: true,
    data: {
      complaint: toAdminComplaint(complaint),
      ob: ob
        ? {
            id: ob._id.toString(),
            obNumber: ob.obNumber,
            status: ob.status,
            createdAt: ob.createdAt,
          }
        : null,
    },
  });
});

export const adminCreateComplaint = asyncHandler(async (req, res) => {
  const {
    citizenId,
    category,
    description,
    incidentDate,
    location,
    relatedInformation,
    evidenceNotes,
    status,
  } = req.body;

  if (!citizenId || !category || !description || !incidentDate || !location) {
    return res.status(400).json({
      success: false,
      message: 'Citizen, category, description, incident date, and location are required.',
    });
  }

  const citizen = await User.findOne({ _id: citizenId, role: 'citizen', isActive: true });
  if (!citizen) {
    return res.status(404).json({
      success: false,
      message: 'Active citizen not found.',
    });
  }

  const activeCategory = await Category.findOne({
    name: String(category).trim(),
    isActive: true,
  });
  if (!activeCategory) {
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

  const initialStatus =
    status && COMPLAINT_STATUSES.includes(status) ? status : 'Submitted';

  const complaintNumber = await generateComplaintNumber();
  const complaint = await Complaint.create({
    complaintNumber,
    citizen: citizen._id,
    category: activeCategory.name,
    description: String(description).trim(),
    incidentDate: parsedDate,
    location: String(location).trim(),
    relatedInformation: relatedInformation ? String(relatedInformation).trim() : '',
    evidenceNotes: evidenceNotes ? String(evidenceNotes).trim() : '',
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        note: 'Complaint created by admin.',
        changedBy: req.user._id,
        changedAt: new Date(),
      },
    ],
  });

  await createNotification({
    userId: citizen._id,
    title: 'Complaint Recorded',
    message: `Complaint ${complaintNumber} has been recorded on your behalf.`,
    type: 'complaint_submitted',
    relatedComplaint: complaint._id,
  });

  await createAuditLog({
    actor: req.user,
    action: 'CREATE',
    recordType: 'Complaint',
    recordId: complaint._id,
    recordLabel: complaintNumber,
    previousValue: '',
    newValue: initialStatus,
    details: `Complaint created for citizen ${citizen.name}.`,
    ipAddress: getRequestIp(req),
  });

  const populated = await Complaint.findById(complaint._id).populate(
    'citizen',
    'name email phone niraId'
  );

  return res.status(201).json({
    success: true,
    message: 'Complaint created successfully.',
    data: { complaint: toAdminComplaint(populated) },
  });
});

export const adminUpdateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found.',
    });
  }

  const {
    citizenId,
    category,
    description,
    incidentDate,
    location,
    relatedInformation,
    evidenceNotes,
    status,
    note,
  } = req.body;

  if (citizenId) {
    const citizen = await User.findOne({ _id: citizenId, role: 'citizen' });
    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Citizen not found.',
      });
    }
    complaint.citizen = citizen._id;
  }

  if (category !== undefined) {
    const activeCategory = await Category.findOne({
      name: String(category).trim(),
      isActive: true,
    });
    if (!activeCategory) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint category.',
      });
    }
    complaint.category = activeCategory.name;
  }

  if (description !== undefined) {
    const trimmed = String(description).trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: 'Description is required.',
      });
    }
    complaint.description = trimmed;
  }

  if (incidentDate !== undefined) {
    const parsedDate = new Date(incidentDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incident date.',
      });
    }
    complaint.incidentDate = parsedDate;
  }

  if (location !== undefined) {
    const trimmed = String(location).trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: 'Location is required.',
      });
    }
    complaint.location = trimmed;
  }

  if (relatedInformation !== undefined) {
    complaint.relatedInformation = String(relatedInformation || '').trim();
  }

  if (evidenceNotes !== undefined) {
    complaint.evidenceNotes = String(evidenceNotes || '').trim();
  }

  if (status !== undefined) {
    if (!COMPLAINT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint status.',
      });
    }
    if (status !== complaint.status) {
      complaint.status = status;
      complaint.statusHistory.push({
        status,
        note: note || `Status updated to ${status} by admin.`,
        changedBy: req.user._id,
        changedAt: new Date(),
      });
      if (status === 'Rejected') {
        complaint.rejectionReason = note || complaint.rejectionReason || 'Complaint rejected.';
      }
    }
  }

  await complaint.save();

  await createAuditLog({
    actor: req.user,
    action: 'UPDATE',
    recordType: 'Complaint',
    recordId: complaint._id,
    recordLabel: complaint.complaintNumber,
    previousValue: '',
    newValue: complaint.status,
    details: `Complaint ${complaint.complaintNumber} updated.`,
    ipAddress: getRequestIp(req),
  });

  const populated = await Complaint.findById(complaint._id)
    .populate('citizen', 'name email phone niraId')
    .populate('reviewedBy', 'name email');

  return res.json({
    success: true,
    message: 'Complaint updated successfully.',
    data: { complaint: toAdminComplaint(populated) },
  });
});

export const adminDeleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found.',
    });
  }

  const linkedOB = await OBRecord.findOne({ complaint: complaint._id });
  if (linkedOB) {
    await OBRecord.deleteOne({ _id: linkedOB._id });
  }

  const label = complaint.complaintNumber;
  await complaint.deleteOne();

  await createAuditLog({
    actor: req.user,
    action: 'DELETE',
    recordType: 'Complaint',
    recordId: complaint._id,
    recordLabel: label,
    previousValue: label,
    newValue: '',
    details: linkedOB
      ? `Complaint deleted along with OB ${linkedOB.obNumber}.`
      : 'Complaint deleted.',
    ipAddress: getRequestIp(req),
  });

  return res.json({
    success: true,
    message: 'Complaint deleted successfully.',
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
    data: { complaint: toAdminComplaint(complaint) },
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

export { COMPLAINT_STATUSES };