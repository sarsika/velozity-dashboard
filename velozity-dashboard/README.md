# Velozity – Real-Time Client Project Dashboard

A full-stack client project dashboard built with role-based access, task management, real-time activity updates, and notifications.

## 🌐 Live Application
https://velozity-dashboard-xi.vercel.app/login

## ✨ Features
- JWT-based authentication
- Role-based access for Admin, Project Manager, and Developer
- API-level authorization
- Project and task management
- Task assignment and status updates
- Priority and due-date tracking
- Real-time activity feed using Socket.io
- Real-time notifications
- Database-backed activity history
- Missed activity recovery after reconnecting
- Task filtering by status, priority, and due date
- Automatic overdue task handling
- PostgreSQL database
- Seed data for testing
- Structured API error handling

## 👥 User Roles

**Admin**
- Full access to projects, users, tasks, and activity
- View activity across all projects

**Project Manager**
- Manage their own projects and tasks
- Assign tasks to developers
- View team activity
- Cannot access other Project Managers' projects

**Developer**
- View assigned tasks
- Update task status
- Cannot access other developers' tasks

All of the above is enforced in the backend middleware, not just hidden in the UI — a modified token can't be used to reach another role's data.

## ⚡ Real-Time Activity
The activity feed uses Socket.io to show task updates instantly without refreshing the page.

When a task is updated, the change is saved in the database and sent to users viewing the relevant project.

If a user goes offline, recent activity is loaded from the database when they reconnect.

## 🔔 Notifications
- Developers receive notifications when tasks are assigned to them
- Project Managers receive notifications when a task moves to In Review
- Notifications are stored in the database
- Unread notification count updates in real time

## 🔐 Security
Role-based permissions are enforced at the API level, not only in the frontend.

This prevents users from accessing restricted data through direct API requests.

## 🔎 Task Filters
Tasks can be filtered by:
- Status
- Priority
- Due date

Filters are maintained through URL query parameters for easy sharing and bookmarking.

## ⏰ Overdue Tasks
A backend scheduled job (node-cron) checks task due dates and identifies overdue tasks automatically.

## 🗄️ Database
The application uses PostgreSQL with Prisma.

Main entities: Users, Clients, Projects, Tasks, Activity Logs, Notifications.

Relationships:
- A Project belongs to the User (PM/Admin) who created it
- A Task belongs to a Project and, optionally, an assigned Developer
- Every task status change writes a row to Activity Logs (who changed it, from-status, to-status, when) — this is the source of truth for the feed, not derived from the Task table
- A Notification belongs to a User and optionally a Task

Foreign keys and indexes are used to maintain relationships and improve query performance. Indexes are set on `Task.status`, `Task.priority`, `Task.dueDate`, `Task.assignedToId`, and a composite `Task.projectId + status`, since these are the columns the dashboards and filters query most often.

## 🏗️ Architectural Decisions

**WebSocket library: Socket.io.**
Chosen over a raw WebSocket implementation for built-in room support — each client joins rooms scoped to their role and visible projects, so the server only ever emits events into rooms that should receive them, and reconnection handling comes for free on the client side.

**Background jobs: node-cron.**
The overdue-task sweep is one lightweight recurring job with no need for retries, distributed workers, or persisted queue state, so node-cron was used instead of Bull to avoid running a separate Redis instance for a job this simple.

**Token storage: HttpOnly cookie for the refresh token, in-memory for the access token.**
The refresh token is never exposed to JavaScript, which closes off the main XSS-based token theft path. The short-lived access token lives in memory on the client and is reissued through a silent refresh call.

## 📸 Screenshots
**Login Page**

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/abc1b60a-2f02-47ae-b778-a2a01d0f81a3" />


## 🧠 Hardest Part

The hardest problem was making the real-time activity feed show each user only what their role allows, without falling back to client-side filtering, since that isn't a real security boundary. I solved it using Socket.io rooms — each connected client joins rooms scoped to their role and the projects they're allowed to see (all projects for Admin, their own projects for a PM, their assigned tasks for a Developer), so the server only ever emits an event into the rooms that should receive it. Access checks happen before a socket is allowed to join a room, matching the same middleware used on the REST routes.

The trickier part was the offline-user case. Sockets don't buffer anything — if you're disconnected, you simply miss events. Since the feed can't rely on memory (that's lost on a server restart too), every status change is written to an ActivityLog table first, and a reconnecting client pulls its last 20 relevant entries from the database instead of the socket.

If I did one thing differently, I'd replace the flat "last 20" catch-up with a per-user last-seen cursor, so recovery scales properly as activity volume grows instead of being a fixed window.

## 🛠️ Tech Stack
- Frontend: React, TypeScript
- Backend: Node.js, Express, Socket.io
- Database: PostgreSQL, Prisma
- Auth: JWT
- Background jobs: node-cron

## 🚀 Deployment
- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

## 🌱 Seed Data
The project includes sample data for testing different roles and features:
- 1 Admin
- 2 Project Managers
- 4 Developers
- 3+ projects, each with 5+ tasks in various statuses
- At least 2 tasks already in an overdue state
- Pre-existing activity log entries, so the feed isn't empty on first load

## ▶️ Run Locally

```bash
git clone https://github.com/sarsika/velozity-dashboard.git
cd velozity-dashboard

# backend
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run seed
npm run dev

# frontend, new terminal
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

**With Docker (database only, preferred for quick setup):**
```bash
docker compose up -d
```
Then run the backend/frontend steps above against it.

## ⚠️ Known Limitations
- No email delivery for notifications — in-app only for now
- No automated test suite yet
- Missed-activity catch-up is a flat "last 20" rather than a per-user cursor, so it doesn't scale cleanly with high activity volume
- Single-region deployment, no caching layer for dashboard aggregates

## 📌 Key Highlights
This project demonstrates practical experience in:
- Full-stack development
- React and TypeScript
- Node.js REST APIs
- JWT authentication
- Role-Based Access Control
- PostgreSQL and Prisma
- Socket.io and real-time communication
- Background jobs
- API validation and error handling
- Deployment

## 👩‍💻 Author
Sarsika Sri K
