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
  if (!resolvedPath) {
    if (relatedUser && String(this.type || '').includes('citizen')) {
      resolvedPath = `/citizens/${relatedUser}`;
    } else if (relatedUser) {
      resolvedPath = '/settings/users';
    } else if (relatedOB) {
      resolvedPath = '/ob-records';
    } else if (relatedComplaint) {
      resolvedPath = '/complaints';
    }
  }

  return {
    id: this._id.toString(),
    title: this.title,
    message: this.message,
    type: this.type,
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
