import User from '../models/User.js';
import {
  databaseUnavailableMessage,
  isDatabaseError,
  isDbReady,
} from '../config/db.js';
import {
  asyncHandler,
  createAuditLog,
  getRequestIp,
  notifyRole,
  signToken,
} from '../utils/helpers.js';
import {
  validateCitizenRegistration,
  validateLoginInput,
  isValidEmail,
} from '../utils/citizenValidation.js';
import {
  profileImagePublicPath,
  removeProfileImageFile,
} from '../middleware/uploadProfileImage.js';

const cleanupUpload = (req) => {
  if (req.file?.filename) {
    removeProfileImageFile(profileImagePublicPath(req.file.filename));
  }
};

export const registerCitizen = asyncHandler(async (req, res) => {
  const validation = validateCitizenRegistration(req.body);

  if (!validation.ok) {
    if (req.file?.path) removeProfileImageFile(profileImagePublicPath(req.file.filename));
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Profile image is required.',
    });
  }

  const { name, niraId, phone, tell, email, password } = validation.data;
  const profileImage = profileImagePublicPath(req.file.filename);

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    removeProfileImageFile(profileImage);
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  const existingNira = await User.findOne({ niraId });
  if (existingNira) {
    removeProfileImageFile(profileImage);
    return res.status(409).json({
      success: false,
      message: 'An account with this NIRA ID already exists.',
    });
  }

  const user = await User.create({
    name,
    niraId,
    phone,
    tell,
    email,
    password,
    role: 'citizen',
    profileImage,
  });

  const token = signToken(user._id, user.role);

  await notifyRole('admin', {
    title: 'Citizen Registered',
    message: `${user.name} registered as a citizen.`,
    type: 'citizen_registered',
    relatedUser: user._id,
    linkPath: `/citizens/${user._id}`,
  });

  return res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: {
      token,
      user: user.toSafeObject(),
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const validation = validateLoginInput(req.body);

  if (!validation.ok) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  if (!isDbReady()) {
    return res.status(503).json({
      success: false,
      message: databaseUnavailableMessage(),
    });
  }

  const { email, password } = validation.data;

  let user;
  try {
    user = await User.findOne({ email }).select('+password');
  } catch (error) {
    if (isDatabaseError(error)) {
      console.error('Login database error:', error.message);
      return res.status(503).json({
        success: false,
        message: databaseUnavailableMessage(),
      });
    }
    throw error;
  }

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account is inactive. Please contact an administrator.',
    });
  }

  const token = signToken(user._id, user.role);

  if (user.role === 'admin' || user.role === 'police') {
    await createAuditLog({
      actor: user,
      action: 'LOGIN',
      recordType: 'Session',
      recordId: user._id,
      recordLabel: user.name,
      newValue: 'Signed in',
      details: `${user.role} signed in.`,
      ipAddress: getRequestIp(req),
    });
  }

  return res.json({
    success: true,
    message: 'Login successful.',
    data: {
      token,
      user: user.toSafeObject(),
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  // Never allow role/status changes from self-service profile.
  const { name, phone, email } = req.body;
  const previousImage = req.user.profileImage || '';
  const previousName = req.user.name;
  const previousPhone = req.user.phone || '';
  const previousEmail = req.user.email;
  const changed = [];

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
      cleanupUpload(req);
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }
    if (trimmedName.length > 30) {
      cleanupUpload(req);
      return res.status(400).json({
        success: false,
        message: 'Name must be at most 30 characters.',
      });
    }
    if (trimmedName !== req.user.name) {
      req.user.name = trimmedName;
      changed.push('name');
    }
  }

  if (phone !== undefined) {
    const trimmedPhone = String(phone).trim();
    if (!trimmedPhone) {
      cleanupUpload(req);
      return res.status(400).json({
        success: false,
        message: 'Phone is required.',
      });
    }
    if (trimmedPhone !== req.user.phone) {
      req.user.phone = trimmedPhone;
      changed.push('phone');
    }
  }

  if (email !== undefined) {
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      cleanupUpload(req);
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }
    if (trimmedEmail !== req.user.email) {
      const taken = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: req.user._id },
      });
      if (taken) {
        cleanupUpload(req);
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }
      req.user.email = trimmedEmail;
      changed.push('email');
    }
  }

  if (req.file) {
    req.user.profileImage = profileImagePublicPath(req.file.filename);
    changed.push('profileImage');
  }

  await req.user.save();

  if (req.file && previousImage && previousImage !== req.user.profileImage) {
    removeProfileImageFile(previousImage);
  }

  if (req.user.role === 'admin' || req.user.role === 'police') {
    if (changed.includes('profileImage')) {
      await createAuditLog({
        actor: req.user,
        action: 'UPDATE',
        recordType: 'Profile',
        recordId: req.user._id,
        recordLabel: req.user.name,
        previousValue: previousImage || '(none)',
        newValue: req.user.profileImage || '(none)',
        details: 'Profile image updated.',
        ipAddress: getRequestIp(req),
      });
    }

    const fieldChanges = changed.filter((key) => key !== 'profileImage');
    if (fieldChanges.length) {
      await createAuditLog({
        actor: req.user,
        action: 'UPDATE',
        recordType: 'Profile',
        recordId: req.user._id,
        recordLabel: req.user.name,
        previousValue: [
          fieldChanges.includes('name') ? `name=${previousName}` : null,
          fieldChanges.includes('email') ? `email=${previousEmail}` : null,
          fieldChanges.includes('phone') ? `phone=${previousPhone}` : null,
        ]
          .filter(Boolean)
          .join('; '),
        newValue: [
          fieldChanges.includes('name') ? `name=${req.user.name}` : null,
          fieldChanges.includes('email') ? `email=${req.user.email}` : null,
          fieldChanges.includes('phone') ? `phone=${req.user.phone}` : null,
        ]
          .filter(Boolean)
          .join('; '),
        details: `Profile fields updated: ${fieldChanges.join(', ')}.`,
        ipAddress: getRequestIp(req),
      });
    }
  }

  return res.json({
    success: true,
    message: 'Profile updated successfully!',
    data: {
      user: req.user.toSafeObject(),
    },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required.',
    });
  }

  if (!String(newPassword).trim()) {
    return res.status(400).json({
      success: false,
      message: 'New password cannot be empty.',
    });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters.',
    });
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match.',
    });
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect.',
    });
  }

  user.password = newPassword;
  await user.save();

  if (user.role === 'admin' || user.role === 'police') {
    await createAuditLog({
      actor: user,
      action: 'UPDATE',
      recordType: 'Profile',
      recordId: user._id,
      recordLabel: user.name,
      previousValue: '',
      newValue: 'Password changed',
      details: 'Account password was changed. Password values were not logged.',
      ipAddress: getRequestIp(req),
    });
  }

  return res.json({
    success: true,
    message: 'Password changed successfully.',
  });
});

export const logout = asyncHandler(async (_req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});
