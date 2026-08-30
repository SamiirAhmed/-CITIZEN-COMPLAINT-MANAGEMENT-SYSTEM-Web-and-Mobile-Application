import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ComplaintStatusChart from '../components/dashboard/ComplaintStatusChart';
import DashboardSummaryCard from '../components/dashboard/DashboardSummaryCard';
import RecentActivityTable from '../components/dashboard/RecentActivityTable';
import SystemAlerts from '../components/dashboard/SystemAlerts';
import SystemOverviewChart from '../components/dashboard/SystemOverviewChart';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../services/dashboardService';

function formatDateTime(value) {
  const date = value.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const time = value.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return { date, time };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

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

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <LoadingState message="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const summary = data?.summary || {};
  const trends = data?.cardTrends || {};
  const displayName = user?.name || 'Admin';
  const { date, time } = formatDateTime(now);

  return (
    <div className="page-stack dashboard-page">
      <header className="dashboard-intro dashboard-intro--row">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back, {displayName}</p>
        </div>
        <div className="dashboard-intro__actions">
          <div className="dashboard-datetime" aria-live="polite">
            <span className="dashboard-datetime__date">{date}</span>
            <span className="dashboard-datetime__divider" aria-hidden="true" />
            <span className="dashboard-datetime__time">{time}</span>
          </div>
        </div>
      </header>

      <section className="dash-card-grid" aria-label="Summary statistics">
        <DashboardSummaryCard
          label="Total Citizens"
          value={summary.totalCitizens}
          hint={`${summary.activeCitizens ?? 0} active citizens`}
          tone="primary"
          series={trends.citizens?.series}
          changePct={trends.citizens?.changePct}
        />
        <DashboardSummaryCard
          label="Total Complaints"
          value={summary.totalComplaints}
          hint={`${summary.pendingComplaints ?? 0} pending review`}
          tone="warning"
          series={trends.complaints?.series}
          changePct={trends.complaints?.changePct}
        />
        <DashboardSummaryCard
          label="OB Records"
          value={summary.totalOBs}
          hint={`${summary.activeOBs ?? 0} active cases`}
          tone="info"
          series={trends.obRecords?.series}
          changePct={trends.obRecords?.changePct}
        />
        <DashboardSummaryCard
          label="Staff Users"
          value={summary.totalStaff}
          hint="Admin & Police users"
          tone="purple"
          series={trends.staff?.series}
          changePct={trends.staff?.changePct}
        />
      </section>

      <section className="dashboard-analytics">
        <SystemOverviewChart overview={data?.overview} />
        <ComplaintStatusChart
          items={data?.complaintStatus || []}
          total={summary.totalComplaints || 0}
        />
      </section>

      <section className="dashboard-bottom">
        <article className="panel dash-panel">
          <div className="panel__header panel__header--spread">
            <div>
              <h2>Recent Activity</h2>
              <p className="muted">Latest citizen registrations and complaints.</p>
            </div>
            <Link to="/citizens" className="btn btn--ghost btn--small">
              View All
            </Link>
          </div>
          <RecentActivityTable activities={data?.recentActivities || []} />
        </article>
        <SystemAlerts alerts={data?.systemAlerts || []} />
      </section>
    </div>
  );
}
