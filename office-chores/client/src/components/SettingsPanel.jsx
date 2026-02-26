import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { addMember, deleteMember } from '../api';

export default function SettingsPanel({ onClose }) {
  const { members, loadMembers } = useApp();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    setLoading(true);
    try {
      await addMember(newName.trim());
      setNewName('');
      loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from the team? Their chore assignments will be cleared.`)) return;
    try {
      await deleteMember(id);
      loadMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Team Members</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <form onSubmit={handleAdd} className="add-member-form">
            <input
              type="text"
              placeholder="Add team member name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={loading || !newName.trim()}>
              Add
            </button>
          </form>

          {error && <div className="form-error">{error}</div>}

          <ul className="member-list">
            {members.length === 0 && (
              <li className="member-empty">No team members yet. Add some above.</li>
            )}
            {members.map(m => (
              <li key={m.id} className="member-item">
                <span className="member-avatar">{m.name.charAt(0).toUpperCase()}</span>
                <span className="member-name">{m.name}</span>
                <button
                  className="btn-remove"
                  onClick={() => handleDelete(m.id, m.name)}
                  title="Remove member"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
