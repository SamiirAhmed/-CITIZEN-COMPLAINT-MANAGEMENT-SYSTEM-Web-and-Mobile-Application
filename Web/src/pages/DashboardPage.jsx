import { useCallback, useEffect, useState } from 'react';
import DashboardSummaryCard from '../components/dashboard/DashboardSummaryCard';
import RecentActivityTable from '../components/dashboard/RecentActivityTable';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { getDashboard } from '../services/dashboardService';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDashboard();
      setData(result);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState message="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const summary = data?.summary || {};

  return (
    <div className="page-stack">
      <section className="summary-grid">
        <DashboardSummaryCard
          label="Total Citizens"
          value={summary.totalCitizens}
          hint={`${summary.activeCitizens ?? 0} active`}
          tone="primary"
        />
        <DashboardSummaryCard
          label="Complaints"
          value={summary.totalComplaints}
          hint={`${summary.pendingComplaints ?? 0} pending`}
          tone="warning"
        />
        <DashboardSummaryCard
          label="OB Records"
          value={summary.totalOBs}
          hint={`${summary.activeOBs ?? 0} active`}
          tone="info"
        />
        <DashboardSummaryCard
          label="Staff Users"
          value={summary.totalStaff}
          hint="Admin & police"
          tone="success"
        />
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Recent Activity</h2>
            <p className="muted">Latest citizen registrations and complaints from the system.</p>
          </div>
        </div>
        <RecentActivityTable activities={data?.recentActivities || []} />
      </section>
    </div>
  );
}
