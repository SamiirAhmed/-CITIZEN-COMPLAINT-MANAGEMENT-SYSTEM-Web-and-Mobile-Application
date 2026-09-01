import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import OBRecord from '../models/OBRecord.js';
import Category from '../models/Category.js';
import GeographicLocation from '../models/GeographicLocation.js';
import SmsLog from '../models/SmsLog.js';
import Notification from '../models/Notification.js';
import { hiddenNotificationClause } from '../utils/authAudit.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-3.6-flash';
const MODEL_FALLBACKS = ['gemini-3.6-flash', 'gemini-1.5-flash'];

const PLACEHOLDER_KEY = /^YOUR_|^PASTE_|^REPLACE_/i;

export function getGeminiApiKey() {
  const googleKey = String(process.env.GOOGLE_API_KEY || '').trim();
  const geminiKey = String(process.env.GEMINI_API_KEY || '').trim();
  return googleKey || geminiKey;
}

export function isGeminiConfigured() {
  const key = getGeminiApiKey();
  return Boolean(key) && !PLACEHOLDER_KEY.test(key);
}

function getGeminiConfig() {
  const apiKey = getGeminiApiKey();
  const model =
    String(process.env.GEMINI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;

  if (!apiKey || PLACEHOLDER_KEY.test(apiKey)) {
    const error = new Error(
      'Gemini API key is missing. Add GEMINI_API_KEY in Backend/.env, then restart the backend.'
    );
    error.code = 'GEMINI_NOT_CONFIGURED';
    throw error;
  }

  return { apiKey, model };
}

function resolveModelCandidates(preferredModel) {
  return [...new Set([preferredModel, ...MODEL_FALLBACKS].filter(Boolean))];
}

async function countBy(model, match = {}) {
  return model.countDocuments(match);
}

async function groupCounts(model, field, match = {}) {
  const rows = await model.aggregate([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return rows.map((row) => ({
    value: row._id || 'Unknown',
    count: row.count,
  }));
}

/**
 * Build a compact, admin-safe snapshot of the portal database
 * for Gemini grounding (no passwords or secrets).
 */
export async function buildPortalContext() {
  const [
    citizensTotal,
    citizensActive,
    policeTotal,
    policeActive,
    adminTotal,
    complaintsTotal,
    complaintsActive,
    complaintsByStatus,
    complaintsByCategory,
    complaintsByDistrict,
    obsTotal,
    obsActive,
    obsByStatus,
    categories,
    banaadirDistricts,
    recentComplaints,
    recentOBs,
    smsTotal,
    smsFailed,
    smsSent,
  ] = await Promise.all([
    countBy(User, { role: 'citizen' }),
    countBy(User, { role: 'citizen', isActive: true }),
    countBy(User, { role: 'police' }),
    countBy(User, { role: 'police', isActive: true }),
    countBy(User, { role: 'admin' }),
    countBy(Complaint, {}),
    countBy(Complaint, { isActive: { $ne: false } }),
    groupCounts(Complaint, 'status'),
    groupCounts(Complaint, 'category'),
    groupCounts(Complaint, 'district', { district: { $ne: '' } }),
    countBy(OBRecord, {}),
    countBy(OBRecord, { isActive: { $ne: false } }),
    groupCounts(OBRecord, 'status'),
    Category.find({ isActive: true }).sort({ name: 1 }).select('name').lean(),
    GeographicLocation.distinct('district', { region: 'Banaadir', isActive: true }),
    Complaint.find({ isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('complaintNumber category status district location createdAt')
      .lean(),
    OBRecord.find({ isActive: { $ne: false } })
      .sort({ updatedAt: -1 })
      .limit(8)
      .select('obNumber status assignedAt updatedAt')
      .populate('assignedOfficer', 'name')
      .lean(),
    countBy(SmsLog, {}),
    countBy(SmsLog, { status: 'failed' }),
    countBy(SmsLog, { status: { $in: ['success', 'partial'] } }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    portal: 'SPO — Somali Police OBE / Citizen Police Portal',
    database: 'Citizen_Police_Portal',
    users: {
      citizensTotal,
      citizensActive,
      policeTotal,
      policeActive,
      adminTotal,
    },
    complaints: {
      total: complaintsTotal,
      active: complaintsActive,
      byStatus: complaintsByStatus,
      byCategory: complaintsByCategory,
      byDistrict: complaintsByDistrict.slice(0, 20),
      recent: recentComplaints.map((item) => ({
        number: item.complaintNumber,
        category: item.category,
        status: item.status,
        district: item.district || '',
        location: item.location || '',
        createdAt: item.createdAt,
      })),
    },
    occurrenceBooks: {
      total: obsTotal,
      active: obsActive,
      byStatus: obsByStatus,
      recent: recentOBs.map((item) => ({
        number: item.obNumber,
        status: item.status,
        officer: item.assignedOfficer?.name || 'Unassigned',
        updatedAt: item.updatedAt,
      })),
    },
    categories: categories.map((item) => item.name),
    banaadirDistricts: [...banaadirDistricts].sort((a, b) => a.localeCompare(b)),
    sms: {
      total: smsTotal,
      sentLike: smsSent,
      failed: smsFailed,
    },
    modules: [
      'Dashboard',
      'Citizens',
      'Complaints',
      'OB Records',
      'Reports',
      'Audit Logs',
      'SMS Portal',
      'Chatbot',
      'Settings (Users, Permissions, Categories, Districts)',
      'Profile',
    ],
  };
}

/**
 * Police-only snapshot: assigned OB records, linked complaints/citizens,
 * and this officer's notifications. No admin or system-wide data.
 */
export async function buildPoliceContext(officerId, officer = {}) {
  const assignedFilter = {
    assignedOfficer: officerId,
    isActive: { $ne: false },
  };

  const [
    assignedTotal,
    obsByStatus,
    assignedRecords,
    unreadNotifications,
    recentNotifications,
  ] = await Promise.all([
    countBy(OBRecord, assignedFilter),
    groupCounts(OBRecord, 'status', assignedFilter),
    OBRecord.find(assignedFilter)
      .sort({ updatedAt: -1 })
      .limit(12)
      .populate('complaint', 'complaintNumber category status location district village area incidentDate description')
      .populate('citizen', 'name phone')
      .select(
        'obNumber status investigationProgress assignedAt updatedAt createdAt citizenSummary investigationStartedAt investigationCompletedAt'
      )
      .lean(),
    Notification.countDocuments({
      user: officerId,
      isRead: false,
      ...hiddenNotificationClause(),
    }),
    Notification.find({
      user: officerId,
      ...hiddenNotificationClause(),
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title message type isRead createdAt')
      .lean(),
  ]);

  const investigating = obsByStatus.find((row) => row.value === 'Under Investigation')?.count || 0;
  const completedStatuses = ['Investigation Completed', 'Resolved', 'Closed'];
  const completed = obsByStatus
    .filter((row) => completedStatuses.includes(row.value))
    .reduce((sum, row) => sum + row.count, 0);

  const categoryCounts = {};
  for (const record of assignedRecords) {
    const category = record.complaint?.category || 'Other';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    portal: 'SPO — Somali Police OBE (Police Portal)',
    role: 'police',
    officer: {
      name: officer.name || '',
      badgeNumber: officer.badgeNumber || '',
      station: officer.station || '',
    },
    assignedCases: {
      total: assignedTotal,
      underInvestigation: investigating,
      completed,
      byStatus: obsByStatus,
      byCategory: Object.entries(categoryCounts).map(([value, count]) => ({ value, count })),
      records: assignedRecords.map((item) => ({
        obNumber: item.obNumber,
        status: item.status,
        progress: Number(item.investigationProgress || 0),
        assignedAt: item.assignedAt,
        updatedAt: item.updatedAt,
        citizenSummary: item.citizenSummary || '',
        citizen: item.citizen?.name || '',
        citizenPhone: item.citizen?.phone || '',
        complaint: item.complaint
          ? {
              number: item.complaint.complaintNumber,
              category: item.complaint.category,
              status: item.complaint.status,
              location: item.complaint.location || '',
              district: item.complaint.district || '',
              village: item.complaint.village || '',
              area: item.complaint.area || '',
              incidentDate: item.complaint.incidentDate,
              description: item.complaint.description || '',
            }
          : null,
      })),
    },
    notifications: {
      unread: unreadNotifications,
      recent: recentNotifications.map((item) => ({
        title: item.title,
        message: item.message,
        type: item.type,
        isRead: item.isRead,
        createdAt: item.createdAt,
      })),
    },
    allowedTopics: [
      'My assigned OB records',
      'Investigation status and progress on my cases',
      'Linked complaint details for my assignments',
      'My notifications',
      'How to use Police Dashboard, My OB Records, and Investigation pages',
    ],
    restrictedTopics: [
      'Other officers cases',
      'All citizens or complaints in the system',
      'Admin dashboard statistics',
      'SMS portal, audit logs, settings, user management',
      'System-wide reports',
    ],
  };
}

function buildSystemPrompt(context) {
  return [
    'You are the SPO Admin Assistant for the Somali Police OBE (Citizen Complaint Management) portal.',
    'Answer clearly in the same language the admin uses (Somali or English).',
    'Use ONLY the live database context below plus general knowledge of this portal.',
    'If the context does not contain enough detail, say what is missing instead of inventing numbers.',
    'Never reveal passwords, API keys, JWT secrets, or raw credentials.',
    'Keep answers concise and practical for an admin.',
    '',
    'LIVE DATABASE CONTEXT (JSON):',
    JSON.stringify(context, null, 2),
  ].join('\n');
}

function buildPoliceSystemPrompt(context, officer = {}) {
  const officerName = officer.name || context?.officer?.name || 'Officer';
  return [
    `You are the SPO Police Assistant for ${officerName}.`,
    'Answer clearly in the same language the officer uses (Somali or English).',
    'Use ONLY the live police context below for this officer.',
    'You may ONLY discuss: assigned OB records, linked complaint details, investigation progress, and this officer notifications.',
    'If asked about admin data, other officers cases, all citizens, SMS, audit logs, settings, or system-wide statistics, refuse politely and explain you only help with this officer assigned work.',
    'Never reveal passwords, API keys, JWT secrets, or raw credentials.',
    'If the context lacks detail, say what is missing instead of inventing numbers.',
    'Keep answers concise and practical for a police officer.',
    '',
    'LIVE POLICE CONTEXT (JSON):',
    JSON.stringify(context, null, 2),
  ].join('\n');
}

export async function askGemini({ message, history = [], scope = 'admin', user = null }) {
  const { apiKey, model } = getGeminiConfig();
  const context =
    scope === 'police'
      ? await buildPoliceContext(user._id, user)
      : await buildPortalContext();
  const systemPrompt =
    scope === 'police'
      ? buildPoliceSystemPrompt(context, user)
      : buildSystemPrompt(context);

  const contents = [];
  const prior = Array.isArray(history) ? history.slice(-8) : [];
  for (const turn of prior) {
    const role = turn.role === 'assistant' ? 'model' : 'user';
    const text = String(turn.content || '').trim();
    if (!text) continue;
    contents.push({ role, parts: [{ text }] });
  }
  contents.push({ role: 'user', parts: [{ text: String(message).trim() }] });

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  const modelCandidates = resolveModelCandidates(model);
  let lastError = null;

  for (const candidateModel of modelCandidates) {
    const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(candidateModel)}:generateContent`;

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: requestBody,
      });
    } catch {
      const error = new Error('Unable to reach Gemini API. Check your internet connection.');
      error.code = 'GEMINI_UNAVAILABLE';
      throw error;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerMessage =
        payload?.error?.message ||
        payload?.message ||
        `Gemini request failed (${response.status}).`;
      const error = new Error(providerMessage);
      error.code =
        response.status === 400 || response.status === 403 || response.status === 401
          ? 'GEMINI_AUTH_FAILED'
          : 'GEMINI_REQUEST_FAILED';

      const modelMissing =
        response.status === 404 ||
        /not found|is not supported|does not exist/i.test(providerMessage);

      if (modelMissing && candidateModel !== modelCandidates.at(-1)) {
        lastError = error;
        continue;
      }

      throw error;
    }

    const text =
      payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim() || '';

    if (!text) {
      const error = new Error('Gemini returned an empty response. Try asking again.');
      error.code = 'GEMINI_EMPTY';
      throw error;
    }

    return {
      reply: text,
      model: candidateModel,
      contextGeneratedAt: context.generatedAt,
    };
  }

  throw (
    lastError ||
    new Error('Gemini request failed. Check GEMINI_API_KEY and GEMINI_MODEL in Backend/.env.')
  );
}
