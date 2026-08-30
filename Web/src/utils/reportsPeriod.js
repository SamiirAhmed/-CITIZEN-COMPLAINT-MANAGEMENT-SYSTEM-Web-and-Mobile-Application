function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

export const REPORT_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export function buildStatsParams(filters = {}) {
  const { range, dateFrom, dateTo, status, category, station } = filters;
  const params = {};

  if (status) params.status = status;
  if (category) params.category = category;
  if (station) params.station = station;

  if (range === 'custom') {
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }

  if (range === 'last_3_months') {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    params.dateFrom = toDateInput(from);
    params.dateTo = toDateInput(now);
    return params;
  }

  if (range === 'this_year') {
    const now = new Date();
    params.dateFrom = toDateInput(new Date(now.getFullYear(), 0, 1));
    params.dateTo = toDateInput(now);
    return params;
  }

  if (range) params.range = range;
  return params;
}

export function buildPreviousPeriodParams(filters = {}) {
  const { range, dateFrom, dateTo } = filters;
  const now = new Date();

  if (range === 'today') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const d = toDateInput(yesterday);
    return { dateFrom: d, dateTo: d };
  }

  if (range === 'this_week') {
    const end = new Date(now);
    const day = end.getDay();
    const diff = day === 0 ? 6 : day - 1;
    end.setDate(end.getDate() - diff - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { dateFrom: toDateInput(start), dateTo: toDateInput(end) };
  }

  if (range === 'this_month') {
    return { range: 'last_month' };
  }

  if (range === 'last_3_months') {
    const end = new Date(now.getFullYear(), now.getMonth() - 3, 0);
    const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
    return { dateFrom: toDateInput(start), dateTo: toDateInput(end) };
  }

  if (range === 'this_year') {
    const year = now.getFullYear() - 1;
    return {
      dateFrom: `${year}-01-01`,
      dateTo: `${year}-12-31`,
    };
  }

  if (range === 'custom' && dateFrom && dateTo) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const days = Math.max(1, Math.ceil((to - from) / 86400000) + 1);
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - days + 1);
    return { dateFrom: toDateInput(prevFrom), dateTo: toDateInput(prevTo) };
  }

  return null;
}

export function calcChangePct(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

export function formatPeriodLabel(range) {
  const match = REPORT_RANGE_OPTIONS.find((item) => item.value === range);
  return match?.label || 'Selected period';
}
