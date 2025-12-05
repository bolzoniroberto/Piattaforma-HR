import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Users, Award, Activity, Euro, TrendingDown, BarChart3 } from "lucide-react";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import { useRail } from "@/contexts/RailContext";

const COLORS = ['#DC2626', '#6B7280', '#9CA3AF', '#D1D5DB', '#EF4444', '#991B1B'];

export default function AdminAnalyticsPage() {
  const { isRailOpen, activeSection, setActiveSection, isPanelOpen, setIsPanelOpen } = useRail();

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
      setIsPanelOpen(false);
    } else {
      setActiveSection(sectionId);
      setIsPanelOpen(true);
    }
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
    setActiveSection(null);
  };

  // Fetch aggregated statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics/overview"],
  });

  const { data: departmentData } = useQuery({
    queryKey: ["/api/admin/analytics/by-department"],
  });

  const { data: financialDataRaw } = useQuery({
    queryKey: ["/api/admin/analytics/financial"],
  });

  const { data: clusterDataRaw } = useQuery({
    queryKey: ["/api/admin/analytics/by-cluster"],
  });

  const { data: eligiblesDataRaw } = useQuery({
    queryKey: ["/api/admin/analytics/eligibles"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex gap-6 max-w-[1800px] mx-auto">
          <AppRail
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            isOpen={isRailOpen}
          />
          <AppPanel
            activeSection={activeSection}
            isOpen={isPanelOpen}
            onClose={handlePanelClose}
          />
          <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-3rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </main>
        </div>
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

  const completionData = [
    { name: 'Completed', value: overviewStats.completedObjectives, color: '#6B7280' },
    { name: 'In Progress', value: overviewStats.inProgressObjectives, color: '#9CA3AF' },
    { name: 'Not Started', value: overviewStats.notStartedObjectives, color: '#DC2626' },
  ];

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
    theoreticalTargetPayout: 0,
    actualProjectedPayout: 0,
    savings: 0,
    savingsPercentage: 0,
    averageTheoreticalMBO: 0,
    employeePayouts: [],
    departmentPayouts: []
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex gap-6 max-w-[1800px] mx-auto">
        <AppRail
          activeSection={activeSection}
          onSectionClick={handleSectionClick}
          isOpen={isRailOpen}
        />
        <AppPanel
          activeSection={activeSection}
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
        />
        <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-3rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
          <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="md3-headline-medium mb-2 flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                Analytics & Reports
              </h1>
              <p className="md3-body-large text-muted-foreground">Metriche di performance e insights aggregati</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="md3-elevated md3-motion-standard">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="md3-title-small text-muted-foreground">Obiettivi Assegnati</CardTitle>
                <div className="p-2 rounded-full bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="md3-headline-medium">{overviewStats.totalObjectives}</div>
                <p className="md3-body-medium text-muted-foreground mt-1">Assegnati ai dipendenti</p>
              </CardContent>
            </Card>

            <Card className="md3-elevated md3-motion-standard">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="md3-title-small text-muted-foreground">Completion Rate</CardTitle>
                <div className="p-2 rounded-full bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="md3-headline-medium">{overviewStats.averageCompletion}%</div>
                <p className="md3-body-medium text-muted-foreground mt-1">Media su tutti gli obiettivi</p>
              </CardContent>
            </Card>

            <Card className="md3-elevated md3-motion-standard">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="md3-title-small text-muted-foreground">Dipendenti Attivi</CardTitle>
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="md3-headline-medium">{overviewStats.activeEmployees}</div>
                <p className="md3-body-medium text-muted-foreground mt-1">Su {overviewStats.totalEmployees} totali</p>
              </CardContent>
            </Card>

            <Card className="md3-elevated md3-motion-standard">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="md3-title-small text-muted-foreground">Completati</CardTitle>
                <div className="p-2 rounded-full bg-primary/10">
                  <Award className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="md3-headline-medium">{overviewStats.completedObjectives}</div>
                <p className="md3-body-medium text-muted-foreground mt-1">Obiettivi raggiunti</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="departments">By Department</TabsTrigger>
              <TabsTrigger value="financial">Financial MBO</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Obiettivi per Cluster */}
                <Card className="md3-surface md3-motion-standard">
                  <CardHeader>
                    <CardTitle className="md3-title-large">Obiettivi per Cluster</CardTitle>
                    <CardDescription className="md3-body-medium">Distribuzione obiettivi per tipologia</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clusterData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {clusterData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Eligibles per Dipartimento */}
                <Card className="md3-surface md3-motion-standard">
                  <CardHeader>
                    <CardTitle className="md3-title-large">Eligibles per Dipartimento</CardTitle>
                    <CardDescription className="md3-body-medium">Dipendenti con MBO attivo</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={eligiblesByDepartment}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="eligibles" fill="#DC2626" name="Eligibles" />
                        <Bar dataKey="total" fill="#6B7280" name="Totali" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Completion Progress Aggregato */}
                <Card className="md3-surface md3-motion-standard">
                  <CardHeader>
                    <CardTitle className="md3-title-large">Livello Completamento</CardTitle>
                    <CardDescription className="md3-body-medium">Percentuale obiettivi completati</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-primary mb-4">
                        {overviewStats.averageCompletion}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {overviewStats.completedObjectives} su {overviewStats.totalObjectives} obiettivi
                      </p>
                      <div className="mt-6 w-full bg-secondary rounded-full h-4">
                        <div
                          className="bg-primary h-4 rounded-full transition-all"
                          style={{ width: `${overviewStats.averageCompletion}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Completion by Department */}
              <Card className="md3-surface md3-motion-standard">
                <CardHeader>
                  <CardTitle className="md3-title-large">Livello Completamento per Dipartimento</CardTitle>
                  <CardDescription className="md3-body-medium">Percentuale di completamento obiettivi per ogni dipartimento</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgCompletion" fill="#DC2626" name="Completion %">
                        {departmentStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="space-y-4">
              <Card className="md3-surface md3-motion-standard">
                <CardHeader>
                  <CardTitle className="md3-title-large">Performance by Department</CardTitle>
                  <CardDescription className="md3-body-medium">Comparison of objective completion across departments</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" fill="#6B7280" name="Completed" />
                      <Bar dataKey="inProgress" fill="#9CA3AF" name="In Progress" />
                      <Bar dataKey="total" fill="#DC2626" name="Total" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md3-surface md3-motion-standard">
                <CardHeader>
                  <CardTitle className="md3-title-large">Average Completion Rate by Department</CardTitle>
                  <CardDescription className="md3-body-medium">Percentage completion rates</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Bar dataKey="avgCompletion" fill="#DC2626" name="Completion %">
                        {departmentStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial MBO Tab */}
            <TabsContent value="financial" className="space-y-4">
              {/* Financial KPI Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="md3-elevated md3-motion-standard">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="md3-title-small text-muted-foreground">Target Teorico MBO</CardTitle>
                    <div className="p-2 rounded-full bg-primary/10">
                      <Euro className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="md3-headline-medium">€{financialData.theoreticalTargetPayout.toLocaleString()}</div>
                    <p className="md3-body-medium text-muted-foreground mt-1">Potenziale massimo payout</p>
                  </CardContent>
                </Card>

                <Card className="md3-elevated md3-motion-standard">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="md3-title-small text-muted-foreground">Payout Effettivo</CardTitle>
                    <div className="p-2 rounded-full bg-primary/10">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="md3-headline-medium">€{financialData.actualProjectedPayout.toLocaleString()}</div>
                    <p className="md3-body-medium text-muted-foreground mt-1">Basato su performance reale</p>
                  </CardContent>
                </Card>

                <Card className="md3-elevated md3-motion-standard">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="md3-title-small text-muted-foreground">Risparmio</CardTitle>
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="md3-headline-medium text-green-600">€{financialData.savings.toLocaleString()}</div>
                    <p className="md3-body-medium text-muted-foreground mt-1">Differenza target vs effettivo</p>
                  </CardContent>
                </Card>

                <Card className="md3-elevated md3-motion-standard">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="md3-title-small text-muted-foreground">% Risparmio</CardTitle>
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="md3-headline-medium text-green-600">{financialData.savingsPercentage}%</div>
                    <p className="md3-body-medium text-muted-foreground mt-1">Sul budget totale MBO</p>
                  </CardContent>
                </Card>

                <Card className="md3-elevated md3-motion-standard">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="md3-title-small text-muted-foreground">MBO Medio per Dipendente</CardTitle>
                    <div className="p-2 rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="md3-headline-medium">€{(financialData.averageTheoreticalMBO || 0).toLocaleString()}</div>
                    <p className="md3-body-medium text-muted-foreground mt-1">Target medio teorico</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <Card className="md3-surface md3-motion-standard">
                <CardHeader>
                  <CardTitle className="md3-title-large">Target vs Effettivo per Reparto</CardTitle>
                  <CardDescription className="md3-body-medium">Confronto payout teorico e reale</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData.departmentPayouts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="theoretical" fill="#DC2626" name="Target Teorico €" />
                      <Bar dataKey="actual" fill="#6B7280" name="Payout Effettivo €" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Detailed Table */}
              <Card className="md3-surface md3-motion-standard">
                <CardHeader>
                  <CardTitle className="md3-title-large">Dettaglio Payout per Dipendente</CardTitle>
                  <CardDescription className="md3-body-medium">Analisi dettagliata RAL, MBO% e performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Dipendente</th>
                          <th className="text-right p-2">RAL</th>
                          <th className="text-right p-2">MBO %</th>
                          <th className="text-right p-2">Target MBO €</th>
                          <th className="text-right p-2">Completion %</th>
                          <th className="text-right p-2">Payout Effettivo €</th>
                          <th className="text-right p-2">Differenza €</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialData.employeePayouts.map((emp, index) => {
                          const difference = emp.theoreticalMbo - emp.actualMbo;
                          return (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{emp.name}</td>
                              <td className="text-right p-2">€{emp.ral.toLocaleString()}</td>
                              <td className="text-right p-2">{emp.mboPercentage}%</td>
                              <td className="text-right p-2">€{emp.theoreticalMbo.toLocaleString()}</td>
                              <td className="text-right p-2">{emp.completion}%</td>
                              <td className="text-right p-2 font-semibold text-green-600">
                                €{emp.actualMbo.toLocaleString()}
                              </td>
                              <td className="text-right p-2 text-muted-foreground">
                                -€{difference.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td className="p-2" colSpan={3}>TOTALE</td>
                          <td className="text-right p-2">
                            €{financialData.theoreticalTargetPayout.toLocaleString()}
                          </td>
                          <td className="text-right p-2">-</td>
                          <td className="text-right p-2 text-green-600">
                            €{financialData.actualProjectedPayout.toLocaleString()}
                          </td>
                          <td className="text-right p-2">
                            -€{financialData.savings.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
