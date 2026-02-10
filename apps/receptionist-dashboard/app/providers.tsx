'use client';

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Briefcase, CalendarDays, Bot, Megaphone, Bell,
  MessageCircle, Settings, Search, Sun, Moon, Menu, LogOut, Dumbbell, X, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { API_ENDPOINTS, DEFAULT_ADMIN_EMAIL } from './constants';
import { getInitials } from '@/lib/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
  },
});

interface User { id: number; email: string; full_name: string; role: string; team_id: number | null; }
interface AuthContextType { user: User | null; token: string | null; isAuthenticated: boolean; isLoading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void; hasPermission: (permission: string) => boolean; }

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

function AuthProviderComponent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      fetch(API_ENDPOINTS.AUTH.ME, { headers: { Authorization: `Bearer ${storedToken}` } })
        .then(res => { if (res.ok) { res.json().then(data => { setUser(data); setToken(storedToken); }); } else { localStorage.removeItem("token"); } })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setIsLoading(false));
    } else { setIsLoading(false); }
  }, []);

  const login = async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formData });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ detail: "Login failed" }))).detail || "Login failed");
    const data = await res.json();
    setUser(data.user);
    setToken(data.access_token);
    localStorage.setItem("token", data.access_token);
  };

  const logout = () => { setUser(null); setToken(null); localStorage.removeItem("token"); router.push("/login"); };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const rolePermissions: Record<string, string[]> = {
      super_admin: ["*"], admin: ["edit_users", "manage_clients", "view_reports", "manage_campaigns", "manage_settings", "access_ai"],
      manager: ["manage_clients", "view_reports", "manage_campaigns", "access_ai"], staff: ["manage_clients"],
    };
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes("*") || permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}



const NAV_ITEMS = [
  { id: "dashboard", label: "Panel de Control", icon: LayoutDashboard, path: "/" },
  { id: "crm", label: "CRM", icon: Briefcase, path: "/crm" },
  { id: "schedule", label: "Citas", icon: CalendarDays, path: "/schedule" },
  { id: "ai-agent", label: "Agente IA", icon: Bot, path: "/ai-agent" },
  { id: "campaigns", label: "Campañas", icon: Megaphone, path: "/campaigns" },
  { id: "reminders", label: "Recordatorios", icon: Bell, path: "/reminders" },
  { id: "chats", label: "Chats", icon: MessageCircle, path: "/chats" },
];

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-dark-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/30"><Dumbbell size={20} /></div>
            <div><h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Global Fit</h1><p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p></div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <Separator className="mx-4" />
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.path || (item.path !== "/" && pathname?.startsWith(item.path));
            return (
              <Link key={item.id} href={item.path} onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white"}`}>
                <item.icon size={20} className={isActive ? "text-white" : "text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Separator className="mx-4" />
        <div className="p-4">
          <Link href="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${pathname === "/settings" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white"}`}>
            <Settings size={20} /><span>Configuracion</span>
          </Link>
        </div>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
    </>
  );
}

function TopBar({ isDarkMode, toggleTheme, toggleSidebar }: { isDarkMode: boolean; toggleTheme: () => void; toggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.NOTIFICATIONS + '?limit=10');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (ids: number[]) => {
    try {
      await fetch(API_ENDPOINTS.NOTIFICATIONS, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, markAsRead: true }),
      });
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - ids.length));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)} h`;
    return `Hace ${Math.floor(diff / 1440)} d`;
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; subtext: string }> = {
      NEW_CLIENT: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-400', subtext: 'text-blue-700 dark:text-blue-300' },
      APPOINTMENT_SCHEDULED: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-900 dark:text-green-400', subtext: 'text-green-700 dark:text-green-300' },
      APPOINTMENT_CANCELLED: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-900 dark:text-red-400', subtext: 'text-red-700 dark:text-red-300' },
      PAYMENT_DUE: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-900 dark:text-yellow-400', subtext: 'text-yellow-700 dark:text-yellow-300' },
      CAMPAIGN_COMPLETED: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-900 dark:text-green-400', subtext: 'text-green-700 dark:text-green-300' },
      REMINDER_PENDING: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-900 dark:text-yellow-400', subtext: 'text-yellow-700 dark:text-yellow-300' },
      MESSAGE_RECEIVED: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-900 dark:text-purple-400', subtext: 'text-purple-700 dark:text-purple-300' },
      GENERAL: { bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-200 dark:border-gray-800', text: 'text-gray-900 dark:text-gray-400', subtext: 'text-gray-700 dark:text-gray-300' },
    };
    return colors[type] || colors.GENERAL;
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-dark-950/80 backdrop-blur-sm transition-colors duration-200 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden -ml-2"><Menu size={20} /></Button>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input type="text" placeholder="Buscar..." className="pl-10 bg-gray-100 dark:bg-dark-800 border-none rounded-full text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</Button>
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative" onClick={() => { setShowNotifications(!showNotifications); if (showNotifications) markAsRead(notifications.filter(n => !n.isRead).map(n => n.id)); }}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full ring-2 ring-white dark:ring-dark-950 text-[10px] text-white flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </Button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h3 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h3></div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay notificaciones</div>
                ) : (
                  <div className="p-4 space-y-3">
                    {notifications.map((notif) => {
                      const colors = getNotificationColor(notif.type);
                      return (
                        <div key={notif.id} onClick={() => notif.actionUrl && (window.location.href = notif.actionUrl)} className={`p-3 ${colors.bg} rounded-lg border ${colors.border} ${notif.actionUrl ? 'cursor-pointer hover:opacity-80' : ''}`}>
                          <p className={`font-medium text-sm ${colors.text}`}>{notif.title}</p>
                          <p className={`text-xs ${colors.subtext} mt-1`}>{formatTime(notif.createdAt)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700"><button onClick={() => markAsRead(notifications.filter(n => !n.isRead).map(n => n.id))} className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:underline">Marcar todas como leidas</button></div>
            </div>
          )}
        </div>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8"><AvatarImage /><AvatarFallback className="bg-primary-500 text-white text-sm">{user ? getInitials(user.full_name) : "A"}</AvatarFallback></Avatar>
              <div className="hidden md:block text-left"><p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user?.full_name || "Administrator"}</p><p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">{user?.role?.replace("_", " ") || "Admin"}</p></div>
              <ChevronDown size={14} className="text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/settings"><Settings size={16} className="mr-2" />Configuracion</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 dark:text-red-400"><LogOut size={16} className="mr-2" />Cerrar Sesion</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => { if (localStorage.getItem("token")) router.push("/"); }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setIsLoading(true);
    try { await login(email, password); router.push(callbackUrl); }
    catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-500 text-white mb-4 shadow-lg shadow-primary-500/30"><Dumbbell size={24} /></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Fit</h1><p className="text-gray-500 dark:text-gray-400 mt-1">Admin Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@globalfit.com" autoComplete="off" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contrasena</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" autoComplete="current-password" required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Iniciando...</>
            ) : (
              "Iniciar Sesion"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderComponent>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProviderComponent>
    </QueryClientProvider>
  );
}

export { AuthProviderComponent as AuthProvider, LoginPage, Sidebar, TopBar };
