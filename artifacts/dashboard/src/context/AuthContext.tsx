import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setUnauthorizedHandler } from "@workspace/api-client-react";

type UserInfo = {
  id: number;
  username: string;
  role: string;
};

type AuthContextType = {
  token: string | null;
  user: UserInfo | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

function decodeToken(token: string): UserInfo | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: payload.id, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true;
  }
}

function getValidToken(): string | null {
  const t = localStorage.getItem("auth_token");
  if (!t) return null;
  if (isTokenExpired(t)) {
    localStorage.removeItem("auth_token");
    return null;
  }
  return t;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getValidToken());
  const [user, setUser] = useState<UserInfo | null>(() => {
    const t = getValidToken();
    return t ? decodeToken(t) : null;
  });

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  const login = (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    setUser(decodeToken(newToken));
  };

  // Register auto-logout handler ke custom-fetch (dipanggil saat API return 401)
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, []);

  // Cek expiry tiap 60 detik, auto logout kalau expired
  useEffect(() => {
    const interval = setInterval(() => {
      const t = localStorage.getItem("auth_token");
      if (t && isTokenExpired(t)) {
        logout();
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
