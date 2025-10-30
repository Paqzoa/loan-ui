"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import config from "./config";
import toast from "react-hot-toast";

// Types
interface User { id: number; username: string; role?: string; }
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Universal user detector (refreshed on mount and after login)
  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.api.baseUrl}/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => { refreshUser(); }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${config.api.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        await refreshUser(); // Always recheck after login
        toast.success("Welcome back!");
        router.push("/dashboard");
        return true;
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.detail || "Login failed");
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch(`${config.api.baseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      toast.success("Logged out!");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use in components
export const useAuth = () => useContext(AuthContext);