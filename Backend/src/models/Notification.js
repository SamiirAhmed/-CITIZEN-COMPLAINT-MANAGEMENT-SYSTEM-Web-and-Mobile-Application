import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: 'general',
    },
    relatedComplaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },
    relatedOB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OBRecord',
      default: null,
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    linkPath: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      trim: true,
      default: 'info',
    },
    alertAction: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: '',
    },
    actorRole: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
    accessSource: {
      type: String,
      trim: true,
      default: '',
    },
    failureReason: {
      type: String,
      trim: true,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.methods.toClientObject = function toClientObject() {
  const relatedComplaint = this.relatedComplaint
    ? this.relatedComplaint.toString()
    : null;
  const relatedOB = this.relatedOB ? this.relatedOB.toString() : null;
  const relatedUser = this.relatedUser ? this.relatedUser.toString() : null;

  let resolvedPath = this.linkPath || '';
  const type = String(this.type || '');
  if (!resolvedPath) {
    if (relatedUser && type.includes('citizen')) {
      resolvedPath = `/citizens/${relatedUser}`;
    } else if (relatedOB) {
      resolvedPath = `/ob-records?id=${relatedOB}`;
    } else if (relatedComplaint) {
      resolvedPath = `/complaints?id=${relatedComplaint}`;
    } else if (relatedUser) {
      resolvedPath = `/settings/users?id=${relatedUser}`;
    }
  }

  return {
    id: this._id.toString(),
    title: this.title,
    message: this.message,
    type: this.type,
    status: this.status || 'info',
    alertAction: this.alertAction || '',
    actorName: this.actorName || '',
    actorRole: this.actorRole || '',
    email: this.email || '',
    ipAddress: this.ipAddress || '',
    accessSource: this.accessSource || '',
    failureReason: this.failureReason || '',
    relatedComplaint,
    relatedOB,
    relatedUser,
    linkPath: resolvedPath,
    isRead: this.isRead,
    readAt: this.readAt,
    createdAt: this.createdAt,
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
