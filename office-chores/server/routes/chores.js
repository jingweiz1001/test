const express = require('express');
const db = require('../db');
const { expandOccurrences } = require('../recurrence');
const router = express.Router();

// GET /api/chores?start=YYYY-MM-DD&end=YYYY-MM-DD
// Returns FullCalendar-ready events for the given date range
router.get('/', (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end query params required' });
  }

  const chores = db.prepare(`
    SELECT c.*, m.name AS assignee_name
    FROM chores c
    LEFT JOIN members m ON c.assignee_id = m.id
  `).all();

  // Expand all recurrences within range
  const occurrences = []; // { choreId, occurrenceDate, chore }
  for (const chore of chores) {
    const dates = expandOccurrences(chore, start, end);
    for (const date of dates) {
      occurrences.push({ choreId: chore.id, occurrenceDate: date, chore });
    }
  }

  if (occurrences.length === 0) {
    return res.json({ events: [] });
  }

  // Batch-fetch completions for all occurrences
  const placeholders = occurrences.map(() => '(?,?)').join(',');
  const values = occurrences.flatMap(o => [o.choreId, o.occurrenceDate]);
  const completionRows = db.prepare(`
    SELECT chore_id, occurrence_date, completed_by, completed_at, notes
    FROM completions
    WHERE (chore_id, occurrence_date) IN (VALUES ${placeholders})
  `).all(...values);

  const completionMap = new Map();
  for (const row of completionRows) {
    completionMap.set(`${row.chore_id}_${row.occurrence_date}`, row);
  }

  const events = occurrences.map(({ choreId, occurrenceDate, chore }) => {
    const completion = completionMap.get(`${choreId}_${occurrenceDate}`) || null;
    return {
      id: `${choreId}_${occurrenceDate}`,
      choreId,
      occurrenceDate,
      title: chore.title,
      description: chore.description,
      color: chore.color,
      assigneeId: chore.assignee_id,
      assigneeName: chore.assignee_name,
      isRecurring: chore.recurrence_type !== 'none' && chore.recurrence_type !== null,
      completed: !!completion,
      completedBy: completion ? completion.completed_by : null,
      completedAt: completion ? completion.completed_at : null,
      notes: completion ? completion.notes : null,
    };
  });

  res.json({ events });
});

// GET /api/chores/:id
router.get('/:id', (req, res) => {
  const chore = db.prepare(`
    SELECT c.*, m.name AS assignee_name
    FROM chores c
    LEFT JOIN members m ON c.assignee_id = m.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!chore) return res.status(404).json({ error: 'Chore not found' });
  res.json({ chore: formatChore(chore) });
});

// POST /api/chores
router.post('/', (req, res) => {
  const chore = validateAndExtract(req.body);
  if (chore.error) return res.status(400).json({ error: chore.error });

  const result = db.prepare(`
    INSERT INTO chores
      (title, description, color, assignee_id, recurrence_type, recurrence_interval,
       recurrence_days_of_week, recurrence_day_of_month, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    chore.title, chore.description, chore.color, chore.assigneeId,
    chore.recurrenceType, chore.recurrenceInterval,
    chore.recurrenceDaysOfWeek, chore.recurrenceDayOfMonth,
    chore.startDate, chore.endDate
  );

  const created = db.prepare(`
    SELECT c.*, m.name AS assignee_name FROM chores c
    LEFT JOIN members m ON c.assignee_id = m.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ chore: formatChore(created) });
});

// PUT /api/chores/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM chores WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Chore not found' });

  const chore = validateAndExtract(req.body);
  if (chore.error) return res.status(400).json({ error: chore.error });

  db.prepare(`
    UPDATE chores SET
      title = ?, description = ?, color = ?, assignee_id = ?,
      recurrence_type = ?, recurrence_interval = ?,
      recurrence_days_of_week = ?, recurrence_day_of_month = ?,
      start_date = ?, end_date = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    chore.title, chore.description, chore.color, chore.assigneeId,
    chore.recurrenceType, chore.recurrenceInterval,
    chore.recurrenceDaysOfWeek, chore.recurrenceDayOfMonth,
    chore.startDate, chore.endDate,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT c.*, m.name AS assignee_name FROM chores c
    LEFT JOIN members m ON c.assignee_id = m.id
    WHERE c.id = ?
  `).get(req.params.id);

  res.json({ chore: formatChore(updated) });
});

// DELETE /api/chores/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM chores WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Chore not found' });
  res.json({ ok: true });
});

function validateAndExtract(body) {
  const {
    title, description, color, assigneeId,
    recurrenceType, recurrenceInterval, recurrenceDaysOfWeek,
    recurrenceDayOfMonth, startDate, endDate
  } = body;

  if (!title || !title.trim()) return { error: 'Title is required' };
  if (!startDate) return { error: 'startDate is required' };

  return {
    title: title.trim(),
    description: description || null,
    color: color || '#3788d8',
    assigneeId: assigneeId || null,
    recurrenceType: recurrenceType || 'none',
    recurrenceInterval: recurrenceInterval || 1,
    recurrenceDaysOfWeek: recurrenceDaysOfWeek ? JSON.stringify(recurrenceDaysOfWeek) : null,
    recurrenceDayOfMonth: recurrenceDayOfMonth || null,
    startDate,
    endDate: endDate || null,
  };
}

function formatChore(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    color: row.color,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    recurrenceType: row.recurrence_type,
    recurrenceInterval: row.recurrence_interval,
    recurrenceDaysOfWeek: row.recurrence_days_of_week ? JSON.parse(row.recurrence_days_of_week) : null,
    recurrenceDayOfMonth: row.recurrence_day_of_month,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = router;
