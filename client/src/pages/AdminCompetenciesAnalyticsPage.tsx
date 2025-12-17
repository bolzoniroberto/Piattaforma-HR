import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppHeader from "@/components/AppHeader";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { BarChart3, TrendingUp, Users, FileCheck, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
}

interface OverviewData {
  totalSelfAssessments: number;
  completedSelfAssessments: number;
  totalPeerFeedbacks: number;
  completedPeerFeedbacks: number;
  totalManagerEvaluations: number;
  completedManagerEvaluations: number;
  totalDevelopmentPlans: number;
  agreedDevelopmentPlans: number;
  avgSelfRating: number;
  avgPeerRating: number;
  avgManagerRating: number;
}

interface RatingsDistribution {
  selfAssessments: Record<number, number>;
  peerFeedbacks: Record<number, number>;
  managerEvaluations: Record<number, number>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminCompetenciesAnalyticsPage() {
  const { user } = useAuth();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [selectedCycle, setSelectedCycle] = useState<string>("");

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch cycles
  const { data: cycles = [] } = useQuery<EvaluationCycle[]>({
    queryKey: ["/api/admin/evaluation-cycles"],
    enabled: !!user,
  });

  // Auto-select first active cycle
  useState(() => {
    if (cycles.length > 0 && !selectedCycle) {
      const activeCycle = cycles.find(c => c.status === "active") || cycles[0];
      setSelectedCycle(activeCycle.id);
    }
  });

  // Fetch overview
  const { data: overview } = useQuery<OverviewData>({
    queryKey: ["/api/admin/analytics/competencies-overview", selectedCycle],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/analytics/competencies-overview?cycleId=${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  // Fetch ratings distribution
  const { data: ratingsDistribution } = useQuery<RatingsDistribution>({
    queryKey: ["/api/admin/analytics/competencies-ratings-distribution", selectedCycle],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/analytics/competencies-ratings-distribution?cycleId=${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  // Transform ratings distribution for charts
  const distributionChartData = ratingsDistribution
    ? [1, 2, 3, 4, 5].map(rating => ({
        rating: `${rating} Stelle`,
        Autovalutazioni: ratingsDistribution.selfAssessments[rating] || 0,
        "360° Feedback": ratingsDistribution.peerFeedbacks[rating] || 0,
        "Valutazioni Manager": ratingsDistribution.managerEvaluations[rating] || 0,
      }))
    : [];

  // Calculate completion rates
  const selfCompletionRate = overview
    ? (overview.completedSelfAssessments / (overview.totalSelfAssessments || 1)) * 100
    : 0;
  const peerCompletionRate = overview
    ? (overview.completedPeerFeedbacks / (overview.totalPeerFeedbacks || 1)) * 100
    : 0;
  const managerCompletionRate = overview
    ? (overview.completedManagerEvaluations / (overview.totalManagerEvaluations || 1)) * 100
    : 0;
  const devPlanCompletionRate = overview
    ? (overview.agreedDevelopmentPlans / (overview.totalDevelopmentPlans || 1)) * 100
    : 0;

  // Average ratings comparison data
  const avgRatingsData = overview
    ? [
        { type: "Autovalutazione", rating: overview.avgSelfRating },
        { type: "360° Feedback", rating: overview.avgPeerRating },
        { type: "Manager", rating: overview.avgManagerRating },
      ]
    : [];

  return (
    <>
      <AppHeader
        userName={user?.name || "Amministratore"}
        userRole="Amministratore"
        notificationCount={0}
        showSidebarTrigger={true}
      />

      <div className="min-h-[calc(100vh-4rem)] bg-background pl-2 pr-6 py-6">
        <div className="flex gap-6 max-w-[1800px] mx-auto">
          {/* SIDEBAR CONTAINER */}
          <div className="w-[312px] shrink-0 flex gap-3">
            <AppRail activeSection={activeSection} onSectionClick={handleSectionClick} />
            <AppPanel activeSection={activeSection} className="transition-opacity duration-200" />
          </div>

          {/* MAIN CONTENT */}
          <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="md3-headline-medium mb-2 flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    Analytics Competenze
                  </h1>
                  <p className="md3-body-large text-muted-foreground">
                    Monitora l'avanzamento e i risultati del processo di valutazione
                  </p>
                </div>

                <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Seleziona ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name} ({cycle.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCycle && overview ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Autovalutazioni</CardDescription>
                        <CardTitle className="text-2xl">
                          {overview.completedSelfAssessments}/{overview.totalSelfAssessments}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={selfCompletionRate} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {selfCompletionRate.toFixed(0)}% completate
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Feedback 360°</CardDescription>
                        <CardTitle className="text-2xl">
                          {overview.completedPeerFeedbacks}/{overview.totalPeerFeedbacks}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={peerCompletionRate} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {peerCompletionRate.toFixed(0)}% completati
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Valutazioni Manager</CardDescription>
                        <CardTitle className="text-2xl">
                          {overview.completedManagerEvaluations}/{overview.totalManagerEvaluations}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={managerCompletionRate} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {managerCompletionRate.toFixed(0)}% completate
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Piani di Sviluppo</CardDescription>
                        <CardTitle className="text-2xl">
                          {overview.agreedDevelopmentPlans}/{overview.totalDevelopmentPlans}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={devPlanCompletionRate} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {devPlanCompletionRate.toFixed(0)}% concordati
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Average Ratings Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Rating Medi per Tipo di Valutazione</CardTitle>
                      <CardDescription>
                        Confronto tra autovalutazione, feedback 360° e valutazione manager
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={avgRatingsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis domain={[0, 5]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="rating" name="Rating Medio" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Ratings Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuzione Rating (1-5)</CardTitle>
                      <CardDescription>
                        Numero di valutazioni per ogni livello di rating
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={distributionChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Autovalutazioni" fill="#0088FE" />
                          <Bar dataKey="360° Feedback" fill="#00C49F" />
                          <Bar dataKey="Valutazioni Manager" fill="#FFBB28" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Process Progress Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Avanzamento Processo</CardTitle>
                      <CardDescription>
                        Stato di completamento per ciascuna fase del processo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Autovalutazione</span>
                          </div>
                          <Badge variant={selfCompletionRate >= 80 ? "default" : "secondary"}>
                            {selfCompletionRate.toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress value={selfCompletionRate} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Feedback 360°</span>
                          </div>
                          <Badge variant={peerCompletionRate >= 80 ? "default" : "secondary"}>
                            {peerCompletionRate.toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress value={peerCompletionRate} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Valutazione Manager</span>
                          </div>
                          <Badge variant={managerCompletionRate >= 80 ? "default" : "secondary"}>
                            {managerCompletionRate.toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress value={managerCompletionRate} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Piani di Sviluppo</span>
                          </div>
                          <Badge variant={devPlanCompletionRate >= 80 ? "default" : "secondary"}>
                            {devPlanCompletionRate.toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress value={devPlanCompletionRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {cycles.length === 0
                        ? "Nessun ciclo di valutazione disponibile"
                        : "Seleziona un ciclo per visualizzare le analytics"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>

          {/* AppActionsPanel */}
          {isActionsPanelOpen && (
            <AppActionsPanel
              isOpen={isActionsPanelOpen}
              onClose={() => setIsActionsPanelOpen(false)}
              title="Analytics"
            >
              <div className="space-y-4">
                {overview && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Rating Medi</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Autovalutazione</span>
                          <span className="font-bold">{overview.avgSelfRating.toFixed(1)}/5</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>360° Feedback</span>
                          <span className="font-bold">{overview.avgPeerRating.toFixed(1)}/5</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Manager</span>
                          <span className="font-bold">{overview.avgManagerRating.toFixed(1)}/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Le analytics mostrano l'avanzamento del processo di valutazione e la distribuzione dei rating assegnati.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </AppActionsPanel>
          )}
        </div>
      </div>
    </>
  );
}
