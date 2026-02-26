import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { createChore, updateChore, getChore, deleteChore } from '../api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#3788d8', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

const DEFAULT_FORM = {
  title: '',
  description: '',
  color: '#3788d8',
  assigneeId: '',
  recurrenceType: 'none',
  recurrenceInterval: 1,
  recurrenceDaysOfWeek: [],
  recurrenceDayOfMonth: 1,
  startDate: '',
  endDate: '',
};

export default function ChoreForm({ mode, defaultDate, choreId, onClose }) {
  const { members } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ ...DEFAULT_FORM, startDate: defaultDate || today });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && choreId) {
      getChore(choreId).then(({ chore }) => {
        setForm({
          title: chore.title || '',
          description: chore.description || '',
          color: chore.color || '#3788d8',
          assigneeId: chore.assigneeId || '',
          recurrenceType: chore.recurrenceType || 'none',
          recurrenceInterval: chore.recurrenceInterval || 1,
          recurrenceDaysOfWeek: chore.recurrenceDaysOfWeek || [],
          recurrenceDayOfMonth: chore.recurrenceDayOfMonth || 1,
          startDate: chore.startDate || '',
          endDate: chore.endDate || '',
        });
      }).catch(() => setError('Failed to load chore'));
    }
  }, [mode, choreId]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleDay = (dow) => {
    setForm(f => ({
      ...f,
      recurrenceDaysOfWeek: f.recurrenceDaysOfWeek.includes(dow)
        ? f.recurrenceDaysOfWeek.filter(d => d !== dow)
        : [...f.recurrenceDaysOfWeek, dow].sort(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Title is required');
    if (form.recurrenceType === 'weekly' && form.recurrenceDaysOfWeek.length === 0) {
      return setError('Select at least one day of the week');
    }

    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      color: form.color,
      assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null,
      recurrenceType: form.recurrenceType,
      recurrenceInterval: parseInt(form.recurrenceInterval) || 1,
      recurrenceDaysOfWeek: form.recurrenceType === 'weekly' ? form.recurrenceDaysOfWeek : null,
      recurrenceDayOfMonth: form.recurrenceType === 'monthly' ? parseInt(form.recurrenceDayOfMonth) : null,
      startDate: form.startDate,
      endDate: form.endDate || null,
    };

    setLoading(true);
    try {
      if (mode === 'edit') {
        await updateChore(choreId, payload);
      } else {
        await createChore(payload);
      }
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this chore? This will also remove all completion history.')) return;
    setLoading(true);
    try {
      await deleteChore(choreId);
      onClose(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
      <div className="modal">
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Chore' : 'New Chore'}</h2>
          <button className="btn-close" onClick={() => onClose(false)}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="chore-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Clean the kitchen"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional details..."
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Assign to</label>
              <select value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => set('color', c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
                min={form.startDate}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Recurrence</label>
            <select value={form.recurrenceType} onChange={e => set('recurrenceType', e.target.value)}>
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {form.recurrenceType !== 'none' && (
            <div className="form-group">
              <label>Every</label>
              <div className="interval-row">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.recurrenceInterval}
                  onChange={e => set('recurrenceInterval', e.target.value)}
                  className="input-small"
                />
                <span>
                  {form.recurrenceType === 'daily' && 'day(s)'}
                  {form.recurrenceType === 'weekly' && 'week(s)'}
                  {form.recurrenceType === 'monthly' && 'month(s)'}
                </span>
              </div>
            </div>
          )}

          {form.recurrenceType === 'weekly' && (
            <div className="form-group">
              <label>On days</label>
              <div className="day-picker">
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`day-btn ${form.recurrenceDaysOfWeek.includes(i) ? 'selected' : ''}`}
                    onClick={() => toggleDay(i)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.recurrenceType === 'monthly' && (
            <div className="form-group">
              <label>Day of month</label>
              <input
                type="number"
                min={1}
                max={31}
                value={form.recurrenceDayOfMonth}
                onChange={e => set('recurrenceDayOfMonth', e.target.value)}
                className="input-small"
              />
            </div>
          )}

          <div className="modal-footer">
            {mode === 'edit' && (
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={loading}>
                Delete
              </button>
            )}
            <div className="footer-right">
              <button type="button" className="btn-secondary" onClick={() => onClose(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Add Chore'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
