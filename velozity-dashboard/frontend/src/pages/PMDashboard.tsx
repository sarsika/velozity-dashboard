import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ActivityFeed from "../components/ActivityFeed";

interface ProjectSummary {
  id: string;
  name: string;
  clientName: string;
  taskCount: number;
}

export default function PMDashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [creating, setCreating] = useState(false);

  function loadDashboard() {
    api.get("/dashboard/pm").then((res) => setProjects(res.data.projectsSummary));
  }

  useEffect(loadDashboard, []);

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!name || !clientName) return;
    setCreating(true);
    try {
      await api.post("/projects", { name, clientName });
      setName("");
      setClientName("");
      loadDashboard();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <h2>My Projects</h2>

      <form className="inline-form" onSubmit={handleCreateProject}>
        <input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Client name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
        <button disabled={creating}>{creating ? "Creating..." : "New project"}</button>
      </form>

      <div className="project-grid">
        {projects.map((p) => (
          <Link to={`/projects/${p.id}`} key={p.id} className="project-card">
            <h4>{p.name}</h4>
            <p className="muted">{p.clientName}</p>
            <p className="muted small">{p.taskCount} tasks</p>
          </Link>
        ))}
        {projects.length === 0 && <p className="muted">No projects yet - create one above.</p>}
      </div>

      <ActivityFeed />
    </div>
  );
}
