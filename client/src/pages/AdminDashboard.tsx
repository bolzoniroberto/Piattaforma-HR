import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, FileCheck, TrendingUp } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";

export default function AdminDashboard() {
  // Mock data - todo: remove mock functionality
  const [stats] = useState({
    totalEmployees: 156,
    totalObjectives: 468,
    completedObjectives: 312,
    pendingAcceptances: 23,
  });

  const [clusterStats] = useState([
    { name: "Obiettivi Strategici", progress: 68, total: 156 },
    { name: "Obiettivi Operativi", progress: 72, total: 187 },
    { name: "Obiettivi di Sviluppo", progress: 85, total: 125 },
  ]);

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader
            userName="Admin User"
            userRole="Amministratore"
            notificationCount={5}
            showSidebarTrigger={true}
          />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-semibold mb-2">Dashboard Amministrativa</h1>
                <p className="text-muted-foreground">
                  Panoramica del sistema MBO aziendale
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dipendenti Totali</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-employees">
                      {stats.totalEmployees}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Utenti attivi nel sistema</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Obiettivi Totali</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-objectives">
                      {stats.totalObjectives}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Obiettivi assegnati</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completati</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-chart-2" data-testid="stat-completed">
                      {stats.completedObjectives}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((stats.completedObjectives / stats.totalObjectives) * 100)}% del totale
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Accettazioni Pending</CardTitle>
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-chart-4" data-testid="stat-pending">
                      {stats.pendingAcceptances}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Documenti da approvare</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso per Cluster</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {clusterStats.map((cluster, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{cluster.name}</span>
                          <span className="text-muted-foreground">{cluster.total} obiettivi</span>
                        </div>
                        <ProgressBar value={cluster.progress} showPercentage={true} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attività Recenti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          user: "Mario Rossi",
                          action: "ha completato l'obiettivo",
                          target: "Certificazione AWS",
                          time: "2 ore fa",
                        },
                        {
                          user: "Laura Bianchi",
                          action: "ha aggiornato il progresso",
                          target: "Customer Satisfaction +15%",
                          time: "5 ore fa",
                        },
                        {
                          user: "Giovanni Verdi",
                          action: "ha accettato il documento",
                          target: "Regolamento MBO 2025",
                          time: "1 giorno fa",
                        },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{activity.user}</span>{" "}
                              {activity.action}{" "}
                              <span className="font-medium">{activity.target}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
