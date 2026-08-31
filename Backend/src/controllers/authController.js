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
  signToken,
} from '../utils/helpers.js';
import {
  actorFields,
  citizenPath,
  notifyAdmins,
  notifyUser,
} from '../utils/notifyEvent.js';
import {
  recordAuthAuditEvent,
} from '../utils/authAudit.js';
import { getAccessSource } from '../utils/requestContext.js';
import {
  validateCitizenRegistration,
  validateLoginInput,
  isValidEmail,
} from '../utils/citizenValidation.js';
import {
  profileImagePublicPath,
  removeProfileImageFile,
} from '../middleware/uploadProfileImage.js';
import { applyGeographicSelection } from '../utils/geographyHelpers.js';
import { getDefaultUserPassword } from '../utils/defaultPassword.js';
import {
  isValidSomaliMobile,
  normalizeSomaliMobile,
} from '../services/tabaarakSmsService.js';
import { findCitizenByNormalizedPhone } from './otpController.js';

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

  const { name, niraId, phone, tell, email, password, region, district } = validation.data;
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
    phoneNormalized: isValidSomaliMobile(phone)
      ? normalizeSomaliMobile(phone)
      : undefined,
    phoneVerified: false,
    profileComplete: true,
    passwordSet: true,
    tell,
    email,
    password,
    role: 'citizen',
    profileImage,
  });

  const geoResult = await applyGeographicSelection(user, {
    region,
    district,
    village: req.body.village,
    area: req.body.area,
  });

  if (!geoResult.ok) {
    await User.deleteOne({ _id: user._id });
    removeProfileImageFile(profileImage);
    return res.status(400).json({
      success: false,
      message: geoResult.message,
    });
  }

  await user.save();

  const token = signToken(user._id, user.role);

  await notifyAdmins({
    title: 'New Citizen Registered',
    message: `A new citizen has registered in the Citizen Portal: ${user.name}.`,
    type: 'citizen_registered',
    relatedUser: user._id,
    linkPath: citizenPath(user._id),
    ...actorFields(user),
  });

  await notifyUser({
    userId: user._id,
    title: 'Registration Complete',
    message: 'Your Citizen Portal account has been created successfully.',
    type: 'citizen_registered_self',
    relatedUser: user._id,
    ...actorFields(user),
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

  const { identifier, password } = validation.data;
  const accessSource = getAccessSource(req);
  const emailForAudit = identifier.includes('@')
    ? identifier.toLowerCase()
    : identifier;

  let user;
  try {
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() }).select(
        '+password'
      );
    } else if (isValidSomaliMobile(identifier)) {
      user = await findCitizenByNormalizedPhone(normalizeSomaliMobile(identifier));
    } else {
      user = await User.findOne({ email: identifier.toLowerCase() }).select(
        '+password'
      );
    }
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
    await recordAuthAuditEvent(req, {
      actor: user,
      email: emailForAudit,
      action: 'LOGIN_FAILED',
      status: 'failed',
      failureReason: 'Invalid credentials',
      accessSource,
      notifyAdmins: false,
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid email/mobile or password.',
    });
  }

  // Skip/OTP placeholder accounts cannot use password login until they set one.
  const isPlaceholder =
    user.passwordSet !== true &&
    String(user.email || '').endsWith('@otp.local');
  if (isPlaceholder) {
    return res.status(401).json({
      success: false,
      message: 'Please verify your mobile number to continue, or complete your profile first.',
    });
  }

  if (user.passwordSet !== true) {
    user.passwordSet = true;
    if (user.district && user.name && !String(user.email || '').endsWith('@otp.local')) {
      user.profileComplete = true;
    }
    await user.save();
  }

  if (!user.isActive) {
    await recordAuthAuditEvent(req, {
      actor: user,
      email: emailForAudit,
      action: 'LOGIN_FAILED',
      status: 'failed',
      failureReason: 'Account inactive',
      accessSource,
      notifyAdmins: false,
    });

    return res.status(403).json({
      success: false,
      message: 'Your account is inactive. Please contact an administrator.',
    });
  }

  const token = signToken(user._id, user.role);

  if (user.role === 'admin' || user.role === 'police') {
    await recordAuthAuditEvent(req, {
      actor: user,
      email: user.email || emailForAudit,
      notifyAdmins: false,
      excludeNotificationUserId: user._id,
    });

    if (user.passwordChangeRequired) {
      await recordAuthAuditEvent(req, {
        actor: user,
        email: user.email || emailForAudit,
        action: 'PASSWORD_CHANGE_REQUIRED',
        status: 'info',
        accessSource,
        notifyAdmins: true,
        excludeNotificationUserId: user._id,
      });
    }
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
  const { name, phone, email, region, district, village, area } = req.body;
  const previousImage = req.user.profileImage || '';
  const previousName = req.user.name;
  const previousPhone = req.user.phone || '';
  const previousEmail = req.user.email;
  const previousLocation = [req.user.district, req.user.village, req.user.area]
    .filter(Boolean)
    .join(' — ');
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
    if (req.user.phoneVerified === true) {
      // Verified phone cannot be changed from self-service profile.
    } else {
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
        if (isValidSomaliMobile(trimmedPhone)) {
          req.user.phoneNormalized = normalizeSomaliMobile(trimmedPhone);
        }
        changed.push('phone');
      }
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

  if (district !== undefined) {
    const geoResult = await applyGeographicSelection(req.user, {
      region,
      district,
      village,
      area,
    });
    if (!geoResult.ok) {
      cleanupUpload(req);
      return res.status(400).json({
        success: false,
        message: geoResult.message || 'Unable to save location.',
      });
    }
    const nextLocation = [req.user.district, req.user.village, req.user.area]
      .filter(Boolean)
      .join(' — ');
    if (nextLocation !== previousLocation) {
      changed.push('location');
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
          fieldChanges.includes('location')
            ? `location=${previousLocation || '(none)'}`
            : null,
        ]
          .filter(Boolean)
          .join('; '),
        newValue: [
          fieldChanges.includes('name') ? `name=${req.user.name}` : null,
          fieldChanges.includes('email') ? `email=${req.user.email}` : null,
          fieldChanges.includes('phone') ? `phone=${req.user.phone}` : null,
          fieldChanges.includes('location')
            ? `location=${[req.user.district, req.user.village, req.user.area]
                .filter(Boolean)
                .join(' — ') || '(none)'}`
            : null,
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

  if (String(newPassword).trim().length !== String(newPassword).length) {
    return res.status(400).json({
      success: false,
      message: 'Password cannot contain leading or trailing spaces.',
    });
  }

  if (!/\S/.test(String(newPassword))) {
    return res.status(400).json({
      success: false,
      message: 'Password cannot be empty or spaces only.',
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

  let defaultPassword;
  try {
    defaultPassword = getDefaultUserPassword();
  } catch {
    defaultPassword = null;
  }

  if (defaultPassword && newPassword === defaultPassword) {
    return res.status(400).json({
      success: false,
      message: 'Choose a new password different from the initial default password.',
    });
  }

  user.password = newPassword;
  user.passwordChangeRequired = false;
  user.passwordSet = true;
  await user.save();

  if (user.role === 'admin' || user.role === 'police') {
    await recordAuthAuditEvent(req, {
      actor: user,
      email: user.email,
      action: 'PASSWORD_CHANGED',
      status: 'success',
      details: 'Account password was changed. Password values were not logged.',
      notifyAdmins: true,
      excludeNotificationUserId: user._id,
    });
  }

  return res.json({
    success: true,
    message: 'Password changed successfully.',
    data: {
      user: user.toSafeObject(),
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'police')) {
    await recordAuthAuditEvent(req, {
      actor: req.user,
      email: req.user.email,
      action: 'LOGOUT',
      status: 'success',
      notifyAdmins: false,
      excludeNotificationUserId: req.user._id,
    });
  }

  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});
