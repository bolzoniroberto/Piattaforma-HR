import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { TrendingUp, Calendar, CheckCircle, FileText, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
}

interface Competency {
  id: string;
  name: string;
  description: string;
}

interface ActionItem {
  action: string;
  deadline: string | null;
  status: string;
}

interface DevelopmentPlan {
  id: string;
  cycleId: string;
  employeeUserId: string;
  managerUserId: string;
  managerName: string;
  competenciesToDevelop: string[];
  developmentGoals: string;
  actionItems: ActionItem[];
  managerNotes: string | null;
  employeeNotes: string | null;
  feedbackSessionDate: string | null;
  reviewDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS = {
  draft: { label: "Bozza", variant: "secondary" as const },
  agreed: { label: "Concordato", variant: "default" as const },
  in_progress: { label: "In Corso", variant: "outline" as const },
  completed: { label: "Completato", variant: "default" as const },
};

const ACTION_STATUS_LABELS = {
  pending: "Da Fare",
  in_progress: "In Corso",
  completed: "Completato",
};

export default function EmployeeDevelopmentPlanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [employeeNotes, setEmployeeNotes] = useState<string>("");

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

  // Auto-select first cycle
  useState(() => {
    if (cycles.length > 0 && !selectedCycle) {
      const activeCycle = cycles.find(c => c.status === "active") || cycles[0];
      setSelectedCycle(activeCycle.id);
    }
  });

  // Fetch my development plan
  const { data: plan } = useQuery<DevelopmentPlan>({
    queryKey: ["/api/development-plans/mine", selectedCycle],
    queryFn: async () => {
      if (!selectedCycle) throw new Error("No cycle selected");
      const res = await apiRequest("GET", `/api/development-plans/mine/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  // Fetch competencies details
  const { data: allCompetencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/my-competencies"],
    enabled: !!user,
  });

  // Load employee notes from plan
  useState(() => {
    if (plan?.employeeNotes) {
      setEmployeeNotes(plan.employeeNotes);
    }
  });

  const competenciesToDevelop = allCompetencies.filter(c =>
    plan?.competenciesToDevelop?.includes(c.id)
  );

  const canEdit = plan?.status === "draft";

  // Update employee notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      if (!plan) throw new Error("No plan found");
      await apiRequest("PATCH", `/api/development-plans/${plan.id}/employee-notes`, {
        employeeNotes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/development-plans/mine", selectedCycle] });
      toast({
        title: "Note salvate",
        description: "Le tue note sono state salvate con successo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare le note",
        variant: "destructive",
      });
    },
  });

  const handleSaveNotes = () => {
    updateNotesMutation.mutate(employeeNotes);
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
                  context="SVILUPPO" 
                  title="Piano di Sviluppo" 
                  description="Il tuo piano di sviluppo personalizzato concordato con il manager"
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

              {plan ? (
                <>
                  {/* Status Card */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Stato</p>
                          <p className="text-lg font-medium">{STATUS_LABELS[plan.status as keyof typeof STATUS_LABELS]?.label || plan.status}</p>
                        </div>
                        <Badge variant={STATUS_LABELS[plan.status as keyof typeof STATUS_LABELS]?.variant || "secondary"}>
                          {STATUS_LABELS[plan.status as keyof typeof STATUS_LABELS]?.label || plan.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Manager</p>
                          <p className="font-medium">{plan.managerName}</p>
                        </div>
                        {plan.feedbackSessionDate && (
                          <div>
                            <p className="text-sm text-muted-foreground">Data Sessione Feedback</p>
                            <p className="font-medium">
                              {new Date(plan.feedbackSessionDate).toLocaleDateString("it-IT")}
                            </p>
                          </div>
                        )}
                        {plan.reviewDate && (
                          <div>
                            <p className="text-sm text-muted-foreground">Data Revisione</p>
                            <p className="font-medium">
                              {new Date(plan.reviewDate).toLocaleDateString("it-IT")}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Competencies to Develop */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Competenze da Sviluppare</CardTitle>
                      <CardDescription>
                        Focus di sviluppo identificato durante la valutazione
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {competenciesToDevelop.length > 0 ? (
                          competenciesToDevelop.map((comp) => (
                            <Badge key={comp.id} variant="secondary" className="text-sm py-1.5 px-3">
                              {comp.name}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Nessuna competenza specificata</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Development Goals */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Obiettivi di Sviluppo</CardTitle>
                      <CardDescription>
                        Gli obiettivi concordati per il tuo percorso di crescita
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                        {plan.developmentGoals || "Nessun obiettivo specificato"}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Azioni Concrete</CardTitle>
                      <CardDescription>
                        Passi specifici da completare per raggiungere gli obiettivi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {plan.actionItems && plan.actionItems.length > 0 ? (
                        <div className="space-y-3">
                          {plan.actionItems.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                              <CheckCircle
                                className={`h-5 w-5 shrink-0 mt-0.5 ${
                                  item.status === "completed"
                                    ? "text-green-600"
                                    : item.status === "in_progress"
                                    ? "text-blue-600"
                                    : "text-muted-foreground"
                                }`}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.action}</p>
                                <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                                  {item.deadline && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(item.deadline).toLocaleDateString("it-IT")}
                                    </div>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {ACTION_STATUS_LABELS[item.status as keyof typeof ACTION_STATUS_LABELS] || item.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Nessuna azione specificata
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Manager Notes */}
                  {plan.managerNotes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Note del Manager</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                          {plan.managerNotes}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Employee Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Le Tue Note</CardTitle>
                      <CardDescription>
                        {canEdit
                          ? "Aggiungi le tue riflessioni e considerazioni sul piano di sviluppo"
                          : "Le tue riflessioni sul piano di sviluppo"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={employeeNotes}
                        onChange={(e) => setEmployeeNotes(e.target.value)}
                        placeholder="Scrivi le tue note qui..."
                        rows={6}
                        disabled={!canEdit}
                      />
                      {canEdit && (
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSaveNotes}
                            disabled={updateNotesMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Salva Note
                          </Button>
                        </div>
                      )}
                      {!canEdit && plan.status !== "draft" && (
                        <p className="text-xs text-muted-foreground">
                          Le note non possono essere modificate dopo che il piano è stato concordato
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {cycles.length === 0
                        ? "Nessun ciclo di valutazione disponibile"
                        : "Nessun piano di sviluppo disponibile per questo ciclo"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Il piano verrà creato dal tuo manager dopo la valutazione
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
              title="Piano di Sviluppo"
            >
              <div className="space-y-4">
                {plan && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Info Piano</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Stato:</span>{" "}
                          <span className="font-medium">
                            {STATUS_LABELS[plan.status as keyof typeof STATUS_LABELS]?.label}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Competenze:</span>{" "}
                          <span className="font-medium">{competenciesToDevelop.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Azioni:</span>{" "}
                          <span className="font-medium">{plan.actionItems?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Il piano di sviluppo è uno strumento collaborativo per guidare la tua crescita professionale.
                        Discuti regolarmente con il tuo manager i progressi e gli aggiornamenti.
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
