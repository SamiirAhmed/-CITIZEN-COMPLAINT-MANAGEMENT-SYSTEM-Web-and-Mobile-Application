import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLE_VALUES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [30, 'Name must be at most 30 characters'],
    },
    niraId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    phoneNormalized: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    passwordSet: {
      type: Boolean,
      default: false,
    },
    tell: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    username: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      required: true,
      default: 'citizen',
    },
    badgeNumber: {
      type: String,
      trim: true,
      default: '',
    },
    station: {
      type: String,
      trim: true,
      default: '',
    },
    geographicLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GeographicLocation',
      default: null,
    },
    region: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    village: {
      type: String,
      trim: true,
      default: '',
    },
    area: {
      type: String,
      trim: true,
      default: '',
    },
    passwordChangeRequired: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /** Relative public path e.g. /uploads/profiles/profile-….jpg — empty for legacy records */
    profileImage: {
      type: String,
      trim: true,
      default: '',
    },
    menuPermissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const permissions =
    this.role === 'admin'
      ? [
          'dashboard',
          'citizens',
          'complaints',
          'ob-records',
          'reports',
          'audit-logs',
          'sms-portal',
          'settings',
          'profile',
        ]
      : Array.isArray(this.menuPermissions)
        ? this.menuPermissions
        : [];

  const email =
    this.email && !String(this.email).endsWith('@otp.local')
      ? this.email
      : '';

  const profileComplete =
    this.profileComplete === true ||
    (Boolean(this.name) &&
      this.name.trim().toLowerCase() !== 'citizen' &&
      Boolean(email) &&
      this.passwordSet === true &&
      Boolean(this.district));

  return {
    id: this._id.toString(),
    name: this.name,
    niraId: this.niraId || '',
    phone: this.phone || '',
    phoneNormalized: this.phoneNormalized || '',
    phoneVerified: this.phoneVerified === true,
    profileComplete,
    hasPassword: this.passwordSet === true,
    needsProfileCompletion: !profileComplete,
    tell: this.tell || '',
    address: this.address || '',
    username: this.username || '',
    avatar: this.avatar || '',
    email,
    role: this.role,
    badgeNumber: this.badgeNumber || '',
    station: this.station || '',
    region: this.region || '',
    district: this.district || '',
    village: this.village || '',
    area: this.area || '',
    geographicLocationId: this.geographicLocationId
      ? this.geographicLocationId.toString()
      : '',
    passwordChangeRequired: this.passwordChangeRequired === true,
    isActive: this.isActive !== false,
    profileImage: this.profileImage || '',
    menuPermissions: permissions,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
