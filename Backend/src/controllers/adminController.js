import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import OBRecord from '../models/OBRecord.js';
import Notification from '../models/Notification.js';
import { asyncHandler, createAuditLog, getRequestIp } from '../utils/helpers.js';
import {
  actorFields,
  citizenPath,
  notifyAdmins,
  notifyUser,
  staffUserPath,
} from '../utils/notifyEvent.js';
import { isValidEmail } from '../utils/citizenValidation.js';
import {
  DEFAULT_POLICE_PERMISSIONS,
  MENU_MODULES,
  normalizePermissions,
} from '../constants/menuModules.js';
import {
  profileImagePublicPath,
  removeProfileImageFile,
} from '../middleware/uploadProfileImage.js';
import { getDefaultUserPassword } from '../utils/defaultPassword.js';
import { applyGeographicLocation, applyGeographicSelection } from '../utils/geographyHelpers.js';
import { hiddenNotificationClause, notifyAccountStatusChange } from '../utils/authAudit.js';

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const dayStarts = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfToday);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });

  const weekStart = dayStarts[0];
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

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
    statusGroups,
    weekCitizens,
    weekComplaints,
    weekOBs,
    prevCitizens,
    prevComplaints,
    prevOBs,
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
    Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.find({ role: 'citizen', createdAt: { $gte: weekStart } }).select('createdAt'),
    Complaint.find({ createdAt: { $gte: weekStart } }).select('createdAt'),
    OBRecord.find({ createdAt: { $gte: weekStart } }).select('createdAt'),
    User.countDocuments({
      role: 'citizen',
      createdAt: { $gte: previousWeekStart, $lt: weekStart },
    }),
    Complaint.countDocuments({
      createdAt: { $gte: previousWeekStart, $lt: weekStart },
    }),
    OBRecord.countDocuments({
      createdAt: { $gte: previousWeekStart, $lt: weekStart },
    }),
  ]);

  const countByDay = (docs) =>
    dayStarts.map((dayStart) => {
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      return docs.filter((doc) => {
        const created = new Date(doc.createdAt);
        return created >= dayStart && created < dayEnd;
      }).length;
    });

  const citizensSeries = countByDay(weekCitizens);
  const complaintsSeries = countByDay(weekComplaints);
  const obSeries = countByDay(weekOBs);

  const sum = (arr) => arr.reduce((total, value) => total + value, 0);
  const pctChange = (current, previous) => {
    if (previous === 0) {
      return current === 0 ? null : null;
    }
    return Math.round(((current - previous) / previous) * 100);
  };

  const weekCitizensTotal = sum(citizensSeries);
  const weekComplaintsTotal = sum(complaintsSeries);
  const weekOBsTotal = sum(obSeries);

  const recentActivities = [
    ...recentCitizens.map((citizen) => ({
      id: `citizen-${citizen._id}`,
      type: 'citizen',
      title: citizen.name,
      detail: `Citizen registered (${citizen.niraId || 'N/A'})`,
      status: citizen.isActive ? 'Active' : 'Inactive',
      createdAt: citizen.createdAt,
      href: `/citizens/${citizen._id}`,
    })),
    ...recentComplaints.map((complaint) => ({
      id: `complaint-${complaint._id}`,
      type: 'complaint',
      title: complaint.complaintNumber,
      detail: `${complaint.category} • ${complaint.citizen?.name || 'Citizen'}`,
      status: complaint.status,
      createdAt: complaint.createdAt,
      href: '/complaints',
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const applicationNotifications = await Notification.find({
    user: req.user._id,
    ...hiddenNotificationClause(),
  })
    .sort({ createdAt: -1 })
    .limit(8);

  const applicationUnreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
    ...hiddenNotificationClause(),
  });

  const mapAlertType = (notification) => {
    const type = String(notification.type || '');
    if (type.includes('reject') || type.includes('fail') || type.includes('deactivat')) {
      return 'failed';
    }
    if (type.includes('assigned') || type.includes('permission') || type.includes('status')) {
      return 'warning';
    }
    return 'success';
  };

  const systemAlerts = applicationNotifications.map((item) => {
    const alert = item.toClientObject();
    return {
      id: alert.id,
      type: mapAlertType(item),
      alertAction: alert.alertAction || item.type,
      status: alert.status,
      title: alert.title,
      detail: alert.message,
      actorName: alert.actorName,
      actorRole: alert.actorRole,
      email: alert.email,
      failureReason: alert.failureReason,
      ipAddress: alert.ipAddress,
      accessSource: alert.accessSource,
      isRead: alert.isRead,
      createdAt: alert.createdAt,
      linkPath: alert.linkPath,
    };
  });

  const complaintStatus = statusGroups.map((item) => ({
    status: item._id || 'Unknown',
    count: item.count,
  }));

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
      cardTrends: {
        citizens: {
          series: citizensSeries,
          changePct: pctChange(weekCitizensTotal, prevCitizens),
        },
        complaints: {
          series: complaintsSeries,
          changePct: pctChange(weekComplaintsTotal, prevComplaints),
        },
        obRecords: {
          series: obSeries,
          changePct: pctChange(weekOBsTotal, prevOBs),
        },
        staff: {
          series: Array(7).fill(0),
          changePct: null,
        },
      },
      overview: {
        labels: dayStarts.map((day) =>
          day.toLocaleDateString(undefined, { weekday: 'short' })
        ),
        citizens: citizensSeries,
        complaints: complaintsSeries,
        obRecords: obSeries,
      },
      complaintStatus,
      recentActivities,
      systemAlerts,
      securityUnreadCount: applicationUnreadCount,
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
    if (req.file?.filename) {
      removeProfileImageFile(profileImagePublicPath(req.file.filename));
    }
    return res.status(404).json({
      success: false,
      message: 'Citizen not found.',
    });
  }

  const { name, phone, email, niraId } = req.body;
  const previousImage = citizen.profileImage || '';

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }
    if (trimmed.length > 30) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'Name must be at most 30 characters.',
      });
    }
    if (!/^[A-Za-z\s]+$/.test(trimmed)) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'Name must contain letters only.',
      });
    }
    citizen.name = trimmed;
  }

  if (phone !== undefined) {
    const trimmed = String(phone).trim();
    if (!trimmed) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'Phone is required.',
      });
    }
    const phoneDigits = trimmed.replace(/[\s-]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(phoneDigits) || phoneDigits.length < 7 || phoneDigits.length > 15) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'Phone must contain numbers only.',
      });
    }
    citizen.phone = trimmed;
  }

  if (email !== undefined) {
    const trimmed = String(email).trim().toLowerCase();
    if (!trimmed || !isValidEmail(trimmed)) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }
    if (trimmed !== citizen.email) {
      const taken = await User.findOne({ email: trimmed, _id: { $ne: citizen._id } });
      if (taken) {
        if (req.file?.filename) {
          removeProfileImageFile(profileImagePublicPath(req.file.filename));
        }
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }
      citizen.email = trimmed;
    }
  }

  if (niraId !== undefined) {
    const trimmed = String(niraId).trim();
    if (!/^\d{11}$/.test(trimmed)) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'NIRA ID must be exactly 11 numbers.',
      });
    }
    if (trimmed !== citizen.niraId) {
      const taken = await User.findOne({ niraId: trimmed, _id: { $ne: citizen._id } });
      if (taken) {
        if (req.file?.filename) {
          removeProfileImageFile(profileImagePublicPath(req.file.filename));
        }
        return res.status(409).json({
          success: false,
          message: 'An account with this NIRA ID already exists.',
        });
      }
      citizen.niraId = trimmed;
    }
  }

  if (req.file) {
    citizen.profileImage = profileImagePublicPath(req.file.filename);
  }

  await citizen.save();

  if (req.file && previousImage && previousImage !== citizen.profileImage) {
    await createAuditLog({
      actor: req.user,
      action: 'UPDATE',
      recordType: 'Citizen',
      recordId: citizen._id,
      recordLabel: citizen.name,
      previousValue: previousImage,
      newValue: citizen.profileImage,
      details: 'Citizen profile image updated.',
      ipAddress: getRequestIp(req),
    });
    removeProfileImageFile(previousImage);
  }

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

  const previous = citizen.isActive !== false ? 'Active' : 'Inactive';
  const next = isActive ? 'Active' : 'Inactive';
  citizen.isActive = isActive;
  await citizen.save();

  await createAuditLog({
    actor: req.user,
    action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
    recordType: 'Citizen',
    recordId: citizen._id,
    recordLabel: citizen.name,
    previousValue: previous,
    newValue: next,
    details: `Citizen status changed to ${next}.`,
    ipAddress: getRequestIp(req),
  });

  return res.json({
    success: true,
    message: isActive ? 'Citizen activated.' : 'Citizen deactivated.',
    data: { citizen: citizen.toSafeObject() },
  });
});

export const registerCitizen = asyncHandler(async (req, res) => {
  const { name, niraId, phone, email, password, confirmPassword } = req.body;

  const trimmedName = String(name ?? '').trim();
  const trimmedNira = String(niraId ?? '').trim();
  const trimmedPhone = String(phone ?? '').trim();
  const trimmedEmail = String(email ?? '').trim().toLowerCase();
  const rawPassword = String(password ?? '');
  const uploadedPath = req.file ? profileImagePublicPath(req.file.filename) : '';

  const fail = (status, message) => {
    if (uploadedPath) removeProfileImageFile(uploadedPath);
    return res.status(status).json({ success: false, message });
  };

  if (!trimmedName) {
    return fail(400, 'Name is required.');
  }
  if (trimmedName.length > 30) {
    return fail(400, 'Name must be at most 30 characters.');
  }
  if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
    return fail(400, 'Name must contain letters only.');
  }
  if (!trimmedNira) {
    return fail(400, 'NIRA ID is required.');
  }
  if (!/^\d{11}$/.test(trimmedNira)) {
    return fail(400, 'NIRA ID must be exactly 11 numbers.');
  }
  if (!trimmedPhone) {
    return fail(400, 'Phone is required.');
  }
  {
    const phoneDigits = trimmedPhone.replace(/[\s-]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(phoneDigits)) {
      return fail(400, 'Phone must contain numbers only.');
    }
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return fail(400, 'Please enter a valid phone number.');
    }
  }
  if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
    return fail(400, 'Please enter a valid email address.');
  }
  if (!rawPassword || rawPassword.length < 8) {
    return fail(400, 'Password must be at least 8 characters.');
  }
  if (confirmPassword !== undefined && rawPassword !== confirmPassword) {
    return fail(400, 'Password and confirm password do not match.');
  }
  if (!req.file) {
    return fail(400, 'Profile image is required.');
  }

  const existingEmail = await User.findOne({ email: trimmedEmail });
  if (existingEmail) {
    return fail(409, 'An account with this email already exists.');
  }

  const existingNira = await User.findOne({ niraId: trimmedNira });
  if (existingNira) {
    return fail(409, 'An account with this NIRA ID already exists.');
  }

  const citizen = await User.create({
    name: trimmedName,
    niraId: trimmedNira,
    phone: trimmedPhone,
    tell: '',
    email: trimmedEmail,
    password: rawPassword,
    role: 'citizen',
    profileImage: uploadedPath,
    isActive: true,
  });

  await createAuditLog({
    actor: req.user,
    action: 'CREATE',
    recordType: 'Citizen',
    recordId: citizen._id,
    recordLabel: citizen.name,
    previousValue: '',
    newValue: citizen.profileImage || 'Citizen registered',
    details: `Citizen ${citizen.email} registered by admin.`,
    ipAddress: getRequestIp(req),
  });

  await notifyAdmins(
    {
      title: 'New Citizen Registered',
      message: `A new citizen has been registered: ${citizen.name}.`,
      type: 'citizen_registered',
      relatedUser: citizen._id,
      linkPath: citizenPath(citizen._id),
      ...actorFields(req.user),
    },
    { excludeUserId: req.user._id }
  );

  await notifyUser({
    userId: citizen._id,
    title: 'Registration Complete',
    message: 'Your Citizen Portal account has been created successfully.',
    type: 'citizen_registered_self',
    relatedUser: citizen._id,
    ...actorFields(req.user),
  });

  return res.status(201).json({
    success: true,
    message: 'Citizen registered successfully.',
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

export const registerStaffUser = asyncHandler(async (req, res) => {
  const {
    name,
    niraId,
    phone,
    email,
    role,
    badgeNumber,
    station,
    geographicLocationId,
    region,
    district,
    village,
    area,
  } = req.body;

  const trimmedName = String(name ?? '').trim();
  const trimmedNira = String(niraId ?? '').trim();
  const trimmedPhone = String(phone ?? '').trim();
  const trimmedEmail = String(email ?? '').trim().toLowerCase();
  const staffRole = String(role ?? 'police').trim().toLowerCase();
  const uploadedPath = req.file ? profileImagePublicPath(req.file.filename) : '';

  const fail = (status, message) => {
    if (uploadedPath) removeProfileImageFile(uploadedPath);
    return res.status(status).json({ success: false, message });
  };

  if (!trimmedName) {
    return fail(400, 'Name is required.');
  }
  if (trimmedName.length > 30) {
    return fail(400, 'Name must be at most 30 characters.');
  }
  if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
    return fail(400, 'Name must contain letters only.');
  }
  if (!trimmedNira) {
    return fail(400, 'NIRA ID is required.');
  }
  if (!/^\d{11}$/.test(trimmedNira)) {
    return fail(400, 'NIRA ID must be exactly 11 numbers.');
  }
  if (!trimmedPhone) {
    return fail(400, 'Phone is required.');
  }
  {
    const phoneDigits = trimmedPhone.replace(/[\s-]/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(phoneDigits)) {
      return fail(400, 'Phone must contain numbers only.');
    }
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return fail(400, 'Please enter a valid phone number.');
    }
  }
  if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
    return fail(400, 'Please enter a valid email address.');
  }
  if (staffRole !== 'admin' && staffRole !== 'police') {
    return fail(400, 'Role must be Admin or Police.');
  }
  if (!req.file) {
    return fail(400, 'Profile image is required.');
  }

  const existingEmail = await User.findOne({ email: trimmedEmail });
  if (existingEmail) {
    return fail(409, 'A user with this email already exists.');
  }

  const existingNira = await User.findOne({ niraId: trimmedNira });
  if (existingNira) {
    return fail(409, 'An account with this NIRA ID already exists.');
  }

  let defaultPassword;
  try {
    defaultPassword = getDefaultUserPassword();
  } catch (error) {
    return fail(500, error.message);
  }

  const user = new User({
    name: trimmedName,
    niraId: trimmedNira,
    phone: trimmedPhone,
    tell: '',
    email: trimmedEmail,
    password: defaultPassword,
    role: staffRole,
    badgeNumber: badgeNumber ? String(badgeNumber).trim() : '',
    station: station ? String(station).trim() : '',
    profileImage: uploadedPath,
    isActive: true,
    passwordChangeRequired: true,
    menuPermissions: staffRole === 'police' ? DEFAULT_POLICE_PERMISSIONS : [],
  });

  let geoResult;
  if (geographicLocationId) {
    geoResult = await applyGeographicLocation(user, geographicLocationId);
  } else {
    geoResult = await applyGeographicSelection(user, { region, district, village, area });
  }

  if (!geoResult.ok) {
    return fail(400, geoResult.message);
  }

  await user.save();

  await createAuditLog({
    actor: req.user,
    action: 'CREATE',
    recordType: 'User',
    recordId: user._id,
    recordLabel: user.name,
    previousValue: '',
    newValue: user.profileImage || `${staffRole} registered`,
    details: `${staffRole} user ${user.email} registered with profile image.`,
    ipAddress: getRequestIp(req),
  });

  if (staffRole === 'police') {
    await notifyUser({
      userId: user._id,
      title: 'Police Account Created',
      message: 'Your Police account has been created by the System Administrator.',
      type: 'police_account_created',
      relatedUser: user._id,
      linkPath: '/profile',
      ...actorFields(req.user),
    });
  }

  await notifyAdmins(
    {
      title: staffRole === 'police' ? 'Police User Created' : 'Admin User Created',
      message: `${user.name} was registered as ${staffRole}.`,
      type: 'staff_user_created',
      relatedUser: user._id,
      linkPath: staffUserPath(user._id),
      ...actorFields(req.user),
    },
    { excludeUserId: req.user._id }
  );

  return res.status(201).json({
    success: true,
    message: `${staffRole === 'admin' ? 'Admin' : 'Police'} user registered successfully. Share the account email and your organization's initial password with the user securely.`,
    data: {
      user: user.toSafeObject(),
      credentialsNotice:
        'Provide the user with their email and the initial password through your secure channel.',
    },
  });
});

/** @deprecated Use registerStaffUser — kept for route compatibility */
export const registerPolice = registerStaffUser;

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
    if (req.file?.filename) {
      removeProfileImageFile(profileImagePublicPath(req.file.filename));
    }
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  const { name, phone, badgeNumber, station, email, geographicLocationId, region, district, village, area } = req.body;
  const previousImage = user.profileImage || '';

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }
    if (trimmed.length > 30) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
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
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'Phone is required.',
      });
    }
    user.phone = trimmed;
  }

  if (email !== undefined) {
    const trimmed = String(email).trim().toLowerCase();
    if (!trimmed || !isValidEmail(trimmed)) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }
    if (trimmed !== user.email) {
      const taken = await User.findOne({ email: trimmed, _id: { $ne: user._id } });
      if (taken) {
        if (req.file?.filename) {
          removeProfileImageFile(profileImagePublicPath(req.file.filename));
        }
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }
      user.email = trimmed;
    }
  }

  if (badgeNumber !== undefined) {
    user.badgeNumber = String(badgeNumber).trim();
  }

  if (station !== undefined) {
    user.station = String(station).trim();
  }

  if (geographicLocationId || region || district) {
    let geoResult;
    if (geographicLocationId) {
      geoResult = await applyGeographicLocation(user, geographicLocationId);
    } else {
      geoResult = await applyGeographicSelection(user, { region, district, village, area });
    }
    if (!geoResult.ok) {
      if (req.file?.filename) {
        removeProfileImageFile(profileImagePublicPath(req.file.filename));
      }
      return res.status(400).json({
        success: false,
        message: geoResult.message,
      });
    }
  }

  if (req.file) {
    user.profileImage = profileImagePublicPath(req.file.filename);
  }

  await user.save();

  if (req.file && previousImage && previousImage !== user.profileImage) {
    await createAuditLog({
      actor: req.user,
      action: 'UPDATE',
      recordType: 'User',
      recordId: user._id,
      recordLabel: user.name,
      previousValue: previousImage,
      newValue: user.profileImage,
      details: 'Staff profile image updated.',
      ipAddress: getRequestIp(req),
    });
    removeProfileImageFile(previousImage);
  }

  await notifyUser({
    userId: user._id,
    title: 'Profile Updated',
    message: 'Your account information has been updated.',
    type: 'police_profile_updated',
    relatedUser: user._id,
    linkPath: '/profile',
    ...actorFields(req.user),
  });

  await notifyAdmins(
    {
      title: user.role === 'police' ? 'Police User Updated' : 'Staff User Updated',
      message: `${user.name}'s account information was updated.`,
      type: 'staff_user_updated',
      relatedUser: user._id,
      linkPath: staffUserPath(user._id),
      ...actorFields(req.user),
    },
    { excludeUserId: req.user._id }
  );

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

  const previous = user.isActive !== false ? 'Active' : 'Inactive';
  const next = isActive ? 'Active' : 'Inactive';
  user.isActive = isActive;
  await user.save();

  await createAuditLog({
    actor: req.user,
    action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
    recordType: 'User',
    recordId: user._id,
    recordLabel: user.name,
    previousValue: previous,
    newValue: next,
    details: `${user.role} account status changed to ${next}.`,
    ipAddress: getRequestIp(req),
  });

  await notifyAccountStatusChange(req, {
    actor: req.user,
    targetUser: user,
    isActive,
  });

  return res.json({
    success: true,
    message: isActive ? 'User activated.' : 'User deactivated.',
    data: { user: user.toSafeObject() },
  });
});

// Permissions are fully supported for police menu access control.
export const getPermissionsAvailability = asyncHandler(async (_req, res) => {
  return res.json({
    success: true,
    data: {
      supported: true,
      message: 'Permissions module is available.',
      modules: MENU_MODULES,
    },
  });
});

export const listPoliceUsersForPermissions = asyncHandler(async (_req, res) => {
  const users = await User.find({ role: 'police' }).sort({ name: 1 });

  return res.json({
    success: true,
    data: {
      users: users.map((item) => item.toSafeObject()),
    },
  });
});

export const getUserPermissions = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    role: 'police',
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Police user not found.',
    });
  }

  return res.json({
    success: true,
    data: {
      user: user.toSafeObject(),
      modules: MENU_MODULES,
      permissions: normalizePermissions(user.menuPermissions),
    },
  });
});

export const updateUserPermissions = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    role: 'police',
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Police user not found.',
    });
  }

  const permissions = normalizePermissions(req.body.permissions || req.body.modules || []);

  // Profile is always available so police can open the portal.
  if (!permissions.includes('profile')) {
    permissions.push('profile');
  }

  user.menuPermissions = permissions;
  await user.save();

  await createAuditLog({
    actor: req.user,
    action: 'UPDATE',
    recordType: 'Permissions',
    recordId: user._id,
    recordLabel: user.name,
    previousValue: '',
    newValue: permissions.join(', '),
    details: `Menu permissions updated for ${user.name}.`,
    ipAddress: getRequestIp(req),
  });

  await notifyUser({
    userId: user._id,
    title: 'Permissions Updated',
    message: 'Your portal permissions have been updated by the System Administrator.',
    type: 'permissions_updated',
    relatedUser: user._id,
    linkPath: '/profile',
    ...actorFields(req.user),
  });

  await notifyAdmins(
    {
      title: 'Police User Permissions Changed',
      message: `Menu permissions were updated for ${user.name}.`,
      type: 'permissions_updated_admin',
      relatedUser: user._id,
      linkPath: `/settings/permissions?userId=${user._id}`,
      ...actorFields(req.user),
    },
    { excludeUserId: req.user._id }
  );

  return res.json({
    success: true,
    message: 'Permissions updated successfully.',
    data: {
      user: user.toSafeObject(),
      permissions: user.menuPermissions,
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
