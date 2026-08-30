import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorState from '../components/common/ErrorState';import RecentOccurrencesTable from '../components/reports/RecentOccurrencesTable';
import {
  CategoryBarChart,
  OccurrenceTrendChart,
  StatusDonutChart,
} from '../components/reports/ReportCharts';
import ReportFilters from '../components/reports/ReportFilters';
import ReportStatCard from '../components/reports/ReportStatCard';
import ReportToast from '../components/reports/ReportToast';
import {
  exportOccurrencesCsv,
  getOccurrenceMeta,
  getOccurrenceStats,
  listOccurrences,
} from '../services/occurrenceService';
import {
  buildPreviousPeriodParams,
  buildStatsParams,
  calcChangePct,
  formatPeriodLabel,
} from '../utils/reportsPeriod';

const DEFAULT_FILTERS = {
  range: 'this_month',
  dateFrom: '',
  dateTo: '',
  status: '',
  category: '',
  station: '',
};

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill="currentColor"
      d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4z"
    />
  </svg>
);

export default function ReportsPage() {
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [meta, setMeta] = useState({ statuses: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'info' });
  const [exporting, setExporting] = useState(false);
  const [trendGranularity, setTrendGranularity] = useState('month');

  const stationOptions = useMemo(() => {
    const fromStats = (data?.byStation || [])
      .map((item) => item.station)
      .filter(Boolean);
    return [...new Set(fromStats)].sort();
  }, [data?.byStation]);

  const filteredRecent = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recentRecords;
    return recentRecords.filter((record) => {
      const haystack = [
        record.obNumber,
        record.complainantName,
        record.citizen?.name,
        record.category,
        record.location,
        record.assignedOfficer?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [recentRecords, search]);

  const load = useCallback(async () => {
    if (appliedFilters.range === 'custom' && (!appliedFilters.dateFrom || !appliedFilters.dateTo)) {
      setLoading(false);
      setTableLoading(false);
      setData(null);
      setPreviousData(null);
      setRecentRecords([]);
      return;
    }

    setLoading(true);
    setTableLoading(true);
    setError('');

    const statsParams = { ...buildStatsParams(appliedFilters), trend: trendGranularity };
    const previousParams = buildPreviousPeriodParams(appliedFilters);

    try {
      const [statsResult, metaResult, listResult, prevResult] = await Promise.all([
        getOccurrenceStats(statsParams),
        getOccurrenceMeta(),
        listOccurrences({ ...statsParams, limit: 15, page: 1 }),
        previousParams ? getOccurrenceStats(previousParams).catch(() => null) : Promise.resolve(null),
      ]);

      setData(statsResult);
      setPreviousData(prevResult);
      setRecentRecords(listResult.records || []);
      setMeta(metaResult || { statuses: [], categories: [] });
    } catch (err) {
      setError(err.message || 'Unable to load reports.');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [appliedFilters, trendGranularity]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary || {};
  const prevSummary = previousData?.summary || {};

  const openCases =
    (summary.open || 0) +
    (summary.underInvestigation || 0) +
    (summary.pending || 0);

  const prevOpenCases =
    (prevSummary.open || 0) +
    (prevSummary.underInvestigation || 0) +
    (prevSummary.pending || 0);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setToast({ message: 'Filters applied.', tone: 'success' });
  };

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSearch('');
    setToast({ message: 'Filters reset.', tone: 'info' });
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await exportOccurrencesCsv(buildStatsParams(appliedFilters));
      setToast({ message: 'CSV report downloaded successfully.', tone: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Export failed.', tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add('reports-print-mode');
    window.print();
    window.setTimeout(() => document.body.classList.remove('reports-print-mode'), 500);
  };

  const customRangeIncomplete =
    appliedFilters.range === 'custom' && (!appliedFilters.dateFrom || !appliedFilters.dateTo);

  return (
    <div className="reports-dashboard">
      <ReportToast
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast({ message: '', tone: 'info' })}
      />

      <header className="reports-hero">
        <div className="reports-hero__intro">
          <h1>Reports &amp; Analytics</h1>
          <p>Monitor occurrence records, complaints, and case activity</p>
          <span className="reports-hero__period">{formatPeriodLabel(appliedFilters.range)}</span>
        </div>

        <div className="reports-hero__tools">
          <form
            className="reports-hero__search"
            onSubmit={(event) => event.preventDefault()}
            role="search"
          >
            <span className="reports-hero__search-icon">{SEARCH_ICON}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search citizens, occurrence ID, or case…"
              aria-label="Search reports"
            />
          </form>

          <div className="reports-hero__actions">
            <Link className="btn btn--ghost" to="/ob-records">
              Open OB Records
            </Link>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleExportCsv}
              disabled={exporting || customRangeIncomplete}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handlePrint}
              disabled={customRangeIncomplete}
            >
              Export PDF
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handlePrint}
              disabled={customRangeIncomplete}
            >
              Print Report
            </button>
            <button type="button" className="btn btn--primary" onClick={load} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <ReportFilters
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        statuses={meta.statuses || []}
        categories={meta.categories || []}
        stations={stationOptions}
        applying={loading}
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : customRangeIncomplete ? (
        <div className="report-table-empty">
          <h3>Select a custom date range</h3>
          <p>Choose start and end dates, then click Apply Filters.</p>
        </div>
      ) : (
        <>
          <section className="reports-stats-grid" aria-label="Key statistics">
            <ReportStatCard
              label="Total Occurrences"
              value={summary.total}
              description="All records in selected period"
              changePct={calcChangePct(summary.total, prevSummary.total)}
              icon="total"
              tone="navy"
              loading={loading}
            />
            <ReportStatCard
              label="Open Cases"
              value={openCases}
              description="Active cases requiring attention"
              changePct={calcChangePct(openCases, prevOpenCases)}
              icon="open"
              tone="blue"
              loading={loading}
            />
            <ReportStatCard
              label="Pending Investigation"
              value={summary.pending}
              description="Awaiting investigation assignment"
              changePct={calcChangePct(summary.pending, prevSummary.pending)}
              icon="pending"
              tone="amber"
              loading={loading}
            />
            <ReportStatCard
              label="Resolved Cases"
              value={summary.resolved}
              description="Successfully resolved occurrences"
              changePct={calcChangePct(summary.resolved, prevSummary.resolved)}
              icon="resolved"
              tone="green"
              loading={loading}
            />
            <ReportStatCard
              label="Closed Cases"
              value={summary.closed}
              description="Formally closed occurrences"
              changePct={calcChangePct(summary.closed, prevSummary.closed)}
              icon="closed"
              tone="slate"
              loading={loading}
            />
          </section>

          <section className="reports-analytics-grid">
            <article className="report-panel">
              <div className="report-panel__header report-panel__header--spread">
                <div>
                  <h2>Occurrence Trends</h2>
                  <p>Volume of occurrence records over time</p>
                </div>
              </div>
              <OccurrenceTrendChart
                trends={data?.trends || data?.monthlyTrends}
                granularity={trendGranularity}
                onGranularityChange={setTrendGranularity}
                loading={loading}
              />
            </article>

            <article className="report-panel">
              <div className="report-panel__header">
                <h2>Case Status Distribution</h2>
                <p>Breakdown of cases by current status</p>
              </div>
              <StatusDonutChart byStatus={data?.byStatus} loading={loading} />
            </article>

            <article className="report-panel report-panel--wide">
              <div className="report-panel__header">
                <h2>Occurrence Categories</h2>
                <p>Most frequent occurrence types reported</p>
              </div>
              <CategoryBarChart byCategory={data?.byCategory} loading={loading} />
            </article>
          </section>

          <section className="report-panel report-panel--table">
              <div className="report-panel__header report-panel__header--spread">
                <div>
                  <h2>Recent Occurrence Records</h2>
                  <p>Latest records matching your filters</p>
                </div>
              </div>
              <RecentOccurrencesTable records={filteredRecent} loading={tableLoading} />
            </section>
        </>
      )}
    </div>
  );
}
