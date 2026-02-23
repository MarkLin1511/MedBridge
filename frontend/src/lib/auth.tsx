"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, UserData, SignupData } from "./api";

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("medbridge_token");
    if (stored) {
      setToken(stored);
      api.setToken(stored);
      api
        .me()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem("medbridge_token");
          api.setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("medbridge_token", data.access_token);
    api.setToken(data.access_token);
    router.push("/dashboard");
  }, [router]);

  const signup = useCallback(async (formData: SignupData) => {
    const data = await api.signup(formData);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("medbridge_token", data.access_token);
    api.setToken(data.access_token);
    router.push("/dashboard");
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("medbridge_token");
    api.setToken(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
