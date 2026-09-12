# Velozity Client Project Dashboard

Full-stack dashboard with role-based access (Admin / Project Manager / Developer),
a live WebSocket activity feed, and real-time notifications.

## Stack

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL, accessed through Prisma ORM
- **Real-time:** Socket.io
- **Background jobs:** node-cron
- **Auth:** JWT access token (in memory on the client) + HttpOnly refresh cookie

## Local setup (Docker preferred)

1. Start Postgres:
   ```bash
   docker compose up -d
   ```
2. Backend:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npx prisma migrate dev --name init
   npm run seed
   npm run dev
   ```
   Server runs on `http://localhost:5000`.
3. Frontend (new terminal):
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
   App runs on `http://localhost:5173`.

Seeded login (password for all: `Password123!`):

| Role | Email |
|---|---|
| Admin | admin@velozity.test |
| Project Manager | priya.pm@velozity.test |
| Project Manager | karthik.pm@velozity.test |
| Developer | ravi.dev@velozity.test |

## Database schema

See `backend/prisma/schema.prisma`. Relational design (not Mongo) because
Users, Projects, Tasks, ActivityLog and Notification all have clear
foreign-key relationships and the app constantly needs joins/filters
(e.g. "all overdue tasks for projects owned by PM X") that are awkward
in a document store.

Key indexes (all chosen because they match an actual query in the code,
not added speculatively):
- `Task(projectId, status)` — every project view filters by status
- `Task(assignedToId)` — developer dashboards filter by assignee
- `Task(priority)`, `Task(dueDate)` — sorting/filtering on both
- `ActivityLog(projectId, createdAt)` — feed queries are always "latest N for project X"
- `Project(createdById)` — PM dashboards filter to owned projects
- `Notification(userId, isRead)` — badge count query

## Architectural decisions

- **WebSocket library — Socket.io, not raw WebSocket.** Needed room-based
  broadcasting (per-project rooms, per-user rooms) and auto-reconnect
  handling out of the box; raw `ws` would mean rebuilding both.
- **Background job — node-cron, not Bull.** The overdue-check job has no
  per-task data, no retries, nothing to queue — it's a single sweep query
  on a timer. Bull would need Redis running just for this one job. If a
  later feature needed per-task delayed jobs (e.g. "remind 1 hour before
  due"), Bull would be the right call then.
- **Refresh token in an HttpOnly cookie, access token in memory only.**
  The access token never touches localStorage, so it isn't readable by
  injected JS. The refresh cookie is scoped to `/api/auth` only.
- **Role enforcement lives in the Express middleware + controller logic,
  not the frontend.** The frontend hides buttons a role shouldn't see,
  but every single check that actually matters (`requireRole`,
  `assertCanAccessProject`, the assignee check in
  `updateTaskStatus`) runs again on the server, keyed off the verified
  JWT payload — not anything the client sends.
- **Activity log is a separate table, not derived from `Task.status`.**
  `Task` only holds the current status; `ActivityLog` is the append-only
  history, which is what both the live feed and the catch-up-on-reconnect
  fetch read from.

## Known limitations

- No user-management UI (creating new users is seed-only) — the spec
  didn't call for it and it wasn't worth the extra screens.
- `ProjectDetail`'s "assign to" field takes a raw user ID rather than a
  searchable dropdown — a `/api/users` endpoint would be the next thing
  to add.
- No automated test suite yet (Jest/Supertest would be the natural next
  addition for the controllers).
- Socket reconnect after a dropped connection re-fetches the catch-up
  feed but doesn't re-show a "reconnecting..." indicator in the UI.

## Explanation (for the submission form)

The hardest part was the real-time, role-filtered activity feed. A single
`io.emit()` broadcast would leak cross-project data to everyone connected,
so activity had to be scoped to Socket.io rooms (`project:<id>`) that
clients join only when they're actually viewing that project, with a
separate `user:<id>` room for personal notifications. The trickier piece
was the "catch up after being offline" requirement: the feed can't rely on
whatever's sitting in a client-side array, because a page refresh or a
dropped connection wipes that. So every feed mount does a DB read for the
last 20 `ActivityLog` rows first, *then* subscribes to the live socket
stream — meaning the feed is correct whether the user has been online the
whole time or just reconnected after an hour, and it survives a server
restart too, since nothing about feed history lives in memory.

One thing I'd do differently with more time: move filtering logic (role
scoping, project ownership) out of each controller and into a shared
query-builder or a Prisma middleware layer. Right now the same
"developer only sees their own tasks" check is written separately in
`listTasks`, `getRecentActivity`, and `updateTaskStatus` — it's correct
in all three, but duplicated logic like that is exactly the kind of
thing that drifts out of sync after a few more feature additions.
