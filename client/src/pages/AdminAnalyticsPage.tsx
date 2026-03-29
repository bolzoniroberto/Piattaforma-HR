import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Users, Award, Activity, Euro, TrendingDown, BarChart3, ChevronRight, ClipboardCheck, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { useAuth } from "@/hooks/useAuth";

// Nuovo schema colori "Sovereign Ledger" / Enterprise
const COLORS = [
  '#0F172A', // Slate 900
  '#334155', // Slate 700
  '#64748B', // Slate 500
  '#4F46E5', // Indigo 600
  '#4338CA', // Indigo 700
  '#6366F1', // Indigo 500
];

interface OverviewStats {
  totalObjectives: number;
  completedObjectives: number;
  inProgressObjectives: number;
  notStartedObjectives: number;
  averageCompletion: number;
  totalEmployees: number;
  activeEmployees: number;
}

interface FinancialData {
  theoreticalBudget: number;
  theoreticalTargetPayout: number;
  actualProjectedPayout: number;
  savings: number;
  savingsPercentage: number;
  averageTheoreticalMBO: number;
  employeePayouts: any[];
  departmentPayouts: any[];
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch aggregated statistics
  const { data: stats, isLoading } = useQuery<OverviewStats>({
    queryKey: ["/api/admin/analytics/overview"],
  });

  const { data: departmentData } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/by-department"],
  });

  const { data: financialDataRaw } = useQuery<FinancialData>({
    queryKey: ["/api/admin/analytics/financial"],
  });

  const { data: clusterDataRaw } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/by-cluster"],
  });

  const { data: eligiblesDataRaw } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/eligibles"],
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <main className="w-full space-y-6 flex flex-col pt-4">
          <div className="flex items-center justify-center h-[50vh]">
            <p className="text-muted-foreground animate-pulse text-lg tracking-wide uppercase">Caricamento Analisi Dati...</p>
          </div>
        </main>
      </div>
    );
  }

  // Overview statistics - from API
  const overviewStats = stats || {
    totalObjectives: 0,
    completedObjectives: 0,
    inProgressObjectives: 0,
    notStartedObjectives: 0,
    averageCompletion: 0,
    totalEmployees: 0,
    activeEmployees: 0,
  };

  // Department statistics - from API
  const departmentStats = departmentData || [];

  // Objectives by cluster - from API
  const clusterDataFromApi = clusterDataRaw || [];
  const clusterData = clusterDataFromApi.map((cluster: any, index: number) => ({
    ...cluster,
    color: COLORS[index % COLORS.length],
  }));

  // Eligibles (employees with MBO) by department - from API
  const eligiblesByDepartment = eligiblesDataRaw || [];

  // Financial Analytics - MBO Payout calculations from API
  const financialData = financialDataRaw || {
    theoreticalBudget: 0,
    theoreticalTargetPayout: 0,
    actualProjectedPayout: 0,
    savings: 0,
    savingsPercentage: 0,
    averageTheoreticalMBO: 0,
    employeePayouts: [],
    departmentPayouts: []
  };

  // Custom Tooltip component for Recharts to match the theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 shadow-lg rounded-md">
          <p className="font-bold text-slate-800 text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="font-medium">{entry.name}:</span>
              <span>{typeof entry.value === 'number' && entry.name.includes('€') ? `€${entry.value.toLocaleString()}` : entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <main className="w-full space-y-8 flex flex-col pt-4 pb-12">
        <PageHeader 
          context="DATA & INTELLIGENCE" 
          title="Performance Analytics" 
          description="Cruscotto dirigenziale per l'analisi delle performance aziendali, stato avanzamento obiettivi e proiezioni finanziarie MBO."
        />

        {/* Dynamic Tabs Section */}
        <Tabs defaultValue="raggiungimento" className="space-y-6">
          <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 flex gap-8">
            <TabsTrigger 
              value="raggiungimento" 
              className="px-0 py-4 font-semibold text-slate-500 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-slate-800 transition-colors flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" /> Raggiungimento Obiettivi
            </TabsTrigger>
            <TabsTrigger 
              value="rendicontazione" 
              className="px-0 py-4 font-semibold text-slate-500 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-slate-800 transition-colors flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" /> Rendicontazione & Payout
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: RAGGIUNGIMENTO (Achievement View) */}
          <TabsContent value="raggiungimento" className="mt-6 space-y-8 focus:outline-none focus-visible:ring-0 focus:ring-0">
            
            {/* KPI Cards specific to Achievement */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Obiettivi Attivi</h3>
                  <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                    <Target className="h-4 w-4 text-slate-700" />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-slate-900">{overviewStats.totalObjectives}</div>
                <p className="text-xs font-medium text-slate-500 mt-2">Totale assegnati a sistema</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Completion Rate</h3>
                  <div className="p-2 bg-indigo-50 rounded-md border border-indigo-100">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-indigo-600">{overviewStats.averageCompletion}%</div>
                <p className="text-xs font-medium text-slate-500 mt-2">Media avanzamento globale</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Obiettivi Chiusi</h3>
                  <div className="p-2 bg-green-50 rounded-md border border-green-100">
                    <Award className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-green-600">{overviewStats.completedObjectives}</div>
                <p className="text-xs font-medium text-slate-500 mt-2">Terminati con successo</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Dipendenti Coinvolti</h3>
                  <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                    <Users className="h-4 w-4 text-slate-700" />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-slate-900">{overviewStats.activeEmployees}</div>
                <p className="text-xs font-medium text-slate-500 mt-2">Su {overviewStats.totalEmployees} totali</p>
              </div>
            </div>

            {/* Achievement Content: Cluster and Progress */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 col-span-1">
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Distribuzione Cluster</h3>
                  <p className="text-sm text-slate-500 mt-1">Tipologia di obiettivi per natura / area</p>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clusterData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="count"
                        stroke="none"
                      >
                        {clusterData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="bg-slate-900 text-white border border-slate-800 rounded-xl shadow-lg p-8 col-span-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="md:w-1/3 text-center md:text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Avanzamento Globale</h3>
                      <div className="text-7xl font-light tracking-tighter text-white mb-2">{overviewStats.averageCompletion}%</div>
                      <p className="text-sm text-slate-400 font-medium">Stato di avanzamento calcolato su tutti i KPI attivi.</p>
                    </div>
                    
                    <div className="md:w-2/3 w-full">
                      <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 mb-8">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-1000 relative"
                          style={{ width: `${Math.max(5, overviewStats.averageCompletion)}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 w-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">In Corso</p>
                          <p className="text-xl font-semibold text-white">{overviewStats.inProgressObjectives}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Iniziati</p>
                          <p className="text-xl font-semibold text-slate-300">{overviewStats.totalObjectives - overviewStats.notStartedObjectives}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
                          <p className="text-xl font-semibold text-green-400 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Ottimo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance by Dept comparison */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="mb-8 border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Achievement per Reparto</h3>
                <p className="text-sm text-slate-500 mt-1">Percentuale media di completamento e distribuzione stati per unità organizzativa</p>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#F1F5F9'}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                    <Bar dataKey="completed" fill="#0F172A" name="Completati" stackId="a" radius={[0, 0, 4, 4]} maxBarSize={45} />
                    <Bar dataKey="inProgress" fill="#64748B" name="In Corso" stackId="a" maxBarSize={45} />
                    <Bar dataKey="notStarted" fill="#CBD5E1" name="Non Iniziati" stackId="a" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: RENDICONTAZIONE (Financial/Reporting View) */}
          <TabsContent value="rendicontazione" className="mt-6 space-y-8 focus:outline-none focus-visible:ring-0 focus:ring-0">
            {/* Financial KPI Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 border border-indigo-700 rounded-xl p-5 shadow-sm text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">Bonus Pool Totale</h3>
                  <div className="p-2 bg-indigo-950/50 rounded-md border border-indigo-700">
                    <Euro className="h-4 w-4 text-indigo-300" />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight">€{(financialData.theoreticalTargetPayout || 0).toLocaleString()}</div>
                <p className="text-xs font-medium text-indigo-300 mt-2">Budget massimo teorico erogabile</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Payout Effettivo</h3>
                  <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                    <TrendingUp className="h-4 w-4 text-slate-700" />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-slate-900">€{(financialData.actualProjectedPayout || 0).toLocaleString()}</div>
                <p className="text-xs font-medium text-slate-500 mt-2">Proiezione attuale reale</p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-5 shadow-sm border-l-4 border-l-green-600 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-green-700">Saving Aziendale</h3>
                  <div className="p-2 bg-green-100 rounded-md border border-green-200">
                    <TrendingDown className="h-4 w-4 text-green-700" />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-green-700">€{(financialData.savings || 0).toLocaleString()}</div>
                <p className="text-xs font-medium text-green-600 mt-2">Risparmio vs Target ({financialData.savingsPercentage || 0}%)</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">MBO Medio</h3>
                  <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                    <Users className="h-4 w-4 text-slate-700" />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-slate-900">€{(financialData.averageTheoreticalMBO || 0).toLocaleString()}</div>
                <p className="text-xs font-medium text-slate-500 mt-2">Quota pro-capite teorica</p>
              </div>
            </div>

            {/* Financial Charts */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="mb-8 border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Analisi Payout per Dipartimento</h3>
                <p className="text-sm text-slate-500 mt-1">Confronto tra target massimo erogabile e payout reale basato sui risultati raggiunti</p>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData.departmentPayouts} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} tickFormatter={(val) => `€${val/1000}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#F1F5F9'}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                    <Bar dataKey="theoretical" fill="#E2E8F0" name="Target Massimo €" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="actual" fill="#4F46E5" name="Erogato Effettivo €" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Individual Records (Rendicontazione Dettagliata) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  Registro Individuale di Rendicontazione
                </h3>
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 border-slate-300">
                  <TrendingDown className="w-3 h-3" /> Esporta CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white">
                      <th className="text-left py-4 px-6 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Dipendente</th>
                      <th className="text-right py-4 px-6 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">RAL</th>
                      <th className="text-right py-4 px-6 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Incentivo %</th>
                      <th className="text-right py-4 px-6 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Target €</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Raggiungimento</th>
                      <th className="text-right py-4 px-6 font-semibold text-slate-900 uppercase tracking-wider text-[10px] bg-slate-50 font-bold border-l border-slate-100">Payout Maturato €</th>
                      <th className="text-right py-4 px-6 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Saving (Gap)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {financialData.employeePayouts.map((emp, index) => {
                      const difference = emp.theoreticalMbo - emp.actualMbo;
                      return (
                        <tr key={index} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-3.5 px-6 font-medium text-slate-900">{emp.name}</td>
                          <td className="text-right py-3.5 px-6 text-slate-600 font-mono text-xs">€{emp.ral.toLocaleString()}</td>
                          <td className="text-right py-3.5 px-6 font-semibold text-slate-700">{emp.mboPercentage}%</td>
                          <td className="text-right py-3.5 px-6 text-slate-500">€{emp.theoreticalMbo.toLocaleString()}</td>
                          <td className="text-center py-3.5 px-6">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              emp.completion >= 80 ? 'bg-green-100 text-green-700' :
                              emp.completion >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {emp.completion}%
                            </span>
                          </td>
                          <td className="text-right py-3.5 px-6 font-bold text-slate-900 bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors border-l border-slate-100">
                            €{emp.actualMbo.toLocaleString()}
                          </td>
                          <td className="text-right py-3.5 px-6 text-red-500 font-medium">
                            -€{difference.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100/50 border-t-2 border-slate-200">
                    <tr className="font-bold text-slate-900">
                      <td className="py-5 px-6 uppercase tracking-wider text-[11px]" colSpan={3}>Consuntivo Totale</td>
                      <td className="text-right py-5 px-6 font-mono text-slate-500 text-xs">
                        €{(financialData.theoreticalTargetPayout || 0).toLocaleString()}
                      </td>
                      <td className="text-center py-5 px-6 text-slate-400">-</td>
                      <td className="text-right py-5 px-6 text-xl tracking-tight font-bold border-l border-slate-200 bg-slate-100">
                        €{(financialData.actualProjectedPayout || 0).toLocaleString()}
                      </td>
                      <td className="text-right py-5 px-6 text-green-600 font-bold bg-green-50/30">
                        Saving €{(financialData.savings || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Sidebar Actions Panel */}
        {isActionsPanelOpen && (
          <AppActionsPanel
            isOpen={isActionsPanelOpen}
            onClose={() => setIsActionsPanelOpen(false)}
            title="Sintesi Performance"
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Metodologia Analytics</p>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-indigo-600 rounded">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Dati Real-Time</p>
                      <p className="text-[11px] text-indigo-700/80 mt-1 leading-relaxed">I grafici di raggiungimento sono basati sull'ultima valutazione salvata a sistema da manager e dipendenti.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-indigo-600 rounded">
                      <Euro className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Calcolo MBO</p>
                      <p className="text-[11px] text-indigo-700/80 mt-1 leading-relaxed">Il payout maturato viene calcolato proporzionalmente alla RAL e alla percentuale di completamento degli obiettivi.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Statistiche Veloci</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg">
                    <span className="text-[11px] font-medium text-slate-600">Avg. Achievement</span>
                    <span className="text-sm font-bold text-slate-900">{overviewStats.averageCompletion}%</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg">
                    <span className="text-[11px] font-medium text-slate-600">Saving Potenziale</span>
                    <span className="text-sm font-bold text-green-600">€{(financialData.savings || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <Button className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                  Genera Report PDF
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </AppActionsPanel>
        )}
      </main>
    </div>
  );
}
