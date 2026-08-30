import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import ProfileAvatar from '../common/ProfileAvatar';
import SelectedRecipients from './SelectedRecipients';
import { listSmsRecipients } from '../../services/smsService';

export const SMS_MAX_LENGTH = 500;
export const SMS_SEGMENT_LENGTH = 160;

function smsSegments(length) {
  if (!length) return 0;
  return Math.ceil(length / SMS_SEGMENT_LENGTH);
}

export default function SmsComposeModal({
  open,
  sending,
  onClose,
  onConfirm,
}) {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState(new Map());
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const selectedRecipients = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  const selectedIds = useMemo(() => new Set(selectedMap.keys()), [selectedMap]);
  const reachCount = selectedRecipients.length;

  const letterCount = message.length;
  const remaining = Math.max(0, SMS_MAX_LENGTH - letterCount);
  const segments = Math.max(smsSegments(letterCount), 1);

  const canSend =
    !sending &&
    message.trim().length > 0 &&
    letterCount <= SMS_MAX_LENGTH &&
    selectedRecipients.length > 0;

  const loadRecipients = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const result = await listSmsRecipients({
        search: appliedSearch,
        page: 1,
        limit: 50,
      });
      setRecords(result.recipients);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [open, appliedSearch]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search, open]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setAppliedSearch('');
      setSelectedMap(new Map());
      setMessage('');
      setFormError('');
    }
  }, [open]);

  const toggleRecipient = (record) => {
    if (!record.hasValidPhone) return;
    setSelectedMap((current) => {
      const next = new Map(current);
      if (next.has(record.id)) next.delete(record.id);
      else next.set(record.id, record);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!canSend) {
      if (!message.trim()) setFormError('Please enter a message.');
      else if (!selectedRecipients.length) setFormError('Select at least one Police recipient.');
      return;
    }
    setFormError('');
    onConfirm({
      recipientMode: 'selected',
      userIds: selectedRecipients.map((item) => item.id),
      title: '',
      message: message.trim(),
      reachCount,
      recipients: selectedRecipients,
    });
  };

  return (
    <Modal
      open={open}
      title="Send Message"
      description="Search active Police users, select one or more people, write your message, and send."
      size="xl"
      onClose={sending ? undefined : onClose}
      footer={
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" disabled={sending} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canSend || sending}
            onClick={handleSubmit}
          >
            {sending ? 'Sending SMS...' : 'Send SMS'}
          </button>
        </div>
      }
    >
      <div className="sms-compose">
        {formError ? <div className="alert alert--warning sms-compose__alert">{formError}</div> : null}

        <div className="sms-compose__layout">
          <div className="sms-compose__main">
            <section className="sms-compose__section">
              <h3>Recipients</h3>
              <label className="field">
                <span>Search Police user</span>
                <input
                  type="search"
                  value={search}
                  placeholder="Filter by name or phone..."
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className="sms-compose__table table-scroll">
                {loading ? (
                  <p className="muted">Loading Police users…</p>
                ) : !records.length ? (
                  <p className="muted">No Police users match your search.</p>
                ) : (
                  <table className="data-table data-table--compact">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Badge</th>
                        <th>Station</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(record.id)}
                              disabled={!record.hasValidPhone}
                              onChange={() => toggleRecipient(record)}
                              aria-label={`Select ${record.name}`}
                            />
                          </td>
                          <td>
                            <ProfileAvatar
                              name={record.name}
                              src={record.profileImage}
                              size={32}
                              previewable={false}
                            />
                          </td>
                          <td className="cell-name">{record.name}</td>
                          <td>
                            {record.phone || '—'}
                            {!record.hasValidPhone ? (
                              <div className="cell-muted">Invalid phone</div>
                            ) : null}
                          </td>
                          <td>{record.badgeNumber || '—'}</td>
                          <td>{record.station || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="sms-compose__selected">
                <span className="sms-compose__section-label">Selected Police users</span>
                <SelectedRecipients
                  recipients={selectedRecipients}
                  onRemove={(id) =>
                    setSelectedMap((current) => {
                      const next = new Map(current);
                      next.delete(id);
                      return next;
                    })
                  }
                />
              </div>
            </section>

            <section className="sms-compose__section">
              <h3>Message</h3>
              <label className="field">
                <span>Message</span>
                <textarea
                  className="sms-compose__textarea"
                  rows={8}
                  value={message}
                  maxLength={SMS_MAX_LENGTH}
                  placeholder="Write your message here..."
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>
              <div className="sms-compose__counts">
                <span>Letters typed: {letterCount}</span>
                <span>{remaining} remaining</span>
              </div>
            </section>
          </div>

          <aside className="sms-compose__aside">
            <section className="sms-compose__card sms-compose__card--summary">
              <h3>Quick summary</h3>
              <p className="sms-compose__summary-copy">This message will reach</p>
              <p className="sms-compose__summary-count">{reachCount}</p>
              <p className="sms-compose__summary-copy">
                Police user{reachCount === 1 ? '' : 's'}
              </p>
            </section>

            <section className="sms-compose__card sms-compose__card--sms">
              <h3>SMS information</h3>
              <dl className="sms-compose__stats">
                <div>
                  <dt>Bulk SMS</dt>
                  <dd>{SMS_SEGMENT_LENGTH} characters = 1 SMS</dd>
                </div>
                <div>
                  <dt>Message chars</dt>
                  <dd>{letterCount}</dd>
                </div>
                <div>
                  <dt>This message uses</dt>
                  <dd>
                    {segments} SMS
                  </dd>
                </div>
              </dl>
            </section>

            <section className="sms-compose__card">
              <h3>Delivery channel</h3>
              <label className="sms-compose__check">
                <input type="checkbox" checked readOnly />
                Send SMS
              </label>
              <p className="sms-compose__provider">
                Provider: <strong>Tabaarak</strong>
              </p>
            </section>
          </aside>
        </div>
      </div>
    </Modal>
  );
}
