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
  return {
    id: this._id.toString(),
    title: this.title,
    message: this.message,
    type: this.type,
    relatedComplaint: this.relatedComplaint ? this.relatedComplaint.toString() : null,
    relatedOB: this.relatedOB ? this.relatedOB.toString() : null,
    isRead: this.isRead,
    readAt: this.readAt,
    createdAt: this.createdAt,
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
