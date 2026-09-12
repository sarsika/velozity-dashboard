import { useEffect, useState, FormEvent } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import TaskList from "../components/TaskList";
import ActivityFeed from "../components/ActivityFeed";

interface Member {
  id: string;
  name: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [projectName, setProjectName] = useState("");
  const [title, setTitle] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  // In a bigger app this would come from a /users?role=DEVELOPER endpoint;
  // kept minimal here since the assignment doesn't call for user management UI.
  const [members] = useState<Member[]>([]);

  useEffect(() => {
    if (!id) return;
    api.get(`/projects/${id}`).then((res) => setProjectName(res.data.project.name));
  }, [id]);

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    if (!title || !id) return;
    setCreating(true);
    try {
      await api.post("/tasks", {
        projectId: id,
        title,
        assignedToId: assignedToId || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      setTitle("");
      setAssignedToId("");
      setDueDate("");
      window.location.reload(); // simplest way to refresh the task list below
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <h2>{projectName || "Project"}</h2>

      <form className="inline-form" onSubmit={handleCreateTask}>
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          placeholder="Assignee user ID (optional)"
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button disabled={creating}>{creating ? "Adding..." : "Add task"}</button>
      </form>

      <div className="two-col">
        <TaskList projectId={id} />
        <ActivityFeed projectId={id} />
      </div>
    </div>
  );
}
