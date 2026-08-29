import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    tell: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['citizen', 'admin', 'police'],
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
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
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
          'settings',
          'profile',
        ]
      : Array.isArray(this.menuPermissions)
        ? this.menuPermissions
        : [];

  return {
    id: this._id.toString(),
    name: this.name,
    niraId: this.niraId || '',
    phone: this.phone || '',
    tell: this.tell || '',
    email: this.email,
    role: this.role,
    badgeNumber: this.badgeNumber || '',
    station: this.station || '',
    isActive: this.isActive !== false,
    profileImage: this.profileImage || '',
    menuPermissions: permissions,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
