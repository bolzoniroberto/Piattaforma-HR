import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Target, BarChart3, TrendingUp, AlertCircle, CheckCircle2, 
  Clock, ArrowRight, ClipboardCheck, Euro, LayoutGrid, ListChecks,
  ChevronRight, ArrowUpRight, Activity, Gauge, Plus
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useRail } from "@/contexts/RailContext";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { setActiveSection } = useRail();

  // Data Fetching
  const { data: overviewStats } = useQuery<any>({
    queryKey: ["/api/admin/analytics/overview"],
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const { data: financialData } = useQuery<any>({
    queryKey: ["/api/admin/analytics/financial"],
    enabled: !!user,
  });

  const { data: objectivesWithAssignments = [] } = useQuery<any[]>({
    queryKey: ["/api/objectives-with-assignments"],
    enabled: !!user,
  });

  // Derived States for "Control Tower" logic
  const employeesCount = allUsers.filter(u => u.role === "employee").length;
  
  // Calculate coverage (who has at least one assignment)
  const usersWithAssignments = useMemo(() => {
    const set = new Set();
    objectivesWithAssignments.forEach(obj => {
      obj.assignedUsers.forEach((au: any) => set.add(au.user.id));
    });
    return Array.from(set);
  }, [objectivesWithAssignments]);

  const coveragePercentage = employeesCount > 0 
    ? Math.round((usersWithAssignments.length / employeesCount) * 100) 
    : 0;

  const missingObjectivesCount = employeesCount - usersWithAssignments.length;

  const missingEmployees = useMemo(() => {
    return allUsers.filter(u => u.role === "employee" && !usersWithAssignments.includes(u.id)).slice(0, 5);
  }, [allUsers, usersWithAssignments]);

  // UI Sections
  return (
    <div className="w-full space-y-8 flex flex-col pt-4 pb-12">
      <PageHeader 
        context="CONTROL TOWER" 
        title="Quadro di Controllo HR" 
        description="Monitoraggio globale dei processi di performance, stati di assegnazione e proiezioni di payout."
      />

      {/* Row 1: High Level Pulse */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Stato Processo</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 uppercase">Assegnazione</div>
            <p className="text-[10px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In corso · Fase 1 di 3
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Copertura Obiettivi</CardTitle>
            <Target className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-slate-900">{coveragePercentage}%</div>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${coveragePercentage}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{usersWithAssignments.length} su {employeesCount} dipendenti mappati</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Forecast Payout</CardTitle>
            <Euro className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
               €{(financialData?.actualProjectedPayout || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Vs €{(financialData?.theoreticalTargetPayout || 0).toLocaleString()} (Budget Max)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md group cursor-pointer" onClick={() => setActiveSection('analytics')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Performance Media</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-indigo-600">{overviewStats?.averageCompletion || 0}%</div>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
              Vedi analytics dettaglio <ArrowUpRight className="w-3 h-3" />
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column: Process & Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Timeline Processo MBO */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900">Ciclo Performance 2025</CardTitle>
                  <CardDescription className="text-xs">Stato avanzamento del workflow amministrativo</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white text-[10px] font-bold uppercase tracking-widest border-slate-200 py-1">Q1 — Configurazione</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="relative flex justify-between items-start">
                {/* Connector line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 z-0">
                   <div className="h-full bg-indigo-600 w-1/3 transition-all duration-500" />
                </div>

                {[
                  { label: "Apertura & Config", status: "complete", date: "Jan - Feb", icon: Target },
                  { label: "Assegnazione", status: "current", date: "In corso", icon: Users },
                  { label: "Valutazione", status: "pending", date: "May - June", icon: ClipboardCheck },
                  { label: "Consuntivazione", status: "pending", date: "Dec", icon: Gauge },
                  { label: "Payout", status: "pending", date: "Jan 2026", icon: Euro }
                ].map((step, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center text-center w-32">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      step.status === "complete" ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20" :
                      step.status === "current" ? "bg-white border-indigo-600 shadow-lg shadow-indigo-600/10 scale-110" :
                      "bg-white border-slate-200"
                    }`}>
                      {step.status === "complete" ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <step.icon className={`w-5 h-5 ${step.status === "current" ? "text-indigo-600" : "text-slate-300"}`} />
                      )}
                    </div>
                    <div className="mt-3">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${step.status === "pending" ? "text-slate-400" : "text-slate-900"}`}>{step.label}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Tasks Grid */}
          <div className="grid gap-5 md:grid-cols-2">
             <Card className="border-slate-200 shadow-sm hover:border-indigo-200 transition-colors group">
               <CardContent className="p-6">
                 <div className="flex items-start justify-between">
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 transition-colors group-hover:bg-indigo-600">
                       <Users className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                 </div>
                 <h3 className="mt-4 text-sm font-bold text-slate-900">Gestione Anagrafica</h3>
                 <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Aggiorna RAL, dipartimenti e inquadramenti di tutto l'organico aziendale.</p>
                 <Link href="/admin/users">
                   <Button variant="link" className="p-0 h-auto text-[11px] font-bold text-indigo-600 mt-4 uppercase tracking-widest">Vai a lista utenti →</Button>
                 </Link>
               </CardContent>
             </Card>

             <Card className="border-slate-200 shadow-sm hover:border-indigo-200 transition-colors group">
               <CardContent className="p-6">
                 <div className="flex items-start justify-between">
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 transition-colors group-hover:bg-indigo-600">
                       <Target className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                 </div>
                 <h3 className="mt-4 text-sm font-bold text-slate-900">Dizionario Obiettivi</h3>
                 <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Cura il database centralizzato degli obiettivi KPI e le logiche di calcolo del payout.</p>
                 <Link href="/admin/objectives">
                    <Button variant="link" className="p-0 h-auto text-[11px] font-bold text-indigo-600 mt-4 uppercase tracking-widest">Gestisci dizionario →</Button>
                 </Link>
               </CardContent>
             </Card>

             <Card className="border-slate-200 shadow-sm hover:border-indigo-200 transition-colors group">
               <CardContent className="p-6">
                 <div className="flex items-start justify-between">
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 transition-colors group-hover:bg-indigo-600">
                       <ListChecks className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                 </div>
                 <h3 className="mt-4 text-sm font-bold text-slate-900">Monitoraggio Cicli</h3>
                 <h3 className="mt-4 text-sm font-bold text-slate-900 invisible -mt-6">Workflow</h3>
                 <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Verifica in tempo reale chi ha completato le autovalutazioni e i feedback 360°.</p>
                 <Button variant="link" className="p-0 h-auto text-[11px] font-bold text-indigo-600 mt-4 uppercase tracking-widest">Controlla workflow →</Button>
               </CardContent>
             </Card>

             <Card className="border-slate-200 shadow-sm hover:border-indigo-200 transition-colors group">
               <CardContent className="p-6">
                 <div className="flex items-start justify-between">
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 transition-colors group-hover:bg-indigo-600">
                       <BarChart3 className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                 </div>
                 <h3 className="mt-4 text-sm font-bold text-slate-900">Reporting & Payout</h3>
                 <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Analizza proiezioni di budget e genera report di rendicontazione per il payroll.</p>
                 <Link href="/admin/analytics">
                    <Button variant="link" className="p-0 h-auto text-[11px] font-bold text-indigo-600 mt-4 uppercase tracking-widest">Vedi rendicontazione →</Button>
                 </Link>
               </CardContent>
             </Card>
          </div>
        </div>

        {/* Sidebar: Critical Checks & Monitoring */}
        <div className="space-y-6">
           {/* Assignment Monitoring */}
           <Card className="border-slate-200 shadow-sm h-full">
             <CardHeader className="pb-3 border-b border-slate-50">
               <div className="flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-amber-500" />
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">Alert Assegnazioni</CardTitle>
               </div>
               <CardDescription className="text-[10px]">Dipendenti che necessitano attenzione</CardDescription>
             </CardHeader>
             <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                 {missingObjectivesCount > 0 ? (
                   <>
                     <div className="p-4 bg-amber-50/30 flex items-center justify-between">
                       <span className="text-[11px] font-semibold text-amber-800">Senza obiettivi</span>
                       <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 py-0 h-5 text-[10px] font-bold">{missingObjectivesCount}</Badge>
                     </div>
                     <div className="max-h-[300px] overflow-y-auto">
                        {missingEmployees.map((emp) => (
                          <div key={emp.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900">{emp.firstName} {emp.lastName}</span>
                              <span className="text-[10px] text-slate-400 capitalize">{emp.department || 'Staff'}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100">
                               <Plus className="w-3.5 h-3.5 text-indigo-600" />
                            </Button>
                          </div>
                        ))}
                     </div>
                     <div className="p-3 border-t border-slate-50">
                        <Button className="w-full text-[10px] font-bold uppercase tracking-widest h-9 border-slate-200" variant="outline">
                           Vedi tutti gli alert
                        </Button>
                     </div>
                   </>
                 ) : (
                   <div className="p-10 text-center flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-xs font-medium text-slate-500">Copertura 100% raggiungibile.</p>
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>

           {/* Quick Stats Sidebar */}
           <Card className="border-slate-200 shadow-sm bg-indigo-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Budget Saving Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">€{(financialData?.savings || 0).toLocaleString()}</div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                  <span className="px-1.5 py-0.5 bg-white/20 rounded">Saving attuale: {financialData?.savingsPercentage || 0}%</span>
                </div>
                <p className="text-[10px] text-indigo-400 mt-4 leading-normal">
                   Il risparmio attuale è calcolato sulla base degli obiettivi non ancora raggiunti al 100% rispetto al Bonus Pool totale.
                </p>
                <Button className="w-full mt-6 bg-white text-indigo-900 hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest h-10 border-none">
                   Esporta Consuntivo
                </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
