import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: 'System',
    },
    actorRole: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    recordType: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    recordId: {
      type: String,
      trim: true,
      default: '',
    },
    recordLabel: {
      type: String,
      trim: true,
      default: '',
    },
    previousValue: {
      type: String,
      trim: true,
      default: '',
    },
    newValue: {
      type: String,
      trim: true,
      default: '',
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
    device: {
      type: String,
      trim: true,
      default: '',
    },
    browser: {
      type: String,
      trim: true,
      default: '',
    },
    operatingSystem: {
      type: String,
      trim: true,
      default: '',
    },
    accessSource: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

auditLogSchema.methods.toClientObject = function toClientObject() {
  const normalizedAction =
    this.action === 'LOGIN' ? 'LOGIN_SUCCESS' : this.action;

  return {
    id: this._id.toString(),
    actorId: this.actor ? this.actor.toString() : '',
    actorName: this.actorName || 'System',
    actorRole: this.actorRole || '',
    email: this.email || '',
    action: normalizedAction,
    status: this.status || this.inferStatus(),
    recordType: this.recordType || '',
    recordId: this.recordId || '',
    recordLabel: this.recordLabel || '',
    previousValue: this.previousValue || '',
    newValue: this.newValue || '',
    details: this.details || '',
    ipAddress: this.ipAddress || '',
    userAgent: this.userAgent || '',
    device: this.device || '',
    browser: this.browser || '',
    operatingSystem: this.operatingSystem || '',
    accessSource: this.accessSource || '',
    location: this.location || 'Not available',
    createdAt: this.createdAt,
  };
};

auditLogSchema.methods.inferStatus = function inferStatus() {
  if (this.action === 'LOGIN_FAILED') return 'failed';
  if (['LOGIN', 'LOGIN_SUCCESS', 'LOGOUT', 'PASSWORD_CHANGED'].includes(this.action)) {
    return 'success';
  }
  if (this.newValue === 'Failed') return 'failed';
  return this.newValue === 'Successful' ? 'success' : '';
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
