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

const evidenceSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: '' },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    url: { type: String, default: '' },
    note: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
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
      trim: true,
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
    evidence: {
      type: [evidenceSchema],
      default: [],
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
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

const mapEvidence = (items = []) =>
  (items || []).map((item) => ({
    id: item._id?.toString?.() || undefined,
    fileName: item.fileName || '',
    originalName: item.originalName || '',
    mimeType: item.mimeType || '',
    url: item.url || '',
    note: item.note || '',
    createdAt: item.createdAt,
  }));

complaintSchema.methods.toCitizenObject = function toCitizenObject() {
  return {
    id: this._id.toString(),
    complaintNumber: this.complaintNumber,
    category: this.category,
    description: this.description,
    incidentDate: this.incidentDate,
    location: this.location,
    region: this.region || '',
    district: this.district || '',
    village: this.village || '',
    area: this.area || '',
    relatedInformation: this.relatedInformation,
    evidenceNotes: this.evidenceNotes,
    evidence: mapEvidence(this.evidence),
    status: this.status,
    isActive: this.isActive !== false,
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
