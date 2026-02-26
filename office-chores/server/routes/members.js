const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/members
router.get('/', (req, res) => {
  const members = db.prepare('SELECT * FROM members ORDER BY name ASC').all();
  res.json({ members });
});

// POST /api/members
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const result = db.prepare('INSERT INTO members (name) VALUES (?)').run(name.trim());
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(member);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Name already exists' });
    }
    throw err;
  }
});

// DELETE /api/members/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM members WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Member not found' });
  res.json({ ok: true });
});

module.exports = router;
