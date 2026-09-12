import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  isOverdue: boolean;
  assignedTo?: { id: string; name: string } | null;
  project?: { id: string; name: string };
}

const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

// projectId narrows the list to one project (used on ProjectDetail).
// Filters live in the URL so a filtered view is a link you can copy/paste.
export default function TaskList({ projectId }: { projectId?: string }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (projectId) params.projectId = projectId;
    if (status) params.status = status;
    if (priority) params.priority = priority;

    api
      .get("/tasks", { params })
      .then((res) => setTasks(res.data.tasks))
      .finally(() => setLoading(false));
  }, [projectId, status, priority]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  async function changeStatus(taskId: string, newStatus: string) {
    // Optimistic update so the UI feels instant; the real-time feed
    // update for everyone else still arrives via the socket broadcast.
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch {
      // roll back on failure
      api.get("/tasks", { params: projectId ? { projectId } : {} }).then((res) =>
        setTasks(res.data.tasks)
      );
    }
  }

  const canReassignStatus = user?.role !== undefined; // all roles may update, ownership enforced server-side

  return (
    <div className="task-list">
      <div className="filters">
        <select value={status} onChange={(e) => updateFilter("status", e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        <select value={priority} onChange={(e) => updateFilter("priority", e.target.value)}>
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {loading && <p className="muted">Loading tasks...</p>}

      <table>
        <thead>
          <tr>
            <th>Title</th>
            {!projectId && <th>Project</th>}
            <th>Assignee</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className={task.isOverdue ? "overdue-row" : ""}>
              <td>{task.title}</td>
              {!projectId && <td>{task.project?.name}</td>}
              <td>{task.assignedTo?.name || "-"}</td>
              <td>{task.priority}</td>
              <td>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                {task.isOverdue && <span className="overdue-tag">Overdue</span>}
              </td>
              <td>
                {canReassignStatus ? (
                  <select
                    value={task.status}
                    onChange={(e) => changeStatus(task.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                ) : (
                  task.status
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && tasks.length === 0 && <p className="muted">No tasks found.</p>}
    </div>
  );
}
