import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import OtpVerification from '../models/OtpVerification.js';
import User from '../models/User.js';
import {
  isValidSomaliMobile,
  maskPhone,
  normalizeSomaliMobile,
  sendTabaarakSms,
} from '../services/tabaarakSmsService.js';
import { asyncHandler, signToken } from '../utils/helpers.js';
import {
  applyGeographicSelection,
} from '../utils/geographyHelpers.js';
import { isValidEmail } from '../utils/citizenValidation.js';
import {
  actorFields,
  citizenPath,
  notifyAdmins,
  notifyUser,
} from '../utils/notifyEvent.js';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFIED_TOKEN_TTL = '15m';

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generateOtp() {
  const max = 10 ** OTP_LENGTH;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(OTP_LENGTH, '0');
}

function displayPhone(normalized) {
  return `+252 ${normalized}`;
}

function signPhoneVerifiedToken(phoneNormalized) {
  return jwt.sign(
    {
      purpose: 'phone_verified',
      phoneNormalized,
    },
    process.env.JWT_SECRET,
    { expiresIn: VERIFIED_TOKEN_TTL }
  );
}

export function verifyPhoneToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== 'phone_verified' || !decoded.phoneNormalized) {
    const error = new Error('Invalid verification session.');
    error.statusCode = 401;
    throw error;
  }
  return decoded;
}

function isProfileComplete(user) {
  if (!user) return false;
  if (user.profileComplete === true) return true;
  const hasName =
    Boolean(user.name) &&
    user.name.trim() &&
    user.name.trim().toLowerCase() !== 'citizen';
  const hasEmail =
    Boolean(user.email) && !String(user.email).endsWith('@otp.local');
  const hasPassword = user.passwordSet === true;
  const hasDistrict = Boolean(user.district);
  // Legacy citizens (pre-OTP) with real email + district count as complete.
  if (hasName && hasEmail && hasDistrict) return true;
  return hasName && hasEmail && hasPassword && hasDistrict;
}

function refreshProfileFlags(user) {
  const complete = isProfileComplete(user);
  user.profileComplete = complete;
  return complete;
}

export async function findCitizenByNormalizedPhone(phoneNormalized) {
  const normalized = normalizeSomaliMobile(phoneNormalized);
  if (!normalized) return null;

  let user = await User.findOne({
    role: 'citizen',
    phoneNormalized: normalized,
  }).select('+password');

  if (user) return user;

  const patterns = [
    normalized,
    `0${normalized}`,
    `252${normalized}`,
    `+252${normalized}`,
    `+252 ${normalized}`,
    `+252-${normalized}`,
  ];

  user = await User.findOne({
    role: 'citizen',
    $or: [{ phone: { $in: patterns } }, { tell: { $in: patterns } }],
  }).select('+password');

  if (user) {
    user.phoneNormalized = normalized;
    if (!user.phone || !isValidSomaliMobile(user.phone)) {
      user.phone = displayPhone(normalized);
    }
    await user.save();
  }

  return user;
}

function citizenSafePayload(user) {
  const safe = user.toSafeObject();
  safe.profileComplete = user.profileComplete === true || isProfileComplete(user);
  safe.phoneVerified = user.phoneVerified !== false;
  safe.hasPassword = user.passwordSet === true;
  safe.needsProfileCompletion = !safe.profileComplete;
  return safe;
}

async function ensureCitizenForPhone(phoneNormalized) {
  let user = await findCitizenByNormalizedPhone(phoneNormalized);

  if (user) {
    user.phoneNormalized = phoneNormalized;
    user.phoneVerified = true;
    if (!user.phone) user.phone = displayPhone(phoneNormalized);
    refreshProfileFlags(user);
    await user.save();
    return { user, created: false };
  }

  const placeholderEmail = `c${phoneNormalized}@otp.local`;

  user = await User.create({
    name: 'Citizen',
    phone: displayPhone(phoneNormalized),
    phoneNormalized,
    phoneVerified: true,
    profileComplete: false,
    passwordSet: false,
    email: placeholderEmail,
    // Temporary random password so schema hashing works; passwordSet=false blocks login
    password: crypto.randomBytes(24).toString('hex') + 'Aa1!',
    role: 'citizen',
    niraId: undefined,
  });

  return { user, created: true };
}

function friendlySmsError(error) {
  const code = error?.code || '';
  if (code === 'SMS_NOT_CONFIGURED') {
    return 'Unable to send verification code. Please try again later.';
  }
  if (code === 'SMS_AUTH_FAILED' || code === 'SMS_UNAVAILABLE') {
    return 'Unable to send verification code. Please try again.';
  }
  return 'Unable to send verification code. Please try again.';
}

export const sendOtp = asyncHandler(async (req, res) => {
  const rawPhone = String(req.body.phone ?? '').trim();

  if (!rawPhone) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid mobile number.',
    });
  }

  if (!isValidSomaliMobile(rawPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid Somali mobile number.',
    });
  }

  const phoneNormalized = normalizeSomaliMobile(rawPhone);
  const now = Date.now();

  let record = await OtpVerification.findOne({ phoneNormalized }).select('+otpHash');

  if (record) {
    const windowAge = now - new Date(record.windowStartedAt).getTime();
    if (windowAge > 60 * 60 * 1000) {
      record.sendCountWindow = 0;
      record.windowStartedAt = new Date();
    }

    if (record.sendCountWindow >= MAX_SENDS_PER_HOUR) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.',
        data: { retryAfterSeconds: 3600 },
      });
    }

    const sinceLast = now - new Date(record.lastSentAt).getTime();
    if (sinceLast < RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${retryAfterSeconds} seconds before requesting a new code.`,
        data: { retryAfterSeconds },
      });
    }
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(now + OTP_TTL_MS);

  if (!record) {
    record = new OtpVerification({ phoneNormalized });
  }

  record.otpHash = otpHash;
  record.expiresAt = expiresAt;
  record.attempts = 0;
  record.maxAttempts = MAX_VERIFY_ATTEMPTS;
  record.consumed = false;
  record.lastSentAt = new Date();
  record.sendCountWindow = (record.sendCountWindow || 0) + 1;
  if (!record.windowStartedAt) record.windowStartedAt = new Date();
  await record.save();

  const message = `Your SPO verification code is ${otp}.`;
  let smsResult;
  try {
    smsResult = await sendTabaarakSms(phoneNormalized, message);
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: friendlySmsError(error),
    });
  }

  if (!smsResult.success && !smsResult.acceptedForDelivery) {
    return res.status(502).json({
      success: false,
      message: 'Unable to send verification code. Please try again.',
    });
  }

  return res.json({
    success: true,
    message: 'Verification code sent.',
    data: {
      phone: displayPhone(phoneNormalized),
      maskedPhone: `+252 ${maskPhone(phoneNormalized)}`,
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      resendAfterSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000),
    },
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const rawPhone = String(req.body.phone ?? '').trim();
  const code = String(req.body.code ?? req.body.otp ?? '').trim();

  if (!isValidSomaliMobile(rawPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid mobile number.',
    });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      success: false,
      message: 'Incorrect verification code.',
    });
  }

  const phoneNormalized = normalizeSomaliMobile(rawPhone);
  const record = await OtpVerification.findOne({ phoneNormalized }).select('+otpHash');

  if (!record || record.consumed) {
    return res.status(400).json({
      success: false,
      message: 'This verification code has expired. Please request a new code.',
    });
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({
      success: false,
      message: 'This verification code has expired. Please request a new code.',
    });
  }

  if (record.attempts >= record.maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many incorrect attempts. Please request a new code.',
    });
  }

  if (hashOtp(code) !== record.otpHash) {
    record.attempts += 1;
    await record.save();
    return res.status(400).json({
      success: false,
      message: 'Incorrect verification code.',
      data: {
        attemptsRemaining: Math.max(0, record.maxAttempts - record.attempts),
      },
    });
  }

  record.consumed = true;
  await record.save();

  const existing = await findCitizenByNormalizedPhone(phoneNormalized);
  const verificationToken = signPhoneVerifiedToken(phoneNormalized);

  if (existing) {
    existing.phoneVerified = true;
    existing.phoneNormalized = phoneNormalized;
    refreshProfileFlags(existing);
    await existing.save();

    const complete = existing.profileComplete === true || isProfileComplete(existing);
    const hasPassword = existing.passwordSet === true;

    // Returning user with a complete profile → open dashboard
    if (complete) {
      if (!existing.passwordSet && !String(existing.email || '').endsWith('@otp.local')) {
        existing.passwordSet = true;
        existing.profileComplete = true;
        await existing.save();
      }
      const token = signToken(existing._id, existing.role);
      return res.json({
        success: true,
        message: 'OTP verified.',
        data: {
          verified: true,
          needsAccountChoice: false,
          alreadyRegistered: true,
          token,
          user: citizenSafePayload(existing),
          phone: displayPhone(phoneNormalized),
          maskedPhone: `+252 ${maskPhone(phoneNormalized)}`,
        },
      });
    }

    return res.json({
      success: true,
      message: 'OTP verified.',
      data: {
        verified: true,
        needsAccountChoice: true,
        alreadyRegistered: true,
        profileComplete: complete,
        hasPassword,
        verificationToken,
        phone: displayPhone(phoneNormalized),
        maskedPhone: `+252 ${maskPhone(phoneNormalized)}`,
        userPreview: citizenSafePayload(existing),
      },
    });
  }

  return res.json({
    success: true,
    message: 'OTP verified.',
    data: {
      verified: true,
      needsAccountChoice: true,
      alreadyRegistered: false,
      profileComplete: false,
      hasPassword: false,
      verificationToken,
      phone: displayPhone(phoneNormalized),
      maskedPhone: `+252 ${maskPhone(phoneNormalized)}`,
    },
  });
});

export const skipAccountSetup = asyncHandler(async (req, res) => {
  const verificationToken = String(req.body.verificationToken ?? '').trim();
  if (!verificationToken) {
    return res.status(400).json({
      success: false,
      message: 'Verification session is required.',
    });
  }

  let decoded;
  try {
    decoded = verifyPhoneToken(verificationToken);
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Verification session expired. Please verify your number again.',
    });
  }

  const { user, created } = await ensureCitizenForPhone(decoded.phoneNormalized);
  const token = signToken(user._id, user.role);

  if (created) {
    await notifyAdmins({
      title: 'New Citizen (Phone Verified)',
      message: `A citizen verified mobile ${displayPhone(decoded.phoneNormalized)} and entered the portal.`,
      type: 'citizen_registered',
      relatedUser: user._id,
      linkPath: citizenPath(user._id),
      ...actorFields(user),
    });
  }

  return res.json({
    success: true,
    message: 'Welcome to SPO Citizen Portal.',
    data: {
      token,
      user: citizenSafePayload(user),
      skippedAccountSetup: true,
    },
  });
});

export const completeAccount = asyncHandler(async (req, res) => {
  const verificationToken = String(req.body.verificationToken ?? '').trim();
  if (!verificationToken) {
    return res.status(400).json({
      success: false,
      message: 'Verification session is required.',
    });
  }

  let decoded;
  try {
    decoded = verifyPhoneToken(verificationToken);
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Verification session expired. Please verify your number again.',
    });
  }

  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');
  const confirmPassword = req.body.confirmPassword;
  const region = String(req.body.region ?? '').trim();
  const district = String(req.body.district ?? '').trim();
  const village = String(req.body.village ?? '').trim();
  const area = String(req.body.area ?? '').trim();
  const niraId = String(req.body.niraId ?? '').trim();

  if (!name || name.length > 30) {
    return res.status(400).json({
      success: false,
      message: !name ? 'Full name is required.' : 'Name must be at most 30 characters.',
    });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
  }

  if (email.endsWith('@otp.local')) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters.',
    });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match.',
    });
  }

  if (!district) {
    return res.status(400).json({
      success: false,
      message: 'Please select a district.',
    });
  }

  if (niraId && niraId.length !== 11) {
    return res.status(400).json({
      success: false,
      message: 'NIRA ID must be exactly 11 characters.',
    });
  }

  const emailTaken = await User.findOne({
    email,
    role: 'citizen',
    phoneNormalized: { $ne: decoded.phoneNormalized },
  });
  if (emailTaken) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  if (niraId) {
    const niraTaken = await User.findOne({
      niraId,
      phoneNormalized: { $ne: decoded.phoneNormalized },
    });
    if (niraTaken) {
      return res.status(409).json({
        success: false,
        message: 'An account with this NIRA ID already exists.',
      });
    }
  }

  let { user, created } = await ensureCitizenForPhone(decoded.phoneNormalized);

  // Block email collision with non-placeholder of another account (already checked)
  // Also block if another user has this email
  const otherEmail = await User.findOne({ email, _id: { $ne: user._id } });
  if (otherEmail) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  user.name = name;
  user.email = email;
  user.password = password;
  user.passwordSet = true;
  user.phoneVerified = true;
  user.phoneNormalized = decoded.phoneNormalized;
  user.phone = displayPhone(decoded.phoneNormalized);
  if (niraId) user.niraId = niraId;

  const geoResult = await applyGeographicSelection(user, {
    region,
    district,
    village,
    area,
  });

  if (!geoResult.ok) {
    return res.status(400).json({
      success: false,
      message: geoResult.message || 'Unable to save district.',
    });
  }

  user.profileComplete = true;
  await user.save();

  const token = signToken(user._id, user.role);

  if (created) {
    await notifyAdmins({
      title: 'New Citizen Registered',
      message: `A new citizen has registered in the Citizen Portal: ${user.name}.`,
      type: 'citizen_registered',
      relatedUser: user._id,
      linkPath: citizenPath(user._id),
      ...actorFields(user),
    });
  }

  await notifyUser({
    userId: user._id,
    title: 'Account Created',
    message: 'Your Citizen Portal account has been created successfully.',
    type: 'citizen_registered_self',
    relatedUser: user._id,
    ...actorFields(user),
  });

  return res.status(created ? 201 : 200).json({
    success: true,
    message: 'Account created successfully.',
    data: {
      token,
      user: citizenSafePayload(user),
    },
  });
});

export const completeProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      message: 'Only citizens can complete this profile.',
    });
  }

  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = req.body.password != null ? String(req.body.password) : null;
  const confirmPassword = req.body.confirmPassword;
  const region = String(req.body.region ?? '').trim();
  const district = String(req.body.district ?? '').trim();
  const village = String(req.body.village ?? '').trim();
  const area = String(req.body.area ?? '').trim();
  const niraId = String(req.body.niraId ?? '').trim();

  // Phone is locked — ignore any client phone change
  if (!name || name.length > 30) {
    return res.status(400).json({
      success: false,
      message: !name ? 'Full name is required.' : 'Name must be at most 30 characters.',
    });
  }

  if (!email || !isValidEmail(email) || email.endsWith('@otp.local')) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
  }

  const emailTaken = await User.findOne({ email, _id: { $ne: user._id } });
  if (emailTaken) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  if (!user.passwordSet) {
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }
    user.password = password;
    user.passwordSet = true;
  } else if (password) {
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }
    user.password = password;
    user.passwordSet = true;
  }

  if (!district) {
    return res.status(400).json({
      success: false,
      message: 'Please select a district.',
    });
  }

  if (niraId) {
    if (niraId.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'NIRA ID must be exactly 11 characters.',
      });
    }
    const niraTaken = await User.findOne({ niraId, _id: { $ne: user._id } });
    if (niraTaken) {
      return res.status(409).json({
        success: false,
        message: 'An account with this NIRA ID already exists.',
      });
    }
    user.niraId = niraId;
  }

  user.name = name;
  user.email = email;
  user.phoneVerified = true;

  const geoResult = await applyGeographicSelection(user, {
    region,
    district,
    village,
    area,
  });

  if (!geoResult.ok) {
    return res.status(400).json({
      success: false,
      message: geoResult.message || 'Unable to save district.',
    });
  }

  user.profileComplete = true;
  await user.save();

  return res.json({
    success: true,
    message: 'Profile completed successfully.',
    data: {
      user: citizenSafePayload(user),
    },
  });
});
