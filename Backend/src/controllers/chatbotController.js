import { asyncHandler } from '../utils/helpers.js';
import {
  askGemini,
  isGeminiConfigured,
} from '../services/geminiChatService.js';

export const getChatbotStatus = asyncHandler(async (_req, res) => {
  return res.json({
    success: true,
    data: {
      configured: isGeminiConfigured(),
      model: String(process.env.GEMINI_MODEL || 'gemini-3.6-flash').trim() || 'gemini-3.6-flash',
      message: isGeminiConfigured()
        ? 'Gemini chatbot is ready.'
        : 'Add GEMINI_API_KEY in Backend/.env, then restart the backend.',
    },
  });
});

export const chatWithAssistant = asyncHandler(async (req, res) => {
  const message = String(req.body?.message ?? '').trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required.',
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Message must be 2000 characters or fewer.',
    });
  }

  try {
    const result = await askGemini({ message, history, scope: 'admin' });
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const code = error.code || 'GEMINI_REQUEST_FAILED';
    const status =
      code === 'GEMINI_NOT_CONFIGURED' || code === 'GEMINI_AUTH_FAILED' ? 503 : 502;
    return res.status(status).json({
      success: false,
      message: error.message || 'Chatbot request failed.',
      code,
    });
  }
});

export const policeChatWithAssistant = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'police') {
    return res.status(403).json({
      success: false,
      message: 'Police chatbot is only available to police officers.',
    });
  }

  const message = String(req.body?.message ?? '').trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required.',
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Message must be 2000 characters or fewer.',
    });
  }

  try {
    const result = await askGemini({
      message,
      history,
      scope: 'police',
      user: req.user,
    });
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const code = error.code || 'GEMINI_REQUEST_FAILED';
    const status =
      code === 'GEMINI_NOT_CONFIGURED' || code === 'GEMINI_AUTH_FAILED' ? 503 : 502;
    return res.status(status).json({
      success: false,
      message: error.message || 'Chatbot request failed.',
      code,
    });
  }
});
