"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "./PageLayout";
import {
  Smartphone,
  Activity,
  AlertTriangle,
  Users,
  UserCheck,
  Clock,
  Send,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalClientsTrend: number;
  activeClientsTrend: number;
  pendingAppointments: number;
  todayAppointments: number;
  activeChats: number;
  pendingReminders: number;
  activeCampaigns: number;
  messagesTotal: number;
  deliveryRate: number;
  checkInsToday: number;
  botStatus: {
    connected: boolean;
    botName: string;
    lastHeartbeat: string | null;
  };
}

interface TrendData {
  value: string;
  isPositive: boolean;
}


function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to load stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-ES").format(num);
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      </Card>
    );
  }

  const getTrendData = (trendValue: number): TrendData => {
    const formattedValue = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
    return {
      value: formattedValue,
      isPositive: trendValue >= 0
    };
  };

  const dashboardStats = [
    {
      id: "total-socios",
      label: "Total Socios",
      value: formatNumber(stats?.totalClients || 0),
      subValue: "Contactos",
      trend: getTrendData(stats?.totalClientsTrend || 0),
      icon: Users,
      colorClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      id: "active-members",
      label: "Membresias Activas",
      value: formatNumber(stats?.activeClients || 0),
      subValue: "Activos",
      trend: getTrendData(stats?.activeClientsTrend || 0),
      icon: UserCheck,
      colorClass: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      id: "expiring",
      label: "Citas Hoy",
      value: formatNumber(stats?.todayAppointments || 0),
      subValue: "Proximas",
      icon: Clock,
      colorClass: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
      alert: (stats?.todayAppointments || 0) > 0,
    },
    {
      id: "messages",
      label: "Mensajes",
      value: formatNumber(stats?.messagesTotal || 0),
      subValue: "Total",
      icon: Send,
      colorClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {dashboardStats.map((stat) => (
          <Card
            key={stat.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${stat.colorClass}`}>
                  <stat.icon size={24} />
                </div>
                {stat.alert && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Action
                  </Badge>
                )}
                {!stat.alert && stat.trend && (
                  <Badge
                    variant={stat.trend.isPositive ? "success" : "secondary"}
                    className={stat.trend.isPositive ? "bg-green-100 text-green-600" : ""}
                  >
                    {stat.trend.value}
                  </Badge>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{stat.subValue}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-4xl font-bold text-green-500 mb-2">
            {stats?.deliveryRate || 0}%
          </h3>
          <p className="text-sm text-muted-foreground">Tasa de Entrega</p>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {formatNumber(stats?.activeCampaigns || 0)}
          </h3>
          <p className="text-sm text-muted-foreground">Campañas Activas</p>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {formatNumber(stats?.activeChats || 0)}
          </h3>
          <p className="text-sm text-muted-foreground">Chats Activos</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Smartphone className="text-green-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    WhatsApp Bot
                  </h3>
                  <p className="text-xs text-muted-foreground">Estado del asistente IA</p>
                </div>
              </div>
              <Badge variant={stats?.botStatus?.connected ? "success" : "secondary"}>
                {stats?.botStatus?.connected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {stats?.botStatus?.botName || "Global Gym Bot"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chats activos: {formatNumber(stats?.activeChats || 0)}
                  </p>
                </div>
                <Button size="sm" onClick={() => router.push("/chats")}>
                  Ver Chats
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 font-mono text-xs space-y-1">
                <p className={stats?.botStatus?.connected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  Bot: {stats?.botStatus?.connected ? "Activo" : "Inactivo"}
                </p>
                <p>Chats: {formatNumber(stats?.activeChats || 0)}</p>
                <p>Mensajes: {formatNumber(stats?.messagesTotal || 0)}</p>
                <p>Delivery: {stats?.deliveryRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Activity className="text-primary-500" size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Resumen del Dia
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats?.checkInsToday || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Check-ins Hoy</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats?.pendingReminders || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats?.pendingAppointments || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Citas Pendientes</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats?.activeClients || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Socios Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PageLayout title="Panel de Control" description="Global Gym - Dashboard CRM">
      <DashboardContent />
    </PageLayout>
  );
}
