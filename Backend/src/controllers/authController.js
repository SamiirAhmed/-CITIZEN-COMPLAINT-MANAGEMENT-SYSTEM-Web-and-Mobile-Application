import User from '../models/User.js';
import { asyncHandler, signToken } from '../utils/helpers.js';
import {
  validateCitizenRegistration,
  validateLoginInput,
} from '../utils/citizenValidation.js';

export const registerCitizen = asyncHandler(async (req, res) => {
  const validation = validateCitizenRegistration(req.body);

  if (!validation.ok) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  const { name, niraId, phone, tell, email, password } = validation.data;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  const existingNira = await User.findOne({ niraId });
  if (existingNira) {
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
  });

  const token = signToken(user._id, user.role);

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

  const { email, password } = validation.data;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'This account has been deactivated.',
    });
  }

  const token = signToken(user._id, user.role);

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
  const { name, phone, tell, email, address, username, avatar } = req.body;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernamePattern = /^[a-z0-9._-]{3,30}$/i;

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }
    if (trimmedName.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at most 30 characters.',
      });
    }
    req.user.name = trimmedName;
  }

  if (phone !== undefined) {
    const trimmedPhone = String(phone).trim();
    if (!trimmedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone is required.',
      });
    }
    req.user.phone = trimmedPhone;
  }

  if (tell !== undefined) {
    req.user.tell = String(tell).trim();
  }

  if (address !== undefined) {
    req.user.address = String(address).trim();
  }

  if (email !== undefined) {
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!trimmedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }
    if (!emailPattern.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }
    const existingEmail = await User.findOne({
      email: trimmedEmail,
      _id: { $ne: req.user._id },
    });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    req.user.email = trimmedEmail;
  }

  if (username !== undefined) {
    const trimmedUsername = String(username).trim().toLowerCase();
    if (!trimmedUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is required.',
      });
    }
    if (!usernamePattern.test(trimmedUsername)) {
      return res.status(400).json({
        success: false,
        message:
          'Username must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens.',
      });
    }
    const existingUsername = await User.findOne({
      username: trimmedUsername,
      _id: { $ne: req.user._id },
    });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken.',
      });
    }
    req.user.username = trimmedUsername;
  }

  if (avatar !== undefined) {
    const nextAvatar = String(avatar || '');
    if (nextAvatar && !nextAvatar.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Avatar must be a valid image.',
      });
    }
    if (nextAvatar.length > 750000) {
      return res.status(400).json({
        success: false,
        message: 'Profile photo is too large. Please upload a smaller image.',
      });
    }
    req.user.avatar = nextAvatar;
  }

  await req.user.save();

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

  if (String(newPassword).length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters.',
    });
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password and confirm password do not match.',
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
