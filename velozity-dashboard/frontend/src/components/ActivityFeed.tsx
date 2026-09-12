import { useEffect, useState } from "react";
import api from "../api/axios";
import { getSocket } from "../socket";

interface ActivityItem {
  id: string;
  projectId: string;
  taskTitle: string;
  userName: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// projectId is optional: pass it when viewing one project (feed is
// filtered + the socket only watches that room); omit it to show the
// role-scoped global feed (admin/PM overview).
export default function ActivityFeed({ projectId }: { projectId?: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let active = true;

    // 1. Catch-up: always pulled from the DB, so this works correctly
    // even if the socket was disconnected for a while (or never connected).
    api
      .get("/activity", { params: projectId ? { projectId } : {} })
      .then((res) => {
        if (active) setItems(res.data.activity);
      });

    // 2. Live updates from here on.
    const socket = getSocket();
    if (socket && projectId) socket.emit("project:watch", projectId);

    function onActivity(evt: ActivityItem) {
      if (projectId && evt.projectId !== projectId) return;
      setItems((prev) => [evt, ...prev].slice(0, 20));
    }

    socket?.on("activity:new", onActivity);

    return () => {
      active = false;
      socket?.off("activity:new", onActivity);
      if (socket && projectId) socket.emit("project:unwatch", projectId);
    };
  }, [projectId]);

  return (
    <div className="activity-feed">
      <h3>Live Activity</h3>
      {items.length === 0 && <p className="muted">No activity yet.</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.userName}</strong> moved{" "}
            <em>"{item.taskTitle}"</em> {item.fromStatus ? `${item.fromStatus} → ` : ""}
            {item.toStatus} · <span className="muted">{timeAgo(item.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
