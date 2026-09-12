import { useEffect, useState } from "react";
import api from "../api/axios";
import ActivityFeed from "../components/ActivityFeed";
import TaskList from "../components/TaskList";

interface Summary {
  totalProjects: number;
  totalTasks: number;
  overdueTaskCount: number;
  activeUsersOnline: number;
  tasksByStatus: { status: string; count: number }[];
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get("/dashboard/admin").then((res) => setSummary(res.data));
    // Refresh the online-user count periodically - presence itself is
    // real-time server-side, this just re-pulls the snapshot number.
    const interval = setInterval(() => {
      api.get("/dashboard/admin").then((res) => setSummary(res.data));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <h2>Admin Overview</h2>

      {summary && (
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-number">{summary.totalProjects}</span>
            <span className="stat-label">Projects</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{summary.totalTasks}</span>
            <span className="stat-label">Tasks</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{summary.overdueTaskCount}</span>
            <span className="stat-label">Overdue</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{summary.activeUsersOnline}</span>
            <span className="stat-label">Online now</span>
          </div>
        </div>
      )}

      <div className="two-col">
        <TaskList />
        <ActivityFeed />
      </div>
    </div>
  );
}
