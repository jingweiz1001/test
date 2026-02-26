import React, { useState, useEffect, useCallback } from 'react';
import { getHistory } from '../api';

const PAGE_SIZE = 20;

export default function HistoryView() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (off) => {
    setLoading(true);
    setError('');
    try {
      const data = await getHistory({ limit: PAGE_SIZE, offset: off });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(offset);
  }, [load, offset]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="history-view">
      <div className="history-header">
        <h2>Completion History</h2>
        <span className="history-count">{total} total</span>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No completed chores yet.</div>
      ) : (
        <>
          <table className="history-table">
            <thead>
              <tr>
                <th>Chore</th>
                <th>Due Date</th>
                <th>Completed By</th>
                <th>Completed At</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="td-chore">{item.choreTitle}</td>
                  <td>{item.occurrenceDate}</td>
                  <td>{item.completedBy}</td>
                  <td>{new Date(item.completedAt).toLocaleString()}</td>
                  <td className="td-notes">{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="pagination">
              <button
                className="btn-secondary btn-sm"
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
              >
                ← Prev
              </button>
              <span>Page {currentPage} of {pages}</span>
              <button
                className="btn-secondary btn-sm"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
