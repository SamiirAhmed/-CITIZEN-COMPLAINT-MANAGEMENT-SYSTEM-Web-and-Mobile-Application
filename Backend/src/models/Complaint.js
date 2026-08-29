import mongoose from 'mongoose';

export const COMPLAINT_STATUSES = [
  'Submitted',
  'Under Review',
  'Verified',
  'OB Created',
  'Under Investigation',
  'Investigation Completed',
  'Resolved',
  'Closed',
  'Rejected',
  'Reopened',
];

export const COMPLAINT_CATEGORIES = [
  'Theft',
  'Assault',
  'Fraud',
  'Traffic Accident',
  'Domestic Dispute',
  'Property Damage',
  'Missing Person',
  'Cybercrime',
  'Noise Complaint',
  'Other',
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintNumber: {
      type: String,
      unique: true,
      required: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: COMPLAINT_CATEGORIES,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    incidentDate: {
      type: Date,
      required: [true, 'Incident date is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    relatedInformation: {
      type: String,
      trim: true,
      default: '',
    },
    evidenceNotes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: 'Submitted',
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

complaintSchema.methods.toCitizenObject = function toCitizenObject() {
  return {
    id: this._id.toString(),
    complaintNumber: this.complaintNumber,
    category: this.category,
    description: this.description,
    incidentDate: this.incidentDate,
    location: this.location,
    relatedInformation: this.relatedInformation,
    evidenceNotes: this.evidenceNotes,
    status: this.status,
    statusHistory: (this.statusHistory || []).map((item) => ({
      status: item.status,
      note: item.note || '',
      changedAt: item.changedAt,
    })),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
