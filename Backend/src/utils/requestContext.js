const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

export const getAccessSource = (req) => {
  const header = String(req.headers['x-access-source'] || '').trim();
  if (header) return header;

  const ua = String(req.headers['user-agent'] || '');
  if (/Dart|Flutter|okhttp|CitizenApp/i.test(ua)) return 'Citizen Mobile App';
  if (MOBILE_UA.test(ua)) return 'Mobile Web';

  return 'Web';
};

export const parseUserAgent = (userAgent = '') => {
  const ua = String(userAgent || '');
  if (!ua) {
    return {
      userAgent: '',
      browser: 'Unknown',
      operatingSystem: 'Unknown',
      device: 'Unknown',
    };
  }

  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/MSIE|Trident/i.test(ua)) browser = 'Internet Explorer';

  let operatingSystem = 'Unknown';
  if (/Windows NT/i.test(ua)) operatingSystem = 'Windows';
  else if (/Mac OS X/i.test(ua)) operatingSystem = 'macOS';
  else if (/Android/i.test(ua)) operatingSystem = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) operatingSystem = 'iOS';
  else if (/Linux/i.test(ua)) operatingSystem = 'Linux';

  let device = 'Desktop';
  if (/iPad|Tablet/i.test(ua)) device = 'Tablet';
  else if (MOBILE_UA.test(ua)) device = 'Mobile';

  return { userAgent: ua, browser, operatingSystem, device };
};

export const getRequestContext = (req) => {
  const ipAddress =
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '';

  const accessSource = getAccessSource(req);
  const agent = parseUserAgent(req.headers['user-agent']);

  return {
    ipAddress,
    accessSource,
    location: 'Not available',
    ...agent,
  };
};
