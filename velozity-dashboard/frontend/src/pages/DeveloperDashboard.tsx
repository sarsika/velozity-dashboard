import TaskList from "../components/TaskList";
import ActivityFeed from "../components/ActivityFeed";

// A developer only ever sees their own assigned tasks - TaskList already
// enforces this server-side (see task.controller.listTasks), so no
// projectId or extra filtering is needed here.
export default function DeveloperDashboard() {
  return (
    <div className="page">
      <h2>My Tasks</h2>
      <div className="two-col">
        <TaskList />
        <ActivityFeed />
      </div>
    </div>
  );
}
