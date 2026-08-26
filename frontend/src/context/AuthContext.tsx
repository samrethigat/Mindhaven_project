import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api } from "../lib/api";

export type UserRole = "candidate" | "counselor" | "parent" | "patient" | "admin";

export type User = {
  _id: string;
  role: UserRole;
  email: string;
  fullName?: string;
  photo?: string;
  phone?: string;
  candidateId?: string;
  counselorId?: string;
  parentId?: string;
  occupation?: string;
  relationshipToStudent?: string;
  alternatePhone?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, portal: "candidate" | "counselor" | "parent" | "patient") => Promise<User>;
  register: (data: any, portal: "candidate" | "counselor" | "parent" | "patient") => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role === "patient") u.role = "candidate";
        setUser(u);
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, portal: "candidate" | "counselor" | "parent" | "patient") => {
    let p: "candidate" | "counselor" | "parent" = "candidate";
    if (portal === "counselor") p = "counselor";
    else if (portal === "parent") p = "parent";

    try {
      const { data } = await api.post("/auth/login", { email, password, portal: p });
      if (data.user && data.user.role === "patient") data.user.role = "candidate";
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err: any) {
      // If backend responded with any HTTP error status (400, 401, 403, 404, 422, 500), propagate it
      if (err?.response?.data) {
        throw err;
      }

      // Seamless offline fallback only when backend server is completely unreachable
      const nameFromEmail = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const demoUser: User = {
        _id: `user_${Date.now()}`,
        role: p,
        email,
        fullName: nameFromEmail || "Student User",
        candidateId: p === "candidate" ? `CND-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        counselorId: p === "counselor" ? "CNS-1001" : undefined,
        parentId: p === "parent" ? "PRN-5001" : undefined,
        specialization: p === "counselor" ? "Student Mental Health Specialist" : undefined,
        preferredLanguage: p === "parent" ? "en" : "ta",
      };
      localStorage.setItem("accessToken", "token_" + Date.now());
      localStorage.setItem("user", JSON.stringify(demoUser));
      setUser(demoUser);
      return demoUser;
    }
  }, []);

  const register = useCallback(async (payload: any, portal: "candidate" | "counselor" | "parent" | "patient") => {
    let p: "candidate" | "counselor" | "parent" = "candidate";
    if (portal === "counselor") p = "counselor";
    else if (portal === "parent") p = "parent";

    const endpoint =
      p === "parent"
        ? "/auth/register/parent"
        : p === "counselor"
        ? "/auth/register/counselor"
        : "/auth/register/candidate";

    try {
      const { data } = await api.post(endpoint, { ...payload, role: p });
      if (data.user && data.user.role === "patient") data.user.role = "candidate";
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err: any) {
      // If backend responded with validation error or duplicate email error, propagate it
      if (err?.response?.data) {
        throw err;
      }

      const nameFromEmail =
        payload.fullName ||
        payload.email?.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
        "User";

      const demoUser: User = {
        _id: `user_${Date.now()}`,
        role: p,
        email: payload.email,
        fullName: nameFromEmail,
        candidateId: p === "candidate" ? `CND-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        counselorId: p === "counselor" ? "CNS-1001" : undefined,
        parentId: p === "parent" ? "PRN-5001" : undefined,
        ...payload,
        preferredLanguage: p === "parent" ? "en" : (payload.preferredLanguage || "ta"),
      };
      localStorage.setItem("accessToken", "token_" + Date.now());
      localStorage.setItem("user", JSON.stringify(demoUser));
      setUser(demoUser);
      return demoUser;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const endpoint =
        user?.role === "parent"
          ? "/parent/profile"
          : user?.role === "counselor"
          ? "/counselor/me"
          : "/candidate/me";
      const { data } = await api.get(endpoint);
      if (data.user && data.user.role === "patient") data.user.role = "candidate";
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch {}
  }, [user?.role]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
