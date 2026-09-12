# 🚀 Velozity – Real-Time Client Project Dashboard

A full-stack client project dashboard built with role-based access, task management, real-time activity updates, and notifications.

## 🌐 Live Application

(https://velozity-dashboard-xi.vercel.app/login)

## ✨ Features

* JWT-based authentication
* Role-based access for Admin, Project Manager, and Developer
* API-level authorization
* Project and task management
* Task assignment and status updates
* Priority and due-date tracking
* Real-time activity feed using Socket.io
* Real-time notifications
* Database-backed activity history
* Missed activity recovery after reconnecting
* Task filtering by status, priority, and due date
* Automatic overdue task handling
* PostgreSQL database
* Seed data for testing
* Structured API error handling

## 👥 User Roles

### Admin

* Full access to projects, users, tasks, and activity
* View activity across all projects

### Project Manager

* Manage their own projects and tasks
* Assign tasks to developers
* View team activity
* Cannot access other Project Managers' projects

### Developer

* View assigned tasks
* Update task status
* Cannot access other developers' tasks

## ⚡ Real-Time Activity

The activity feed uses Socket.io to show task updates instantly without refreshing the page.

When a task is updated, the change is saved in the database and sent to users viewing the relevant project.

If a user goes offline, recent activity is loaded from the database when they reconnect.

## 🔔 Notifications

* Developers receive notifications when tasks are assigned to them.
* Project Managers receive notifications when a task moves to In Review.
* Notifications are stored in the database.
* Unread notification count updates in real time.

## 🔐 Security

Role-based permissions are enforced at the API level, not only in the frontend.

This prevents users from accessing restricted data through direct API requests.

## 🔎 Task Filters

Tasks can be filtered by:

* Status
* Priority
* Due date

Filters are maintained through URL query parameters for easy sharing and bookmarking.

## ⏰ Overdue Tasks

A backend scheduled job checks task due dates and identifies overdue tasks automatically.

## 🗄️ Database

The application uses PostgreSQL with Prisma.

Main entities include:

* Users
* Clients
* Projects
* Tasks
* Activity Logs
* Notifications

Foreign keys and indexes are used to maintain relationships and improve database queries.

## 📸 Screenshots

### Login Page

<img width="1536" height="1024" alt="Login Page" src="https://github.com/user-attachments/assets/3d2b4e93-fddd-4202-93aa-1682635eff79" />



## 🧠 Hardest Part

The hardest part was implementing the real-time activity feed.

I used Socket.io to send updates only to users viewing the relevant project instead of using one global broadcast. I also added a database-backed catch-up mechanism so users who were offline could retrieve missed updates when they reconnect.

## 🛠️ Tech Stack

**Frontend:** React, TypeScript

**Backend:** Node.js, Express, Socket.io

**Database:** PostgreSQL, Prisma

**Authentication:** JWT

## 🚀 Deployment

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** Neon PostgreSQL

## 🌱 Seed Data

The project includes sample data for testing different roles and features:

* 1 Admin
* 2 Project Managers
* 4 Developers
* Multiple projects and tasks
* Different task statuses and priorities
* Overdue tasks
* Activity logs

## ▶️ Run Locally

```bash
git clone <your-repository-url>
cd <project-folder>
npm install
npm run dev
```



## 📌 Key Highlights

This project demonstrates practical experience in:

* Full-stack development
* React and TypeScript
* Node.js REST APIs
* JWT authentication
* Role-Based Access Control
* PostgreSQL and Prisma
* Socket.io and real-time communication
* Background jobs
* API validation and error handling
* Deployment

## 👩‍💻 Author

**Sarsika Sri K**

