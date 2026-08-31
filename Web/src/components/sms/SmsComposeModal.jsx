import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import ProfileAvatar from '../common/ProfileAvatar';
import SelectedRecipients from './SelectedRecipients';
import { listSmsRecipients } from '../../services/smsService';

export const SMS_MAX_LENGTH = 500;
export const SMS_SEGMENT_LENGTH = 160;

const RECIPIENT_TYPES = {
  police: {
    value: 'police',
    label: 'Police Users',
    searchLabel: 'Search Police user',
    searchPlaceholder: 'Search by name or phone...',
    selectedLabel: 'Selected Police users',
    emptyResults: 'No Police users match your search.',
    loadingLabel: 'Loading Police users…',
    summarySingular: 'Police user',
    summaryPlural: 'Police users',
  },
  citizen: {
    value: 'citizen',
    label: 'Citizens',
    searchLabel: 'Search Citizen',
    searchPlaceholder: 'Search by name or phone...',
    selectedLabel: 'Selected Citizens',
    emptyResults: 'No Citizens match your search.',
    loadingLabel: 'Loading Citizens…',
    summarySingular: 'Citizen',
    summaryPlural: 'Citizens',
  },
};

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
  const [recipientType, setRecipientType] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState(new Map());
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const typeConfig = RECIPIENT_TYPES[recipientType] || null;
  const selectedRecipients = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  const selectedIds = useMemo(() => new Set(selectedMap.keys()), [selectedMap]);
  const reachCount = selectedRecipients.length;
  const hasValidSelection = selectedRecipients.some((item) => item.hasValidPhone);

  const letterCount = message.length;
  const remaining = Math.max(0, SMS_MAX_LENGTH - letterCount);
  const segments = Math.max(smsSegments(letterCount), 1);

  const canSend =
    !sending &&
    recipientType &&
    message.trim().length > 0 &&
    letterCount <= SMS_MAX_LENGTH &&
    selectedRecipients.length > 0 &&
    hasValidSelection;

  const loadRecipients = useCallback(async () => {
    if (!open || !recipientType) return;
    setLoading(true);
    try {
      const result = await listSmsRecipients({
        recipientType,
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
  }, [open, recipientType, appliedSearch]);

  useEffect(() => {
    if (!open || !recipientType) return undefined;
    const timer = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search, open, recipientType]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  useEffect(() => {
    if (!open) {
      setRecipientType('');
      setSearch('');
      setAppliedSearch('');
      setSelectedMap(new Map());
      setMessage('');
      setFormError('');
      setRecords([]);
    }
  }, [open]);

  const handleRecipientTypeChange = (event) => {
    const nextType = event.target.value;
    if (nextType === recipientType) return;

    if (recipientType && selectedMap.size > 0) {
      const current = RECIPIENT_TYPES[recipientType];
      const next = RECIPIENT_TYPES[nextType];
      const confirmed = window.confirm(
        `Changing recipient type from ${current.label} to ${next.label} will remove your ${selectedMap.size} selected recipient${selectedMap.size === 1 ? '' : 's'}. Continue?`
      );
      if (!confirmed) return;
    }

    setRecipientType(nextType);
    setSelectedMap(new Map());
    setSearch('');
    setAppliedSearch('');
    setFormError('');
  };

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
    if (!recipientType) {
      setFormError('Select a recipient type.');
      return;
    }
    if (!message.trim()) {
      setFormError('Please enter a message.');
      return;
    }
    if (!selectedRecipients.length) {
      setFormError(`Select at least one ${typeConfig?.summarySingular || 'recipient'}.`);
      return;
    }
    if (!hasValidSelection) {
      setFormError('Each selected recipient must have a valid phone number.');
      return;
    }
    setFormError('');
    onConfirm({
      recipientType,
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
      description="Choose Police users or Citizens, select recipients, write your message, and send."
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
                <span>Recipient Type</span>
                <select value={recipientType} onChange={handleRecipientTypeChange}>
                  <option value="">Select recipient type</option>
                  <option value="police">{RECIPIENT_TYPES.police.label}</option>
                  <option value="citizen">{RECIPIENT_TYPES.citizen.label}</option>
                </select>
              </label>

              {!recipientType ? (
                <p className="sms-compose__hint muted">
                  Select Police Users or Citizens to search and choose recipients.
                </p>
              ) : (
                <>
                  <label className="field">
                    <span>{typeConfig.searchLabel}</span>
                    <input
                      type="search"
                      value={search}
                      placeholder={typeConfig.searchPlaceholder}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>

                  <div className="sms-compose__table table-scroll">
                    {loading ? (
                      <p className="muted">{typeConfig.loadingLabel}</p>
                    ) : !records.length ? (
                      <p className="muted">{typeConfig.emptyResults}</p>
                    ) : recipientType === 'police' ? (
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
                    ) : (
                      <table className="data-table data-table--compact">
                        <thead>
                          <tr>
                            <th>Select</th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>NIRA ID</th>
                            <th>District</th>
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
                              <td>{record.niraId || '—'}</td>
                              <td>{record.district || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="sms-compose__selected">
                    <span className="sms-compose__section-label">{typeConfig.selectedLabel}</span>
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
                </>
              )}
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
                {recipientType && typeConfig
                  ? reachCount === 1
                    ? typeConfig.summarySingular
                    : typeConfig.summaryPlural
                  : 'recipients'}
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
                  <dd>{segments} SMS</dd>
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
