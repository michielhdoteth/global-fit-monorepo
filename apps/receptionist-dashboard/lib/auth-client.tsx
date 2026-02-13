"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createAuthClient } from "@neondatabase/auth/next";
import type { User, Session } from "./neon-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

// Create the Neon Auth client for browser-side operations (v0.2 SDK)
// The client automatically reads from NEXT_PUBLIC_NEON_AUTH_URL environment variable
export const authClient = createAuthClient();

interface AuthContextType {
  user: (User & { role?: string; team_id?: number | null }) | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

function AuthProviderComponent({ children }: AuthProviderProps) {
  const [user, setUser] = useState<(User & { role?: string; team_id?: number | null }) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Fetch session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await authClient.getSession();
        if (data?.session) {
          setSession(data.session as any);
          // Fetch additional user data from our database
          const response = await fetch("/api/auth/me");
          if (response.ok) {
            const userData = await response.json();
            setUser({ ...(data as any).session.user, ...userData });
          } else {
            setUser((data as any).session.user);
          }
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error("[AUTH] Failed to fetch session:", error);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  // Redirect to login if unauthenticated on protected routes
  useEffect(() => {
    if (!isLoading && !session && pathname !== "/login") {
      // Protected routes
      const protectedRoutes = ["/", "/dashboard", "/crm", "/schedule", "/ai-agent", "/campaigns", "/reminders", "/chats", "/settings"];
      const isProtected = protectedRoutes.some(route => pathname?.startsWith(route));
      if (isProtected) {
        router.push("/login");
      }
    }
  }, [session, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    setError("");
    console.log("[AUTH DEBUG] Login attempt for:", email.toLowerCase().trim());
    try {
      const result = await (authClient as any).signIn.email({
        email: email.toLowerCase().trim(),
        password: password,
      });

      console.log("[AUTH DEBUG] Result from signIn:", JSON.stringify({ error: result.error, data: !!result.data }, null, 2));

      if (result.error) {
        const errorMessage = result.error.message || "Login failed";
        console.error("[AUTH DEBUG] Error details:", result.error);
        setError(errorMessage);
        throw new Error(errorMessage);
      } else {
        // Success: cookies are set. Fetch the current session from the server.
        const { data, error } = await authClient.getSession();
        if (data?.session) {
          setSession(data.session);
          // Fetch additional user data from our database
          const response = await fetch("/api/auth/me");
          if (response.ok) {
            const userData = await response.json();
            setUser({ ...result.data.user, ...userData });
          } else {
            setUser(result.data.user);
          }
        } else {
          setUser(null);
          setSession(null);
        }
        router.push("/");
      }
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during login";
      setError(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await (authClient as any).signOut();
      setUser(null);
      setSession(null);
      router.push("/login");
    } catch (error) {
      console.error("[AUTH] Logout error:", error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const rolePermissions: Record<string, string[]> = {
      super_admin: ["*"],
      admin: ["edit_users", "manage_clients", "view_reports", "manage_campaigns", "manage_settings", "access_ai"],
      manager: ["manage_clients", "view_reports", "manage_campaigns", "access_ai"],
      staff: ["manage_clients"]
    };
    const userRole = user.role || "staff";
    const permissions = rolePermissions[userRole] || [];
    const hasAllPermission = permissions.includes("*");
    const hasSpecificPermission = permissions.includes(permission);
    return hasAllPermission || hasSpecificPermission;
  };

  const contextValue: AuthContextType = {
    user,
    session,
    isAuthenticated: !!session,
    isLoading,
    login,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthProviderComponent as AuthProvider };
