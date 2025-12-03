import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Users, Award, Activity, Euro, TrendingDown, BarChart3 } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppHeader from "@/components/AppHeader";

const COLORS = ['#DC2626', '#6B7280', '#9CA3AF', '#D1D5DB', '#EF4444', '#991B1B'];

export default function AdminAnalyticsPage() {
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="flex items-center justify-center h-screen">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader showSidebarTrigger={true} />

        <div className="flex-1 space-y-6 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                Analytics & Reports
              </h1>
              <p className="text-muted-foreground">Aggregated performance metrics and insights</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Obiettivi Assegnati</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.totalObjectives}</div>
                <p className="text-xs text-muted-foreground">Assegnati ai dipendenti</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.averageCompletion}%</div>
                <p className="text-xs text-muted-foreground">Average across all objectives</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.activeEmployees}</div>
                <p className="text-xs text-muted-foreground">Out of {overviewStats.totalEmployees} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.completedObjectives}</div>
                <p className="text-xs text-muted-foreground">Successfully achieved</p>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Obiettivi per Cluster</CardTitle>
                    <CardDescription>Distribuzione obiettivi per tipologia</CardDescription>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Eligibles per Dipartimento</CardTitle>
                    <CardDescription>Dipendenti con MBO attivo</CardDescription>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Livello Completamento</CardTitle>
                    <CardDescription>Percentuale obiettivi completati</CardDescription>
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
              <Card>
                <CardHeader>
                  <CardTitle>Livello Completamento per Dipartimento</CardTitle>
                  <CardDescription>Percentuale di completamento obiettivi per ogni dipartimento</CardDescription>
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
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Department</CardTitle>
                  <CardDescription>Comparison of objective completion across departments</CardDescription>
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

              <Card>
                <CardHeader>
                  <CardTitle>Average Completion Rate by Department</CardTitle>
                  <CardDescription>Percentage completion rates</CardDescription>
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Target Teorico MBO</CardTitle>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{financialData.theoreticalTargetPayout.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Potenziale massimo payout</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payout Effettivo</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{financialData.actualProjectedPayout.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Basato su performance reale</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Risparmio</CardTitle>
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">€{financialData.savings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Differenza target vs effettivo</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">% Risparmio</CardTitle>
                    <Activity className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{financialData.savingsPercentage}%</div>
                    <p className="text-xs text-muted-foreground">Sul budget totale MBO</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">MBO Medio per Dipendente</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{(financialData.averageTheoreticalMBO || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Target medio teorico</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <Card>
                <CardHeader>
                  <CardTitle>Target vs Effettivo per Reparto</CardTitle>
                  <CardDescription>Confronto payout teorico e reale</CardDescription>
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
              <Card>
                <CardHeader>
                  <CardTitle>Dettaglio Payout per Dipendente</CardTitle>
                  <CardDescription>Analisi dettagliata RAL, MBO% e performance</CardDescription>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
