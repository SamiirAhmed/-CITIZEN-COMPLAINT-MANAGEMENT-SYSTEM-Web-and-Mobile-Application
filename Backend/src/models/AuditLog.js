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
    },
    action: {
      type: String,
      required: true,
      trim: true,
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
    },
  },
  { timestamps: true }
);

auditLogSchema.methods.toClientObject = function toClientObject() {
  return {
    id: this._id.toString(),
    actorName: this.actorName || 'System',
    actorRole: this.actorRole || '',
    action: this.action,
    recordType: this.recordType || '',
    recordId: this.recordId || '',
    recordLabel: this.recordLabel || '',
    previousValue: this.previousValue || '',
    newValue: this.newValue || '',
    details: this.details || '',
    ipAddress: this.ipAddress || '',
    createdAt: this.createdAt,
  };
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
