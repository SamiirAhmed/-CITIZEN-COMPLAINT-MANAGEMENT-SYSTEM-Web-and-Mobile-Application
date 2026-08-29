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

const investigationNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
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
    investigationNoteEntries: {
      type: [investigationNoteSchema],
      default: [],
    },
    investigationProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    investigationStartedAt: {
      type: Date,
      default: null,
    },
    investigationCompletedAt: {
      type: Date,
      default: null,
    },
    evidence: {
      type: [evidenceSchema],
      default: [],
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

function refId(doc) {
  if (!doc) return null;
  if (typeof doc === 'object') {
    return doc._id?.toString?.() || doc.id || doc.toString?.() || null;
  }
  return String(doc);
}

obRecordSchema.methods.toStaffObject = function toStaffObject(
  complaintDoc,
  citizenDoc
) {
  const complaint = complaintDoc || this.complaint;
  const citizen = citizenDoc || this.citizen;

  const complaintInfo =
    complaint && typeof complaint === 'object' && complaint.complaintNumber
      ? {
          id: refId(complaint),
          complaintNumber: complaint.complaintNumber,
          category: complaint.category,
          status: complaint.status,
          description: complaint.description,
          location: complaint.location,
          incidentDate: complaint.incidentDate,
          relatedInformation: complaint.relatedInformation || '',
          evidenceNotes: complaint.evidenceNotes || '',
        }
      : complaint
        ? { id: refId(complaint) }
        : null;

  const citizenInfo =
    citizen && typeof citizen === 'object' && (citizen.name || citizen.email)
      ? {
          id: refId(citizen),
          name: citizen.name || '',
          email: citizen.email || '',
          phone: citizen.phone || '',
          niraId: citizen.niraId || '',
        }
      : citizen
        ? { id: refId(citizen) }
        : null;

  const assigned = this.assignedOfficer
    ? {
        id: refId(this.assignedOfficer),
        name: this.assignedOfficer.name || '',
        badgeNumber: this.assignedOfficer.badgeNumber || '',
        station: this.assignedOfficer.station || '',
      }
    : null;

  const noteEntries = (this.investigationNoteEntries || []).map((item) => ({
    id: item._id?.toString?.() || undefined,
    note: item.note || '',
    createdAt: item.createdAt,
  }));

  if (!noteEntries.length && this.investigationNotes) {
    String(this.investigationNotes)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((note) => {
        noteEntries.push({ note, createdAt: this.updatedAt || this.createdAt });
      });
  }

  return {
    id: this._id.toString(),
    obNumber: this.obNumber,
    status: this.status,
    investigationNotes: this.investigationNotes || '',
    investigationNoteEntries: noteEntries,
    investigationProgress: Number(this.investigationProgress || 0),
    investigationStartedAt: this.investigationStartedAt,
    investigationCompletedAt: this.investigationCompletedAt,
    citizenSummary: this.citizenSummary || '',
    closureReason: this.closureReason || '',
    closedAt: this.closedAt,
    assignedAt: this.assignedAt,
    assignedOfficer: assigned,
    citizen: citizenInfo,
    complaint: complaintInfo,
    evidence: (this.evidence || []).map((item) => ({
      id: item._id?.toString?.() || undefined,
      fileName: item.fileName || '',
      originalName: item.originalName || '',
      mimeType: item.mimeType || '',
      url: item.url || '',
      note: item.note || '',
      createdAt: item.createdAt,
    })),
    updates: (this.updates || []).map((item) => ({
      title: item.title,
      note: item.note || '',
      visibleToCitizen: item.visibleToCitizen !== false,
      createdAt: item.createdAt,
    })),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const OBRecord = mongoose.model('OBRecord', obRecordSchema);

export default OBRecord;
