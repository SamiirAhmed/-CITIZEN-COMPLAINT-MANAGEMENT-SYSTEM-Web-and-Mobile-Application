import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSummaryCard from '../../components/dashboard/DashboardSummaryCard';
import SystemAlerts from '../../components/dashboard/SystemAlerts';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { getNotifications } from '../../services/notificationService';
import { listStaffOBRecords } from '../../services/obService';
import PoliceOBTable from './PoliceOBTable';

function formatClock(value) {
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

export default function PoliceDashboardPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextRecords, nextNotes] = await Promise.all([
        listStaffOBRecords(),
        getNotifications(),
      ]);
      setRecords(nextRecords);
      setNotifications(nextNotes.notifications || []);
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

  const stats = useMemo(() => {
    const assigned = records.length;
    const investigating = records.filter((item) => item.status === 'Under Investigation').length;
    const completed = records.filter((item) =>
      ['Investigation Completed', 'Resolved', 'Closed'].includes(item.status)
    ).length;
    const unread = notifications.filter((item) => !item.isRead).length;
    return { assigned, investigating, completed, unread };
  }, [records, notifications]);

  const displayName = user?.name || 'Police Officer';
  const { date, time } = formatClock(now);
  const recentRecords = records.slice(0, 6);
  const alerts = notifications.slice(0, 5).map((item) => ({
    id: item.id,
    type: item.isRead ? 'complaint' : 'citizen',
    title: item.title,
    detail: item.message,
    createdAt: item.createdAt,
  }));

  if (loading) return <LoadingState message="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page-stack dashboard-page">
      <header className="dashboard-intro dashboard-intro--row">
        <div>
          <h2>Police Dashboard</h2>
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

      <section className="dash-card-grid" aria-label="Assigned workload">
        <DashboardSummaryCard
          label="Assigned OBs"
          value={stats.assigned}
          hint="Records assigned to you"
          tone="primary"
        />
        <DashboardSummaryCard
          label="Under Investigation"
          value={stats.investigating}
          hint="Active investigations"
          tone="warning"
        />
        <DashboardSummaryCard
          label="Completed"
          value={stats.completed}
          hint="Finished investigations"
          tone="info"
        />
        <DashboardSummaryCard
          label="Notifications"
          value={stats.unread}
          hint="Unread updates"
          tone="purple"
        />
      </section>

      <section className="dashboard-bottom">
        <article className="panel dash-panel">
          <div className="panel__header panel__header--spread">
            <div>
              <h2>Assigned OB Records</h2>
              <p className="muted">Latest occurrence book records assigned to you.</p>
            </div>
            <Link to="/ob-records" className="btn btn--ghost btn--small">
              View All
            </Link>
          </div>
          <PoliceOBTable
            records={recentRecords}
            showActions={false}
            emptyTitle="No assigned OB records"
            emptyMessage="When a case is assigned to you, it will appear here."
          />
        </article>
        <SystemAlerts alerts={alerts} />
      </section>
    </div>
  );
}
