import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import PMDashboard from "./pages/PMDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import ProjectDetail from "./pages/ProjectDetail";
import NotificationBell from "./components/NotificationBell";

// Redirects to /login if not authenticated, and away from routes the
// user's role isn't allowed to see. This is a UX nicety only - the real
// enforcement is server-side, so this component being bypassed changes
// nothing about what data the user can actually get.
function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles?: string[];
  children: JSX.Element;
}) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "PROJECT_MANAGER") return <Navigate to="/pm" replace />;
  return <Navigate to="/developer" replace />;
}

function Layout({ children }: { children: JSX.Element }) {
  const { user, logout } = useAuth();
  return (
    <div>
      <header className="topbar">
        <Link to="/" className="brand">
          Velozity
        </Link>
        <div className="topbar-right">
          {user && (
            <>
              <NotificationBell />
              <span className="muted">
                {user.name} ({user.role.replace("_", " ")})
              </span>
              <button onClick={logout}>Log out</button>
            </>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Layout>
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/admin"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/pm"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={["PROJECT_MANAGER"]}>
              <PMDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/developer"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={["DEVELOPER"]}>
              <DeveloperDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <Layout>
            <ProtectedRoute allowedRoles={["ADMIN", "PROJECT_MANAGER"]}>
              <ProjectDetail />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
