import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSummaryCard from '../components/dashboard/DashboardSummaryCard';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import {
  exportOccurrencesCsv,
  getOccurrenceStats,
} from '../services/occurrenceService';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];

function BreakdownTable({ title, rows, labelKey }) {
  const key = labelKey.toLowerCase();
  return (
    <section className="panel panel--nested">
      <div className="panel__header">
        <h3>{title}</h3>
      </div>
      {!rows?.length ? (
        <p className="muted">No data for this period.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{labelKey}</th>
                <th>Count</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const label =
                  row[key] ||
                  row.status ||
                  row.category ||
                  row.priority ||
                  row.district ||
                  row.station ||
                  row.label ||
                  '—';
                const total = rows.reduce((sum, item) => sum + (item.count || 0), 0) || 1;
                const pct = Math.round(((row.count || 0) / total) * 100);
                return (
                  <tr key={`${label}-${index}`}>
                    <td>{label || '—'}</td>
                    <td>{row.count}</td>
                    <td>
                      <div className="bar-meter">
                        <div className="bar-meter__fill" style={{ width: `${pct}%` }} />
                        <span>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState('this_month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params =
        range === 'custom'
          ? { dateFrom, dateTo }
          : { range };
      const result = await getOccurrenceStats(params);
      setData(result);
    } catch (err) {
      setError(err.message || 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, [range, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (range === 'custom' && (!dateFrom || !dateTo)) {
        setLoading(false);
        return;
      }
      load();
    }, 200);
    return () => clearTimeout(timer);
  }, [load, range, dateFrom, dateTo]);

  const handleExport = async () => {
    try {
      const params =
        range === 'custom'
          ? { dateFrom, dateTo }
          : { range };
      await exportOccurrencesCsv(params);
      setNotice('Report CSV downloaded.');
    } catch (err) {
      setNotice(err.message || 'Export failed.');
    }
  };

  const summary = data?.summary || {};
  const openVsClosed = summary.openVsClosed || { open: 0, closed: 0 };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Occurrence Reports</h2>
            <p className="muted">
              Live statistics and breakdowns from the Police Occurrence Book.
            </p>
          </div>
          <div className="action-row">
            <Link className="btn btn--secondary" to="/ob-records">
              Open OB Records
            </Link>
            <button type="button" className="btn btn--primary" onClick={handleExport}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="toolbar">
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {range === 'custom' ? (
            <>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="From date"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="To date"
              />
            </>
          ) : null}
          <button type="button" className="btn btn--ghost" onClick={load}>
            Refresh
          </button>
        </div>

        {notice ? <div className="alert alert--info">{notice}</div> : null}

        {loading ? (
          <LoadingState message="Loading reports…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : range === 'custom' && (!dateFrom || !dateTo) ? (
          <p className="muted">Select a custom start and end date to generate the report.</p>
        ) : (
          <>
            <section className="summary-grid summary-grid--six">
              <DashboardSummaryCard label="Total Occurrences" value={summary.total} tone="primary" />
              <DashboardSummaryCard label="Open" value={summary.open} tone="warning" />
              <DashboardSummaryCard
                label="Under Investigation"
                value={summary.underInvestigation}
                tone="info"
              />
              <DashboardSummaryCard label="Pending" value={summary.pending} tone="warning" />
              <DashboardSummaryCard label="Resolved" value={summary.resolved} tone="success" />
              <DashboardSummaryCard label="Closed" value={summary.closed} tone="primary" />
            </section>

            <section className="summary-grid" style={{ marginTop: '1rem' }}>
              <DashboardSummaryCard
                label="Open (active)"
                value={openVsClosed.open}
                hint="Includes pending & investigation"
                tone="warning"
              />
              <DashboardSummaryCard
                label="Closed / Resolved"
                value={openVsClosed.closed}
                tone="success"
              />
            </section>

            <div className="report-grid">
              <BreakdownTable title="By status" rows={data?.byStatus} labelKey="Status" />
              <BreakdownTable title="By category" rows={data?.byCategory} labelKey="Category" />
              <BreakdownTable title="By priority" rows={data?.byPriority} labelKey="Priority" />
              <BreakdownTable title="By district" rows={data?.byDistrict} labelKey="District" />
              <BreakdownTable title="By station" rows={data?.byStation} labelKey="Station" />
              <BreakdownTable
                title="Monthly trends"
                rows={(data?.monthlyTrends || []).map((m) => ({
                  label: m.label,
                  count: m.count,
                }))}
                labelKey="Label"
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
