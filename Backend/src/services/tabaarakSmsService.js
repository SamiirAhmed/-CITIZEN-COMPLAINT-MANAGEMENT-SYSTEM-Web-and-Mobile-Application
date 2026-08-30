const LOGIN_URL = 'https://sms.tabaarak.com/Auth/SMSLogin';
const BALANCE_URL = 'https://sms.tabaarak.com/sms/GetSmsBalance';
const SEND_URL = 'https://sms.tabaarak.com/Sms/sendsms';

let cachedToken = null;
let tokenExpiresAt = 0;

function safeLog(event, extra = {}) {
  const payload = { event, ...extra };
  delete payload.token;
  delete payload.Token;
  delete payload.access_token;
  delete payload.password;
  delete payload.Password;
  delete payload.username;
  delete payload.Name;
  delete payload.Authorization;
  console.info('[Tabaarak]', payload);
}

export function isSmsConfigured() {
  return Boolean(
    String(process.env.TABAARAK_SMS_USERNAME || '').trim() &&
      String(process.env.TABAARAK_SMS_PASSWORD || '').trim()
  );
}

function getCredentials() {
  const username = String(process.env.TABAARAK_SMS_USERNAME || '').trim();
  const password = String(process.env.TABAARAK_SMS_PASSWORD || '').trim();
  const senderId = String(process.env.TABAARAK_SMS_SENDER_ID || 'Appeal').trim() || 'Appeal';

  if (!username || !password) {
    const error = new Error(
      'SMS service is not configured. Set TABAARAK_SMS_USERNAME and TABAARAK_SMS_PASSWORD in Backend/.env, then restart the backend.'
    );
    error.code = 'SMS_NOT_CONFIGURED';
    throw error;
  }

  return { username, password, senderId };
}

export function normalizeSomaliMobile(phone = '') {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00252')) digits = digits.slice(5);
  else if (digits.startsWith('252')) digits = digits.slice(3);
  digits = digits.replace(/^0+/, '');
  return digits;
}

export function isValidSomaliMobile(phone = '') {
  const normalized = normalizeSomaliMobile(phone);
  return /^[67]\d{7,8}$/.test(normalized);
}

export function resolveUserPhone(user) {
  const primary = user?.phone || '';
  const secondary = user?.tell || '';
  if (isValidSomaliMobile(primary)) return primary;
  if (isValidSomaliMobile(secondary)) return secondary;
  return primary || secondary || '';
}

export function maskPhone(phone = '') {
  const normalized = normalizeSomaliMobile(phone);
  if (normalized.length < 4) return '****';
  return `${normalized.slice(0, 2)}****${normalized.slice(-2)}`;
}

function responseKeys(payload) {
  if (!payload || typeof payload !== 'object') return [];
  return Object.keys(payload);
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const asNumber = Number(String(text).replace(/,/g, '').trim());
    if (Number.isFinite(asNumber)) return asNumber;
    return { raw: String(text).slice(0, 200) };
  }
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/,/g, '').replace(/[^\d.-]/g, '').trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractToken(payload) {
  const token = payload?.data?.token || payload?.token;
  return token && String(token).trim() ? String(token).trim() : null;
}

function extractBalance(payload) {
  const nested = payload?.data ?? payload;
  return toNumber(nested?.balance ?? nested?.Balance ?? payload?.balance);
}

function extractAccountType(payload) {
  const nested = payload?.data ?? payload;
  return String(nested?.accountType || nested?.AccountType || payload?.accountType || '').trim();
}

function extractProviderMessage(payload, fallback) {
  const text = payload?.message || payload?.data?.message || payload?.error || '';
  if (/invalid.?login|unauthorized|authentication|password/i.test(String(text))) {
    return 'Tabaarak SMS authentication failed.';
  }
  if (/balance|credit/i.test(String(text))) {
    return 'Insufficient SMS balance.';
  }
  if (/mobile|phone|number/i.test(String(text))) {
    return 'Invalid recipient number.';
  }
  if (text && !/token|bearer|password/i.test(String(text))) {
    return String(text);
  }
  return fallback;
}

function isSendSuccessful(payload, httpOk) {
  if (!httpOk && payload?.success !== true) return false;
  if (payload?.success === false) return false;
  if (payload?.data?.acceptedForDelivery === true) return true;
  if (payload?.success === true) return true;
  return false;
}

export async function getTabaarakAccessToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const { username, password } = getCredentials();
  let response;
  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        Name: username,
        Password: password,
      }),
    });
  } catch {
    const error = new Error('Tabaarak service unavailable.');
    error.code = 'SMS_UNAVAILABLE';
    throw error;
  }

  const payload = await parseBody(response);
  const token = extractToken(payload);
  safeLog('SMSLogin', {
    httpStatus: response.status,
    success: payload?.success === true,
    keys: responseKeys(payload),
    dataKeys: responseKeys(payload?.data),
    hasToken: Boolean(token),
    accountType: extractAccountType(payload) || null,
  });

  if (!response.ok || payload?.success === false || !token) {
    const error = new Error(
      extractProviderMessage(payload, 'Tabaarak SMS authentication failed.')
    );
    error.code = 'SMS_AUTH_FAILED';
    throw error;
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + 50 * 60 * 1000;
  return cachedToken;
}

async function authorizedRequest(url, { method = 'GET', body, token }) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function fetchSmsBalance() {
  const token = await getTabaarakAccessToken();
  let response;
  try {
    response = await authorizedRequest(BALANCE_URL, { method: 'GET', token });
  } catch {
    const error = new Error('Tabaarak service unavailable.');
    error.code = 'SMS_UNAVAILABLE';
    throw error;
  }

  if (response.status === 401) {
    cachedToken = null;
    tokenExpiresAt = 0;
    const retryToken = await getTabaarakAccessToken(true);
    response = await authorizedRequest(BALANCE_URL, { method: 'GET', token: retryToken });
  }

  const payload = await parseBody(response);
  const balance = extractBalance(payload);
  const accountType = extractAccountType(payload);
  safeLog('GetSmsBalance', {
    httpStatus: response.status,
    success: payload?.success === true,
    keys: responseKeys(payload),
    dataKeys: responseKeys(payload?.data),
    hasBalance: balance != null,
    accountType: accountType || null,
  });

  if (!response.ok || payload?.success === false || balance == null) {
    const error = new Error(
      extractProviderMessage(payload, 'Unable to retrieve Tabaarak SMS balance.')
    );
    error.code = 'SMS_BALANCE_FAILED';
    throw error;
  }

  return {
    balance,
    accountType: accountType || 'Prepaid',
    status: 'connected',
    provider: 'Tabaarak',
  };
}

export async function sendTabaarakSms(mobiles, message) {
  const numbers = (Array.isArray(mobiles) ? mobiles : [mobiles])
    .map((item) => normalizeSomaliMobile(item))
    .filter((item) => isValidSomaliMobile(item));

  if (!numbers.length) {
    return {
      success: false,
      acceptedForDelivery: false,
      totalNumber: 0,
      providerRef: '',
      error: 'Invalid recipient number.',
    };
  }

  const token = await getTabaarakAccessToken();
  const body = {
    smsMessage: message,
    mobile: numbers,
  };

  let response;
  try {
    response = await authorizedRequest(SEND_URL, { method: 'POST', body, token });
  } catch {
    return {
      success: false,
      acceptedForDelivery: false,
      totalNumber: 0,
      providerRef: '',
      error: 'Tabaarak service unavailable.',
    };
  }

  if (response.status === 401) {
    cachedToken = null;
    tokenExpiresAt = 0;
    const retryToken = await getTabaarakAccessToken(true);
    response = await authorizedRequest(SEND_URL, { method: 'POST', body, token: retryToken });
  }

  const payload = await parseBody(response);
  const acceptedForDelivery = payload?.data?.acceptedForDelivery === true;
  const success = isSendSuccessful(payload, response.ok);
  const totalNumber = Number(payload?.data?.totalNumber);
  safeLog('SendSMS', {
    httpStatus: response.status,
    success: payload?.success === true,
    acceptedForDelivery,
    totalNumber: Number.isFinite(totalNumber) ? totalNumber : null,
    keys: responseKeys(payload),
    dataKeys: responseKeys(payload?.data),
  });

  return {
    success,
    acceptedForDelivery,
    totalNumber: Number.isFinite(totalNumber) ? totalNumber : numbers.length,
    providerRef: '',
    error: success
      ? ''
      : extractProviderMessage(payload, 'SMS could not be sent.'),
  };
}

export function clearSmsTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}
