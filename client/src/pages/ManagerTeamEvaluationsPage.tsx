import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import PageHeader from "@/components/PageHeader";
import { Users, CheckCircle, Clock, Eye, FileCheck, MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  name: string;
  department: string | null;
  personaType: string | null;
}

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
  managerEvaluationStart: string;
  managerEvaluationEnd: string;
}

interface TeamMemberEvaluation {
  userId: string;
  userName: string;
  userDepartment: string | null;
  personaType: string | null;
  hasSelfAssessment: boolean;
  peerFeedbackCount: number;
  hasManagerEvaluation: boolean;
  isManagerEvaluationSubmitted: boolean;
}

const PERSONA_LABELS: Record<string, string> = {
  executive: "Executive",
  manager: "Manager",
  professional: "Professional",
  individual_contributor: "Individual Contributor",
};

export default function ManagerTeamEvaluationsPage() {
  const { user } = useAuth();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch cycles
  const { data: cycles = [] } = useQuery<EvaluationCycle[]>({
    queryKey: ["/api/evaluation-cycles"],
    enabled: !!user,
  });

  // Auto-select first active cycle
  useState(() => {
    if (cycles.length > 0 && !selectedCycle) {
      const activeCycle = cycles.find(c => c.status === "active") || cycles[0];
      setSelectedCycle(activeCycle.id);
    }
  });

  // Fetch team members evaluations
  const { data: teamEvaluations = [] } = useQuery<TeamMemberEvaluation[]>({
    queryKey: ["/api/manager/team-evaluations", selectedCycle],
    queryFn: async () => {
      if (!selectedCycle) return [];
      const res = await apiRequest("GET", `/api/manager/team-evaluations/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  const selectedCycleData = cycles.find(c => c.id === selectedCycle);
  const now = new Date();
  const isInPhase = selectedCycleData
    ? now >= new Date(selectedCycleData.managerEvaluationStart) &&
      now <= new Date(selectedCycleData.managerEvaluationEnd)
    : false;

  // Filter team members
  const filteredTeam = teamEvaluations.filter((member) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "to_evaluate") return !member.hasManagerEvaluation;
    if (filterStatus === "in_progress") return member.hasManagerEvaluation && !member.isManagerEvaluationSubmitted;
    if (filterStatus === "completed") return member.isManagerEvaluationSubmitted;
    return true;
  });

  // Statistics
  const stats = {
    total: teamEvaluations.length,
    toEvaluate: teamEvaluations.filter(m => !m.hasManagerEvaluation).length,
    inProgress: teamEvaluations.filter(m => m.hasManagerEvaluation && !m.isManagerEvaluationSubmitted).length,
    completed: teamEvaluations.filter(m => m.isManagerEvaluationSubmitted).length,
  };

  const getStatusBadge = (member: TeamMemberEvaluation) => {
    if (member.isManagerEvaluationSubmitted) {
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Completato
      </Badge>;
    }
    if (member.hasManagerEvaluation) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        In Corso
      </Badge>;
    }
    return <Badge variant="outline" className="flex items-center gap-1">
      <FileCheck className="h-3 w-3" />
      Da Valutare
    </Badge>;
  };

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          {/* SIDEBAR CONTAINER */}
          {/* MAIN CONTENT */}
          <main className="flex-1 w-full min-h-[calc(100vh-7rem)]">
            <div className="w-full space-y-6">
              <div className="flex items-start justify-between">
                <PageHeader 
                  context="TEAM" 
                  title="Valutazioni Team" 
                  description="Valuta i membri del tuo team per il ciclo corrente"
                />

                {cycles.length > 0 && (
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
                )}
              </div>

              {!isInPhase && selectedCycleData && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Clock className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Fase non attiva</p>
                        <p className="text-sm text-orange-700 mt-1">
                          La fase di valutazione manager è attiva dal{" "}
                          {new Date(selectedCycleData.managerEvaluationStart).toLocaleDateString("it-IT")} al{" "}
                          {new Date(selectedCycleData.managerEvaluationEnd).toLocaleDateString("it-IT")}.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedCycle ? (
                <>
                  {/* Statistics Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Totale Team</CardDescription>
                        <CardTitle className="text-3xl">{stats.total}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Da Valutare</CardDescription>
                        <CardTitle className="text-3xl text-orange-600">{stats.toEvaluate}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>In Corso</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">{stats.inProgress}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Completati</CardDescription>
                        <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Filter */}
                  <div className="flex gap-3">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti ({stats.total})</SelectItem>
                        <SelectItem value="to_evaluate">Da Valutare ({stats.toEvaluate})</SelectItem>
                        <SelectItem value="in_progress">In Corso ({stats.inProgress})</SelectItem>
                        <SelectItem value="completed">Completati ({stats.completed})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Members Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Membri del Team</CardTitle>
                      <CardDescription>
                        Clicca su un membro per visualizzare e valutare le sue competenze
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredTeam.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Dipartimento</TableHead>
                              <TableHead>Persona</TableHead>
                              <TableHead className="text-center">Autovalutazione</TableHead>
                              <TableHead className="text-center">360° Feedback</TableHead>
                              <TableHead className="text-center">Val. Manager</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead className="text-right">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTeam.map((member) => (
                              <TableRow key={member.userId}>
                                <TableCell className="font-medium">{member.userName}</TableCell>
                                <TableCell>{member.userDepartment || "-"}</TableCell>
                                <TableCell>
                                  {member.personaType && (
                                    <Badge variant="outline">
                                      {PERSONA_LABELS[member.personaType] || member.personaType}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {member.hasSelfAssessment ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {member.peerFeedbackCount > 0 ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <MessageSquare className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm">{member.peerFeedbackCount}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {member.isManagerEvaluationSubmitted ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : member.hasManagerEvaluation ? (
                                    <Clock className="h-4 w-4 text-orange-600 mx-auto" />
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(member)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Link href={`/manager/team-evaluations/${member.userId}/${selectedCycle}`}>
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4 mr-2" />
                                      {member.isManagerEvaluationSubmitted ? "Visualizza" : "Valuta"}
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          Nessun membro del team trovato con questo filtro
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {cycles.length === 0
                        ? "Nessun ciclo di valutazione disponibile"
                        : "Seleziona un ciclo per visualizzare le valutazioni del team"}
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
              title="Valutazioni Team"
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Statistiche</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Totale:</span>
                        <span className="font-bold">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Da valutare:</span>
                        <span className="font-bold text-orange-600">{stats.toEvaluate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completati:</span>
                        <span className="font-bold text-green-600">{stats.completed}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Valuta ogni membro del tuo team tenendo conto della loro autovalutazione e del feedback 360°
                      ricevuto dai colleghi.
                    </p>
                  </div>
                </div>
              </div>
            </AppActionsPanel>
          )}
        </div>
      </div>
    </>
  );
}
