import mongoose from 'mongoose';

export const OB_STATUSES = [
  'Opened',
  'Assigned',
  'Under Investigation',
  'Investigation Completed',
  'Resolved',
  'Closed',
  'Reopened',
];

const updateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    note: { type: String, default: '' },
    visibleToCitizen: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const obRecordSchema = new mongoose.Schema(
  {
    obNumber: {
      type: String,
      unique: true,
      required: true,
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      unique: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: OB_STATUSES,
      default: 'Opened',
      index: true,
    },
    investigationNotes: {
      type: String,
      default: '',
      select: false,
    },
    citizenSummary: {
      type: String,
      default: '',
    },
    closureReason: {
      type: String,
      default: '',
    },
    closedAt: {
      type: Date,
      default: null,
    },
    updates: {
      type: [updateSchema],
      default: [],
    },
  },
  { timestamps: true }
);

obRecordSchema.methods.toCitizenObject = function toCitizenObject(complaint) {
  const complaintInfo = complaint
    ? {
        id: complaint._id?.toString?.() || complaint.id || String(complaint._id || ''),
        complaintNumber: complaint.complaintNumber,
        category: complaint.category,
        status: complaint.status,
        description: complaint.description,
        location: complaint.location,
        incidentDate: complaint.incidentDate,
      }
    : null;

  const assigned = this.assignedOfficer
    ? {
        id: this.assignedOfficer._id?.toString?.() || this.assignedOfficer.id,
        name: this.assignedOfficer.name,
        badgeNumber: this.assignedOfficer.badgeNumber || '',
        station: this.assignedOfficer.station || '',
      }
    : null;

  return {
    id: this._id.toString(),
    obNumber: this.obNumber,
    status: this.status,
    citizenSummary: this.citizenSummary || '',
    closureReason: this.closureReason || '',
    closedAt: this.closedAt,
    assignedAt: this.assignedAt,
    assignedOfficer: assigned,
    complaint: complaintInfo,
    updates: (this.updates || [])
      .filter((item) => item.visibleToCitizen)
      .map((item) => ({
        title: item.title,
        note: item.note || '',
        createdAt: item.createdAt,
      })),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const OBRecord = mongoose.model('OBRecord', obRecordSchema);

export default OBRecord;
