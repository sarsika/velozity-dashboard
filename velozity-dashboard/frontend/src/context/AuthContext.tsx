import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import api, { API_BASE, setAccessToken } from "../api/axios";
import { connectSocket, disconnectSocket } from "../socket";

type Role = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load there's no access token in memory (page refresh wipes
  // it), so try the refresh cookie once before deciding the user is logged out.
  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(res.data.accessToken);
        const me = await api.get("/auth/me");
        setUser(me.data.user);
        connectSocket();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    connectSocket();
  }

  async function logout() {
    await api.post("/auth/logout");
    setAccessToken(null);
    setUser(null);
    disconnectSocket();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
