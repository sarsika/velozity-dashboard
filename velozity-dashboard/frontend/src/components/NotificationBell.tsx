import { useEffect, useState } from "react";
import api from "../api/axios";
import { getSocket } from "../socket";

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    api.get("/notifications").then((res) => setNotifications(res.data.notifications));

    const socket = getSocket();
    function onNew(notif: Notification) {
      // Unread count updates the instant this fires - no polling involved.
      setNotifications((prev) => [notif, ...prev]);
    }
    socket?.on("notification:new", onNew);
    return () => {
      socket?.off("notification:new", onNew);
    };
  }, []);

  async function markOneRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="notification-bell">
      <button onClick={() => setOpen((o) => !o)}>
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="dropdown">
          <div className="dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && <button onClick={markAllRead}>Mark all read</button>}
          </div>
          {notifications.length === 0 && <p className="muted">No notifications</p>}
          <ul>
            {notifications.map((n) => (
              <li
                key={n.id}
                className={n.isRead ? "read" : "unread"}
                onClick={() => !n.isRead && markOneRead(n.id)}
              >
                {n.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
