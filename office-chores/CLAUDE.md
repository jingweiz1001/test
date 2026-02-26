# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm start          # Run client and server concurrently (development)
npm run server     # Server only (Express on port 3001)
npm run client     # Client only (Vite dev server)
```

### Production
```bash
npm run build      # Build client to client/dist/
npm run prod       # Build client, then start server (serves built client)
```

There are no tests or linters configured in this project.

## Architecture

Monorepo with two packages:

- **`client/`** — React 18 SPA built with Vite. In development, Vite proxies `/api/*` requests to the Express server at `localhost:3001`. In production, the server serves the built `client/dist/` as static files.
- **`server/`** — Express.js REST API on port 3001 (configurable via `PORT` env var). Uses SQLite via `better-sqlite3` (synchronous API). The database file lives at `server/chores.db`.

### Backend key files
- [server/index.js](server/index.js) — Express entry point; mounts routes, configures CORS and static serving
- [server/db.js](server/db.js) — SQLite initialization; creates `members`, `chores`, and `completions` tables with WAL mode
- [server/recurrence.js](server/recurrence.js) — Expands recurring chores into specific occurrence dates within a date range using `date-fns`
- [server/routes/](server/routes/) — `members.js`, `chores.js`, `completions.js` handle their respective REST endpoints

### Frontend key files
- [client/src/App.jsx](client/src/App.jsx) — Root component; manages view state (calendar vs history) and settings panel
- [client/src/context/AppContext.jsx](client/src/context/AppContext.jsx) — Global context for members list, calendar ref, and refresh callbacks
- [client/src/api/index.js](client/src/api/index.js) — All API calls centralized here
- [client/src/components/CalendarView.jsx](client/src/components/CalendarView.jsx) — FullCalendar integration; fetches chore events by date range
- [client/src/components/ChoreForm.jsx](client/src/components/ChoreForm.jsx) — Create/edit form with recurrence options
- [client/src/components/ChorePopover.jsx](client/src/components/ChorePopover.jsx) — Click popover on calendar events for quick actions

### Database schema
Three tables in `server/chores.db`:
- **`members`** — Team members (id, name, created_at)
- **`chores`** — Chore definitions with recurrence rules (recurrence_type: `none|daily|weekly|monthly`; `recurrence_days_of_week` stored as JSON array; `recurrence_day_of_month` for monthly)
- **`completions`** — Tracks which chore occurrences are done; unique on `(chore_id, occurrence_date)`

### API endpoints
- `GET/POST/DELETE /api/members`
- `GET /api/chores?start=YYYY-MM-DD&end=YYYY-MM-DD` — Returns FullCalendar-formatted events
- `GET/POST/PUT/DELETE /api/chores/:id`
- `POST/DELETE /api/completions` — Mark/unmark completion
- `GET /api/completions/history` — Paginated completion history
- `GET /api/health`
