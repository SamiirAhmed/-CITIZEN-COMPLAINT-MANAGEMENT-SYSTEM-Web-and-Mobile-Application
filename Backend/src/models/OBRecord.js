import mongoose from 'mongoose';

export const OB_STATUSES = [
  'Opened',
  'Pending',
  'Assigned',
  'Under Investigation',
  'Investigation Completed',
  'Resolved',
  'Closed',
  'Reopened',
];

export const OB_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const OB_CATEGORIES = [
  'Theft',
  'Assault',
  'Accident',
  'Missing Person',
  'Domestic Incident',
  'Property Damage',
  'Fraud',
  'Lost Property',
  'Disturbance',
  'Suspicious Activity',
  'Traffic Incident',
  'Other',
];

/** Map legacy complaint categories onto OB categories when creating from a complaint. */
export const COMPLAINT_CATEGORY_TO_OB = {
  Theft: 'Theft',
  Assault: 'Assault',
  Fraud: 'Fraud',
  'Traffic Accident': 'Traffic Incident',
  'Domestic Dispute': 'Domestic Incident',
  'Property Damage': 'Property Damage',
  'Missing Person': 'Missing Person',
  Cybercrime: 'Other',
  'Noise Complaint': 'Disturbance',
  Other: 'Other',
};

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

<<<<<<< HEAD
const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    previousValue: { type: String, default: '' },
    newValue: { type: String, default: '' },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
=======
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
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
);

const obRecordSchema = new mongoose.Schema(
  {
    obNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    // Optional link to citizen complaint (partial unique — missing/null allowed many times)
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    occurrenceDate: {
      type: Date,
      default: null,
    },
    occurrenceTime: {
      type: String,
      default: '',
      trim: true,
    },
    dateReported: {
      type: Date,
      default: Date.now,
    },
    timeReported: {
      type: String,
      default: '',
      trim: true,
    },
    station: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    complainantName: {
      type: String,
      default: '',
      trim: true,
    },
    complainantPhone: {
      type: String,
      default: '',
      trim: true,
    },
    complainantAddress: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: OB_CATEGORIES,
      default: 'Other',
      index: true,
    },
    occurrenceType: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    district: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: OB_PRIORITIES,
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: OB_STATUSES,
      default: 'Opened',
      index: true,
    },
    actionTaken: {
      type: String,
      default: '',
      trim: true,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    followUpNotes: {
      type: String,
      default: '',
      trim: true,
    },
    outcome: {
      type: String,
      default: '',
      trim: true,
    },
    additionalNotes: {
      type: String,
      default: '',
      trim: true,
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
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updates: {
      type: [updateSchema],
      default: [],
    },
    activityHistory: {
      type: [activitySchema],
      default: [],
    },
  },
  { timestamps: true }
);

obRecordSchema.index({ subject: 'text', complainantName: 'text', location: 'text', obNumber: 'text' });
obRecordSchema.index(
  { complaint: 1 },
  {
    unique: true,
    partialFilterExpression: { complaint: { $type: 'objectId' } },
    name: 'complaint_unique_when_set',
  }
);

function serializeUser(user) {
  if (!user) return null;
  return {
    id: user._id?.toString?.() || user.id || String(user),
    name: user.name || '',
    badgeNumber: user.badgeNumber || '',
    station: user.station || '',
    role: user.role || '',
  };
}

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

  return {
    id: this._id.toString(),
    obNumber: this.obNumber,
    status: this.status,
    category: this.category || complaintInfo?.category || '',
    subject: this.subject || '',
    location: this.location || complaintInfo?.location || '',
    citizenSummary: this.citizenSummary || '',
    closureReason: this.closureReason || '',
    closedAt: this.closedAt,
    assignedAt: this.assignedAt,
    assignedOfficer: serializeUser(this.assignedOfficer),
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

<<<<<<< HEAD
obRecordSchema.methods.toStaffObject = function toStaffObject() {
  return {
    id: this._id.toString(),
    obNumber: this.obNumber,
    complaint: this.complaint
      ? {
          id: this.complaint._id?.toString?.() || this.complaint.id || String(this.complaint),
          complaintNumber: this.complaint.complaintNumber || '',
          category: this.complaint.category || '',
          status: this.complaint.status || '',
        }
      : null,
    citizen: this.citizen
      ? {
          id: this.citizen._id?.toString?.() || this.citizen.id || String(this.citizen),
          name: this.citizen.name || '',
          email: this.citizen.email || '',
          phone: this.citizen.phone || '',
          niraId: this.citizen.niraId || '',
        }
      : null,
    occurrenceDate: this.occurrenceDate,
    occurrenceTime: this.occurrenceTime || '',
    dateReported: this.dateReported,
    timeReported: this.timeReported || '',
    station: this.station || '',
    complainantName: this.complainantName || '',
    complainantPhone: this.complainantPhone || '',
    complainantAddress: this.complainantAddress || '',
    category: this.category || '',
    occurrenceType: this.occurrenceType || '',
    subject: this.subject || '',
    description: this.description || '',
    location: this.location || '',
    district: this.district || '',
    recordedBy: serializeUser(this.recordedBy),
    createdBy: serializeUser(this.createdBy),
    updatedBy: serializeUser(this.updatedBy),
    assignedOfficer: serializeUser(this.assignedOfficer),
    assignedAt: this.assignedAt,
    priority: this.priority || 'MEDIUM',
    status: this.status,
    actionTaken: this.actionTaken || '',
    followUpDate: this.followUpDate,
    followUpNotes: this.followUpNotes || '',
    outcome: this.outcome || '',
    additionalNotes: this.additionalNotes || '',
    citizenSummary: this.citizenSummary || '',
    closureReason: this.closureReason || '',
    closedAt: this.closedAt,
    closedBy: serializeUser(this.closedBy),
    updates: (this.updates || []).map((item) => ({
      title: item.title,
      note: item.note || '',
      visibleToCitizen: Boolean(item.visibleToCitizen),
      createdAt: item.createdAt,
      createdBy: item.createdBy?.toString?.() || item.createdBy || null,
    })),
    activityHistory: (this.activityHistory || []).map((item) => ({
      action: item.action,
      user: serializeUser(item.user),
      previousValue: item.previousValue || '',
      newValue: item.newValue || '',
      note: item.note || '',
=======
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
>>>>>>> 834c738e84d4ed71400294b8465c96e8bc0c6706
      createdAt: item.createdAt,
    })),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const OBRecord = mongoose.model('OBRecord', obRecordSchema);

export default OBRecord;
