import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { markComplete, unmarkComplete } from '../api';

export default function ChorePopover({ event, jsEvent, onClose, onEdit }) {
  const { members } = useApp();
  const data = event.extendedProps;
  const [selectedName, setSelectedName] = useState(members[0]?.name || '');
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const completedBy = useCustom ? customName : selectedName;

  const handleMarkDone = async () => {
    if (!completedBy.trim()) return setError('Please enter your name');
    setLoading(true);
    setError('');
    try {
      await markComplete(data.choreId, data.occurrenceDate, completedBy.trim(), notes || null);
      onClose(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUnmark = async () => {
    setLoading(true);
    try {
      await unmarkComplete(data.choreId, data.occurrenceDate);
      onClose(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
      <div className="popover">
        <div className="popover-header" style={{ borderLeft: `4px solid ${data.color}` }}>
          <div>
            <h3>{data.title}</h3>
            <span className="popover-date">{data.occurrenceDate}</span>
          </div>
          <button className="btn-close" onClick={() => onClose(false)}>✕</button>
        </div>

        <div className="popover-body">
          {data.assigneeName && (
            <div className="popover-row">
              <span className="popover-label">Assigned to</span>
              <span>{data.assigneeName}</span>
            </div>
          )}

          {data.description && (
            <div className="popover-row">
              <span className="popover-label">Notes</span>
              <span>{data.description}</span>
            </div>
          )}

          {data.isRecurring && (
            <div className="popover-row">
              <span className="badge-recurring">Recurring</span>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          {data.completed ? (
            <div className="completion-info">
              <div className="completion-badge">Done</div>
              <p>Completed by <strong>{data.completedBy}</strong></p>
              <p className="completed-at">{new Date(data.completedAt).toLocaleString()}</p>
              <button className="btn-secondary btn-sm" onClick={handleUnmark} disabled={loading}>
                Undo
              </button>
            </div>
          ) : (
            <div className="mark-done-section">
              <label className="section-label">Mark as done</label>
              <div className="name-selector">
                {members.length > 0 && !useCustom ? (
                  <>
                    <select
                      value={selectedName}
                      onChange={e => setSelectedName(e.target.value)}
                    >
                      {members.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => setUseCustom(true)}
                    >
                      Enter name manually
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      autoFocus
                    />
                    {members.length > 0 && (
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setUseCustom(false)}
                      >
                        Pick from list
                      </button>
                    )}
                  </>
                )}
              </div>
              <input
                type="text"
                placeholder="Optional note..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="notes-input"
              />
              <button className="btn-primary btn-sm" onClick={handleMarkDone} disabled={loading}>
                {loading ? 'Saving…' : 'Mark Done'}
              </button>
            </div>
          )}
        </div>

        <div className="popover-footer">
          <button className="btn-secondary btn-sm" onClick={() => onEdit(data.choreId)}>
            Edit Chore
          </button>
        </div>
      </div>
    </div>
  );
}
