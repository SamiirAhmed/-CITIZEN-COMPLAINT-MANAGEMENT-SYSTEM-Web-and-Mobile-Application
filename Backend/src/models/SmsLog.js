import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: { type: String, trim: true, default: '' },
    phoneMasked: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['sent', 'failed', 'skipped'],
      default: 'failed',
    },
    error: { type: String, trim: true, default: '' },
    providerRef: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const smsLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorName: { type: String, trim: true, default: '' },
    actorRole: { type: String, trim: true, default: 'admin' },
    msgNo: { type: Number, default: 0, index: true },
    title: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true },
    messagePreview: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      default: 'failed',
      index: true,
    },
    recipientCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    recipientType: {
      type: String,
      enum: ['police', 'citizen'],
      default: 'police',
      index: true,
    },
    recipients: { type: [recipientSchema], default: [] },
    ipAddress: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

smsLogSchema.methods.toClientObject = function toClientObject() {
  return {
    id: this._id.toString(),
    actorId: this.actor ? this.actor.toString() : '',
    actorName: this.actorName || '',
    actorRole: this.actorRole || '',
    msgNo: this.msgNo || 0,
    title: this.title || '',
    message: this.message || '',
    messagePreview: this.messagePreview || this.message || '',
    status: this.status,
    recipientCount: this.recipientCount || 0,
    successCount: this.successCount || 0,
    failedCount: this.failedCount || 0,
    skippedCount: this.skippedCount || 0,
    recipientType: this.recipientType || 'police',
    recipients: (this.recipients || []).map((item) => ({
      userId: item.user ? item.user.toString() : '',
      name: item.name || '',
      phoneMasked: item.phoneMasked || '',
      status: item.status,
      error: item.error || '',
    })),
    createdAt: this.createdAt,
  };
};

const SmsLog = mongoose.model('SmsLog', smsLogSchema);

export default SmsLog;
