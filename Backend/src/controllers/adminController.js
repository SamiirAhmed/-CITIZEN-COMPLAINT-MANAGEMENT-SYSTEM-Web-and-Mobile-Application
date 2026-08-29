import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import OBRecord from '../models/OBRecord.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/helpers.js';
import { isValidEmail } from '../utils/citizenValidation.js';

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getAdminDashboard = asyncHandler(async (_req, res) => {
  const [
    totalCitizens,
    activeCitizens,
    totalComplaints,
    pendingComplaints,
    totalOBs,
    activeOBs,
    totalStaff,
    recentCitizens,
    recentComplaints,
  ] = await Promise.all([
    User.countDocuments({ role: 'citizen' }),
    User.countDocuments({ role: 'citizen', isActive: true }),
    Complaint.countDocuments(),
    Complaint.countDocuments({
      status: { $in: ['Submitted', 'Under Review', 'Verified'] },
    }),
    OBRecord.countDocuments(),
    OBRecord.countDocuments({
      status: { $nin: ['Closed', 'Resolved'] },
    }),
    User.countDocuments({ role: { $in: ['admin', 'police'] } }),
    User.find({ role: 'citizen' })
      .sort({ createdAt: -1 })
      .limit(5),
    Complaint.find()
      .populate('citizen', 'name email niraId')
      .sort({ createdAt: -1 })
      .limit(6),
  ]);

  const recentActivities = [
    ...recentCitizens.map((citizen) => ({
      id: `citizen-${citizen._id}`,
      type: 'citizen',
      title: citizen.name,
      detail: `Citizen registered (${citizen.niraId || 'N/A'})`,
      status: citizen.isActive ? 'Active' : 'Inactive',
      createdAt: citizen.createdAt,
    })),
    ...recentComplaints.map((complaint) => ({
      id: `complaint-${complaint._id}`,
      type: 'complaint',
      title: complaint.complaintNumber,
      detail: `${complaint.category} • ${complaint.citizen?.name || 'Citizen'}`,
      status: complaint.status,
      createdAt: complaint.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  return res.json({
    success: true,
    data: {
      summary: {
        totalCitizens,
        activeCitizens,
        totalComplaints,
        pendingComplaints,
        totalOBs,
        activeOBs,
        totalStaff,
      },
      recentActivities,
    },
  });
});

export const listCitizens = asyncHandler(async (req, res) => {
  const { search = '', status } = req.query;
  const filter = { role: 'citizen' };

  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      { name: regex },
      { niraId: regex },
      { phone: regex },
      { email: regex },
    ];
  }

  const citizens = await User.find(filter).sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: {
      citizens: citizens.map((item) => item.toSafeObject()),
    },
  });
});

export const getCitizenById = asyncHandler(async (req, res) => {
  const citizen = await User.findOne({
    _id: req.params.id,
    role: 'citizen',
  });

  if (!citizen) {
    return res.status(404).json({
      success: false,
      message: 'Citizen not found.',
    });
  }

  const [complaints, obRecords] = await Promise.all([
    Complaint.find({ citizen: citizen._id }).sort({ createdAt: -1 }),
    OBRecord.find({ citizen: citizen._id })
      .populate('complaint', 'complaintNumber category status')
      .sort({ createdAt: -1 }),
  ]);

  return res.json({
    success: true,
    data: {
      citizen: citizen.toSafeObject(),
      complaints: complaints.map((item) => item.toCitizenObject()),
      obRecords: obRecords.map((item) => item.toCitizenObject(item.complaint)),
    },
  });
});

export const updateCitizen = asyncHandler(async (req, res) => {
  const citizen = await User.findOne({
    _id: req.params.id,
    role: 'citizen',
  });

  if (!citizen) {
    return res.status(404).json({
      success: false,
      message: 'Citizen not found.',
    });
  }

  const { name, phone, tell } = req.body;

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }
    if (trimmed.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at most 30 characters.',
      });
    }
    citizen.name = trimmed;
  }

  if (phone !== undefined) {
    const trimmed = String(phone).trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: 'Phone is required.',
      });
    }
    citizen.phone = trimmed;
  }

  if (tell !== undefined) {
    const trimmed = String(tell).trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: 'Tell is required.',
      });
    }
    citizen.tell = trimmed;
  }

  await citizen.save();

  return res.json({
    success: true,
    message: 'Citizen updated successfully.',
    data: { citizen: citizen.toSafeObject() },
  });
});

export const setCitizenStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const citizen = await User.findOne({
    _id: req.params.id,
    role: 'citizen',
  });

  if (!citizen) {
    return res.status(404).json({
      success: false,
      message: 'Citizen not found.',
    });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be a boolean.',
    });
  }

  citizen.isActive = isActive;
  await citizen.save();

  return res.json({
    success: true,
    message: isActive ? 'Citizen activated.' : 'Citizen deactivated.',
    data: { citizen: citizen.toSafeObject() },
  });
});

export const listStaffUsers = asyncHandler(async (req, res) => {
  const { search = '', role, status } = req.query;
  const filter = { role: { $in: ['admin', 'police'] } };

  if (role === 'admin' || role === 'police') {
    filter.role = role;
  }

  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
      { niraId: regex },
      { badgeNumber: regex },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: {
      users: users.map((item) => item.toSafeObject()),
    },
  });
});

export const registerPolice = asyncHandler(async (req, res) => {
  const {
    name,
    niraId,
    phone,
    tell,
    email,
    password,
    confirmPassword,
    badgeNumber,
    station,
  } = req.body;

  const trimmedName = String(name ?? '').trim();
  const trimmedNira = String(niraId ?? '').trim();
  const trimmedPhone = String(phone ?? '').trim();
  const trimmedTell = String(tell ?? '').trim();
  const trimmedEmail = String(email ?? '').trim().toLowerCase();
  const rawPassword = String(password ?? '');

  if (!trimmedName) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }
  if (trimmedName.length > 30) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at most 30 characters.',
    });
  }
  if (!trimmedNira) {
    return res.status(400).json({
      success: false,
      message: 'NIRA ID is required.',
    });
  }
  if (trimmedNira.length !== 11) {
    return res.status(400).json({
      success: false,
      message: 'NIRA ID must be exactly 11 characters.',
    });
  }
  if (!trimmedPhone) {
    return res.status(400).json({
      success: false,
      message: 'Phone is required.',
    });
  }
  if (!trimmedTell) {
    return res.status(400).json({
      success: false,
      message: 'Tell is required.',
    });
  }
  if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
  }
  if (!rawPassword || rawPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters.',
    });
  }
  if (confirmPassword !== undefined && rawPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password and confirm password do not match.',
    });
  }

  const existingEmail = await User.findOne({ email: trimmedEmail });
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  const existingNira = await User.findOne({ niraId: trimmedNira });
  if (existingNira) {
    return res.status(409).json({
      success: false,
      message: 'An account with this NIRA ID already exists.',
    });
  }

  const user = await User.create({
    name: trimmedName,
    niraId: trimmedNira,
    phone: trimmedPhone,
    tell: trimmedTell,
    email: trimmedEmail,
    password: rawPassword,
    role: 'police',
    badgeNumber: badgeNumber ? String(badgeNumber).trim() : '',
    station: station ? String(station).trim() : '',
    isActive: true,
  });

  return res.status(201).json({
    success: true,
    message: 'Police user registered successfully.',
    data: { user: user.toSafeObject() },
  });
});

export const getStaffUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    role: { $in: ['admin', 'police'] },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  return res.json({
    success: true,
    data: { user: user.toSafeObject() },
  });
});

export const updateStaffUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    role: { $in: ['admin', 'police'] },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  const { name, phone, tell, badgeNumber, station } = req.body;

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }
    if (trimmed.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at most 30 characters.',
      });
    }
    user.name = trimmed;
  }

  if (phone !== undefined) {
    const trimmed = String(phone).trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: 'Phone is required.',
      });
    }
    user.phone = trimmed;
  }

  if (tell !== undefined) {
    user.tell = String(tell).trim();
  }

  if (badgeNumber !== undefined) {
    user.badgeNumber = String(badgeNumber).trim();
  }

  if (station !== undefined) {
    user.station = String(station).trim();
  }

  await user.save();

  return res.json({
    success: true,
    message: 'User updated successfully.',
    data: { user: user.toSafeObject() },
  });
});

export const setStaffUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findOne({
    _id: req.params.id,
    role: { $in: ['admin', 'police'] },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own account status.',
    });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be a boolean.',
    });
  }

  user.isActive = isActive;
  await user.save();

  return res.json({
    success: true,
    message: isActive ? 'User activated.' : 'User deactivated.',
    data: { user: user.toSafeObject() },
  });
});

// Permissions are not implemented in the current Backend.
export const getPermissionsAvailability = asyncHandler(async (_req, res) => {
  return res.json({
    success: true,
    data: {
      supported: false,
      message: 'Permissions module is not available yet.',
    },
  });
});

export const getAdminNotificationsCount = asyncHandler(async (_req, res) => {
  const unread = await Notification.countDocuments({ isRead: false });
  return res.json({
    success: true,
    data: { unreadCount: unread },
  });
});
