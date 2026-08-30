const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parseDateBoundary(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
}

export function resolveDateRange(query = {}) {
  const { range, dateFrom, dateTo } = query;
  const now = new Date();
  let from = null;
  let to = null;

  if (range === 'today') {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
  } else if (range === 'this_week') {
    from = new Date(now);
    const day = from.getDay();
    const diff = day === 0 ? 6 : day - 1;
    from.setDate(from.getDate() - diff);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
  } else if (range === 'this_month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (range === 'last_month') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    from = parseDateBoundary(dateFrom, false);
    to = parseDateBoundary(dateTo, true);
  }

  return { from, to };
}

export async function buildReportsFilter(req, { Complaint, User }) {
  const {
    status = '',
    category = '',
    station = '',
    dateFrom = '',
    dateTo = '',
    range = '',
    search = '',
  } = req.query;

  const filter = {};

  if (req.user?.role === 'police') {
    filter.assignedOfficer = req.user._id;
  }

  if (status) filter.status = status;

  const { from, to } = resolveDateRange({ range, dateFrom, dateTo });
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  if (category) {
    const complaints = await Complaint.find({ category }).select('_id');
    filter.complaint = { $in: complaints.map((item) => item._id) };
  }

  if (station) {
    const officers = await User.find({
      role: { $in: ['police', 'admin'] },
      station: new RegExp(`^${escapeRegex(station)}$`, 'i'),
    }).select('_id');
    filter.assignedOfficer = { $in: officers.map((item) => item._id) };
  }

  if (String(search).trim()) {
    const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
    const matchingCitizens = await User.find({
      role: 'citizen',
      $or: [{ name: regex }, { email: regex }, { phone: regex }, { niraId: regex }],
    }).select('_id');
    const matchingComplaints = await Complaint.find({
      $or: [{ complaintNumber: regex }, { category: regex }, { location: regex }],
    }).select('_id');

    const searchClause = {
      $or: [
        { obNumber: regex },
        { citizenSummary: regex },
        { citizen: { $in: matchingCitizens.map((item) => item._id) } },
        { complaint: { $in: matchingComplaints.map((item) => item._id) } },
      ],
    };

    if (Object.keys(filter).length) {
      return { $and: [filter, searchClause] };
    }
    return searchClause;
  }

  return filter;
}

export function toReportRecord(record) {
  const complaint =
    record.complaint && typeof record.complaint === 'object' ? record.complaint : null;
  const citizen = record.citizen && typeof record.citizen === 'object' ? record.citizen : null;
  const officer =
    record.assignedOfficer && typeof record.assignedOfficer === 'object'
      ? record.assignedOfficer
      : null;

  return {
    id: record._id.toString(),
    obNumber: record.obNumber,
    occurrenceDate: complaint?.incidentDate || record.createdAt,
    occurrenceTime: '',
    complainantName: citizen?.name || '',
    citizen: citizen
      ? {
          id: citizen._id?.toString?.() || String(citizen),
          name: citizen.name || '',
        }
      : null,
    category: complaint?.category || 'Other',
    occurrenceType: complaint?.category || '',
    location: complaint?.location || '',
    station: officer?.station || '',
    assignedOfficer: officer
      ? {
          id: officer._id?.toString?.() || String(officer),
          name: officer.name || '',
          station: officer.station || '',
        }
      : null,
    status: record.status,
    createdAt: record.createdAt,
  };
}

export { escapeRegex };
