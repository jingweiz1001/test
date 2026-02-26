const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'chores.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chores (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    title                   TEXT NOT NULL,
    description             TEXT,
    color                   TEXT NOT NULL DEFAULT '#3788d8',
    assignee_id             INTEGER REFERENCES members(id) ON DELETE SET NULL,
    recurrence_type         TEXT CHECK(recurrence_type IN ('none','daily','weekly','monthly')),
    recurrence_interval     INTEGER NOT NULL DEFAULT 1,
    recurrence_days_of_week TEXT,
    recurrence_day_of_month INTEGER,
    start_date              TEXT NOT NULL,
    end_date                TEXT,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS completions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    chore_id        INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    occurrence_date TEXT NOT NULL,
    completed_by    TEXT NOT NULL,
    completed_at    TEXT NOT NULL DEFAULT (datetime('now')),
    notes           TEXT,
    UNIQUE(chore_id, occurrence_date)
  );

  CREATE INDEX IF NOT EXISTS idx_completions_chore_date
    ON completions(chore_id, occurrence_date);
`);

module.exports = db;
