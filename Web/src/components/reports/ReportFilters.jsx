import { REPORT_RANGE_OPTIONS } from '../../utils/reportsPeriod';

export default function ReportFilters({
  filters,
  onChange,
  onApply,
  onReset,
  statuses = [],
  categories = [],
  stations = [],
  applying = false,
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <section className="report-filters" aria-label="Report filters">
      <div className="report-filters__grid">
        <label className="report-filters__field">
          <span>Date range</span>
          <select value={filters.range} onChange={(e) => set('range', e.target.value)}>
            {REPORT_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {filters.range === 'custom' ? (
          <>
            <label className="report-filters__field">
              <span>From</span>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => set('dateFrom', e.target.value)}
              />
            </label>
            <label className="report-filters__field">
              <span>To</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => set('dateTo', e.target.value)}
              />
            </label>
          </>
        ) : null}

        <label className="report-filters__field">
          <span>Status</span>
          <select value={filters.status} onChange={(e) => set('status', e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="report-filters__field">
          <span>Occurrence type</span>
          <select value={filters.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">All types</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="report-filters__field">
          <span>Police station</span>
          <select value={filters.station} onChange={(e) => set('station', e.target.value)}>
            <option value="">All stations</option>
            {stations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="report-filters__actions">
        <button type="button" className="btn btn--primary" onClick={onApply} disabled={applying}>
          {applying ? 'Applying…' : 'Apply Filters'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onReset} disabled={applying}>
          Reset
        </button>
      </div>
    </section>
  );
}
