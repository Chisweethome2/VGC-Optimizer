import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { customFetch } from "@workspace/api-client-react";

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customFetch<{ id: number; email: string }>("/api/auth/me")
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await customFetch<{ id: number; email: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        responseType: "json",
      });
      setUser(data);
      return {};
    } catch (err: any) {
      return { error: err?.data?.error ?? "Login failed" };
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const data = await customFetch<{ id: number; email: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        responseType: "json",
      });
      setUser(data);
      return {};
    } catch (err: any) {
      return { error: err?.data?.error ?? "Registration failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    await customFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
