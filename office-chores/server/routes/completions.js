const express = require('express');
const db = require('../db');
const router = express.Router();

// POST /api/completions
router.post('/', (req, res) => {
  const { choreId, occurrenceDate, completedBy, notes } = req.body;
  if (!choreId || !occurrenceDate || !completedBy) {
    return res.status(400).json({ error: 'choreId, occurrenceDate, and completedBy are required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO completions (chore_id, occurrence_date, completed_by, notes)
      VALUES (?, ?, ?, ?)
    `).run(choreId, occurrenceDate, completedBy, notes || null);
    const completion = db.prepare('SELECT * FROM completions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ completion });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Already marked complete' });
    }
    throw err;
  }
});

// DELETE /api/completions  (undo completion)
router.delete('/', (req, res) => {
  const { choreId, occurrenceDate } = req.body;
  if (!choreId || !occurrenceDate) {
    return res.status(400).json({ error: 'choreId and occurrenceDate are required' });
  }
  const result = db.prepare(
    'DELETE FROM completions WHERE chore_id = ? AND occurrence_date = ?'
  ).run(choreId, occurrenceDate);
  if (result.changes === 0) return res.status(404).json({ error: 'Completion not found' });
  res.json({ ok: true });
});

// GET /api/completions/history
router.get('/history', (req, res) => {
  const { choreId, limit = 50, offset = 0 } = req.query;

  let where = '';
  const params = [];
  if (choreId) {
    where = 'WHERE c.id = ?';
    params.push(choreId);
  }

  const total = db.prepare(`
    SELECT COUNT(*) AS cnt FROM completions co
    JOIN chores c ON co.chore_id = c.id
    ${where}
  `).get(...params).cnt;

  const items = db.prepare(`
    SELECT co.id, co.chore_id AS choreId, c.title AS choreTitle,
           co.occurrence_date AS occurrenceDate, co.completed_by AS completedBy,
           co.completed_at AS completedAt, co.notes
    FROM completions co
    JOIN chores c ON co.chore_id = c.id
    ${where}
    ORDER BY co.completed_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), parseInt(offset));

  res.json({ total, items });
});

module.exports = router;
