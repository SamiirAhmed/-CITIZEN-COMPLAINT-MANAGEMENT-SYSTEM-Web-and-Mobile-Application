import { useCallback, useEffect, useState } from 'react';
import ErrorState from '../components/common/ErrorState';
import SmsComposeModal from '../components/sms/SmsComposeModal';
import SmsConfirmModal from '../components/sms/SmsConfirmModal';
import SmsHistoryTable from '../components/sms/SmsHistoryTable';
import SmsStatCards from '../components/sms/SmsStatCards';
import {
  getSmsBalance,
  getSmsStats,
  listSmsHistory,
  sendSms,
} from '../services/smsService';

const EMPTY_FILTERS = {
  dateFrom: '',
  dateTo: '',
  policeUser: '',
  status: '',
};

function toneClass(tone) {
  if (tone === 'success') return 'alert--success';
  if (tone === 'error') return 'alert--error';
  if (tone === 'warning') return 'alert--warning';
  return 'alert--info';
}

export default function SMSPortalPage() {
  const [policeTotal, setPoliceTotal] = useState(0);
  const [policeActive, setPoliceActive] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [policeUsers, setPoliceUsers] = useState([]);

  const [balance, setBalance] = useState(null);
  const [balanceStatus, setBalanceStatus] = useState('unavailable');
  const [accountType, setAccountType] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState('');

  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 1,
  });

  const [composeOpen, setComposeOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSend, setPendingSend] = useState(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState({ text: '', tone: 'info' });

  const loadStats = useCallback(async () => {
    try {
      const stats = await getSmsStats();
      setPoliceTotal(stats.policeTotal);
      setPoliceActive(stats.policeActive);
      setHistoryCount(stats.historyCount);
      setPoliceUsers(stats.policeUsers);
    } catch {
      // cards stay at last known real values
    }
  }, []);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError('');
    try {
      const result = await getSmsBalance();
      setBalance(result.balance);
      setBalanceStatus(result.status || 'unavailable');
      setAccountType(result.accountType || '');
      if (result.status !== 'connected') {
        setBalanceError(result.message || 'Unable to retrieve Tabaarak SMS balance.');
      } else {
        setBalanceError('');
      }
    } catch (err) {
      setBalance(null);
      setBalanceStatus('unavailable');
      setAccountType('');
      setBalanceError(err.message || 'Unable to retrieve Tabaarak SMS balance.');
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const result = await listSmsHistory({
        ...appliedFilters,
        page: historyPage,
        limit: 15,
      });
      setHistory(result.records);
      setHistoryPagination(result.pagination);
    } catch (err) {
      setHistory([]);
      setHistoryError(err.message || 'Unable to load SMS history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [appliedFilters, historyPage]);

  useEffect(() => {
    loadStats();
    loadBalance();
  }, [loadStats, loadBalance]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setHistoryPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setHistoryPage(1);
  };

  const handleComposeConfirm = (payload) => {
    setPendingSend(payload);
    setConfirmOpen(true);
  };

  const handleSend = async () => {
    if (!pendingSend) return;
    setSending(true);
    setNotice({ text: '', tone: 'info' });
    try {
      const result = await sendSms({
        recipientType: pendingSend.recipientType,
        recipientMode: pendingSend.recipientMode,
        userIds: pendingSend.userIds,
        title: pendingSend.title,
        message: pendingSend.message,
      });
      const data = result.data || {};
      const tone =
        data.status === 'success' ? 'success' : data.status === 'partial' ? 'warning' : 'error';
      setNotice({
        text: `${result.message}. Recipients: ${data.recipientCount || 0}. Successful: ${
          data.successCount || 0
        }. Failed: ${data.failedCount || 0}.`,
        tone,
      });
      if (data.balance != null) {
        setBalance(data.balance);
        setBalanceStatus(data.balanceStatus || 'connected');
        if (data.accountType) setAccountType(data.accountType);
      } else {
        await loadBalance();
      }
      setConfirmOpen(false);
      setComposeOpen(false);
      setPendingSend(null);
      await Promise.all([loadHistory(), loadStats()]);
    } catch (err) {
      setNotice({
        text: err.message || 'SMS could not be sent. Please try again.',
        tone: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-stack sms-portal">
      <SmsStatCards
        policeTotal={policeTotal}
        policeActive={policeActive}
        balance={balance}
        balanceStatus={balanceStatus}
        balanceLoading={balanceLoading}
        accountType={accountType}
        historyCount={historyCount}
        onRefreshBalance={loadBalance}
      />

      {balanceError ? <div className="alert alert--warning">{balanceError}</div> : null}
      {notice.text ? <div className={`alert ${toneClass(notice.tone)}`}>{notice.text}</div> : null}

      <section className="panel sms-portal__section">
        <div className="panel__header panel__header--spread">
          <div>
            <h2>Messaging Support</h2>
            <p className="muted">
              Send SMS to active Police users or Citizens from one message composer.
            </p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setComposeOpen(true)}>
            + New Message
          </button>
        </div>

        <form className="sms-portal__filters" onSubmit={handleApplyFilters}>
          <label className="field">
            <span>From date</span>
            <input
              type="date"
              value={draftFilters.dateFrom}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, dateFrom: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>To date</span>
            <input
              type="date"
              value={draftFilters.dateTo}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, dateTo: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Police user</span>
            <select
              value={draftFilters.policeUser}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, policeUser: event.target.value }))
              }
            >
              <option value="">All Police users</option>
              {policeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              <option value="">All</option>
              <option value="success">Sent</option>
              <option value="partial">Partially sent</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <div className="sms-portal__filter-actions">
            <button type="submit" className="btn btn--primary">
              Apply
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleClearFilters}>
              Clear
            </button>
          </div>
        </form>

        {historyError ? (
          <ErrorState message={historyError} onRetry={loadHistory} />
        ) : (
          <>
            <SmsHistoryTable records={history} loading={historyLoading} />
            <div className="pagination-bar">
              <p className="muted">
                Showing {history.length ? (historyPagination.page - 1) * (historyPagination.limit || 15) + 1 : 0}
                –
                {(historyPagination.page - 1) * (historyPagination.limit || 15) + history.length} of{' '}
                {historyPagination.total} · Page {historyPagination.page} of {historyPagination.pages}
              </p>
              <div className="action-row">
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  disabled={historyPage >= historyPagination.pages}
                  onClick={() => setHistoryPage((page) => page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <SmsComposeModal
        open={composeOpen}
        sending={sending}
        onClose={() => setComposeOpen(false)}
        onConfirm={handleComposeConfirm}
      />

      <SmsConfirmModal
        open={confirmOpen}
        recipients={pendingSend?.recipients || []}
        reachCount={pendingSend?.reachCount || 0}
        recipientType={pendingSend?.recipientType || 'police'}
        message={pendingSend?.message || ''}
        sending={sending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleSend}
      />
    </div>
  );
}
