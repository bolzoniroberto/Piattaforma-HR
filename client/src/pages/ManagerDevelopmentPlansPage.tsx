import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { TrendingUp, Plus, Calendar, CheckCircle, Pencil, Trash2, Save } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

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

interface User {
  id: string;
  name: string;
  department: string | null;
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
  employeeUserName: string;
  competenciesToDevelop: string[];
  developmentGoals: string;
  actionItems: ActionItem[];
  managerNotes: string | null;
  employeeNotes: string | null;
  feedbackSessionDate: string | null;
  reviewDate: string | null;
  status: string;
  createdAt: string;
}

const STATUS_LABELS = {
  draft: { label: "Bozza", variant: "secondary" as const },
  agreed: { label: "Concordato", variant: "default" as const },
  in_progress: { label: "In Corso", variant: "outline" as const },
  completed: { label: "Completato", variant: "default" as const },
};

export default function ManagerDevelopmentPlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const [developmentGoals, setDevelopmentGoals] = useState("");
  const [managerNotes, setManagerNotes] = useState("");
  const [feedbackSessionDate, setFeedbackSessionDate] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>([{ action: "", deadline: null, status: "pending" }]);
  const [editingPlan, setEditingPlan] = useState<DevelopmentPlan | null>(null);

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

  // Fetch team members
  const { data: teamMembers = [] } = useQuery<User[]>({
    queryKey: ["/api/manager/team-members"],
    enabled: !!user,
  });

  // Fetch development plans for team
  const { data: plans = [] } = useQuery<DevelopmentPlan[]>({
    queryKey: ["/api/manager/development-plans", selectedCycle],
    queryFn: async () => {
      if (!selectedCycle) return [];
      const res = await apiRequest("GET", `/api/manager/development-plans/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  // Fetch competencies for selected employee
  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/manager/employee-competencies", selectedEmployee],
    queryFn: async () => {
      if (!selectedEmployee) return [];
      const res = await apiRequest("GET", `/api/manager/employee-competencies/${selectedEmployee}`);
      return res.json();
    },
    enabled: !!selectedEmployee,
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: {
      cycleId: string;
      employeeUserId: string;
      competenciesToDevelop: string[];
      developmentGoals: string;
      actionItems: ActionItem[];
      managerNotes: string;
      feedbackSessionDate: string | null;
      reviewDate: string | null;
    }) => {
      await apiRequest("POST", "/api/manager/development-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/development-plans", selectedCycle] });
      toast({
        title: "Piano creato",
        description: "Il piano di sviluppo è stato creato con successo.",
      });
      resetForm();
      setShowCreateDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile creare il piano",
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      competenciesToDevelop?: string[];
      developmentGoals?: string;
      actionItems?: ActionItem[];
      managerNotes?: string;
      feedbackSessionDate?: string | null;
      reviewDate?: string | null;
    }) => {
      const { id, ...updates } = data;
      await apiRequest("PATCH", `/api/manager/development-plans/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/development-plans", selectedCycle] });
      toast({
        title: "Piano aggiornato",
        description: "Il piano di sviluppo è stato aggiornato con successo.",
      });
      resetForm();
      setShowCreateDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare il piano",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/manager/development-plans/${data.id}/status`, {
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/development-plans", selectedCycle] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato del piano è stato aggiornato.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare lo stato",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedEmployee("");
    setSelectedCompetencies([]);
    setDevelopmentGoals("");
    setManagerNotes("");
    setFeedbackSessionDate("");
    setReviewDate("");
    setActionItems([{ action: "", deadline: null, status: "pending" }]);
    setEditingPlan(null);
  };

  const handleCreateOrUpdate = () => {
    const validActionItems = actionItems.filter(item => item.action.trim() !== "");

    if (!selectedEmployee || selectedCompetencies.length === 0 || !developmentGoals.trim()) {
      toast({
        title: "Attenzione",
        description: "Completa tutti i campi obbligatori",
        variant: "destructive",
      });
      return;
    }

    const data = {
      cycleId: selectedCycle,
      employeeUserId: selectedEmployee,
      competenciesToDevelop: selectedCompetencies,
      developmentGoals,
      actionItems: validActionItems,
      managerNotes,
      feedbackSessionDate: feedbackSessionDate || null,
      reviewDate: reviewDate || null,
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, ...data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const handleEdit = (plan: DevelopmentPlan) => {
    setEditingPlan(plan);
    setSelectedEmployee(plan.employeeUserId);
    setSelectedCompetencies(plan.competenciesToDevelop);
    setDevelopmentGoals(plan.developmentGoals);
    setManagerNotes(plan.managerNotes || "");
    setFeedbackSessionDate(plan.feedbackSessionDate ? plan.feedbackSessionDate.split("T")[0] : "");
    setReviewDate(plan.reviewDate ? plan.reviewDate.split("T")[0] : "");
    setActionItems(plan.actionItems.length > 0 ? plan.actionItems : [{ action: "", deadline: null, status: "pending" }]);
    setShowCreateDialog(true);
  };

  const addActionItem = () => {
    setActionItems([...actionItems, { action: "", deadline: null, status: "pending" }]);
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const updateActionItem = (index: number, field: keyof ActionItem, value: string) => {
    const updated = [...actionItems];
    updated[index] = { ...updated[index], [field]: value };
    setActionItems(updated);
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
                  context="SVILUPPO TEAM" 
                  title="Piani di Sviluppo Team" 
                  description="Crea e gestisci i piani di sviluppo dei membri del tuo team"
                />

                <div className="flex gap-3">
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
                  <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Piano
                  </Button>
                </div>
              </div>

              {selectedCycle ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Piani di Sviluppo</CardTitle>
                    <CardDescription>
                      Gestisci i piani di sviluppo creati per i membri del team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {plans.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Collaboratore</TableHead>
                            <TableHead>Competenze</TableHead>
                            <TableHead>Data Sessione</TableHead>
                            <TableHead>Azioni</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead className="text-right">Gestione</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {plans.map((plan) => (
                            <TableRow key={plan.id}>
                              <TableCell className="font-medium">{plan.employeeUserName}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{plan.competenciesToDevelop.length} competenze</Badge>
                              </TableCell>
                              <TableCell>
                                {plan.feedbackSessionDate ? (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(plan.feedbackSessionDate).toLocaleDateString("it-IT")}
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{plan.actionItems?.length || 0} azioni</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={STATUS_LABELS[plan.status as keyof typeof STATUS_LABELS]?.variant || "secondary"}>
                                  {STATUS_LABELS[plan.status as keyof typeof STATUS_LABELS]?.label || plan.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  {plan.status === "draft" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEdit(plan)}
                                    >
                                      <Pencil className="h-3 w-3 mr-1" />
                                      Modifica
                                    </Button>
                                  )}
                                  {plan.status === "draft" && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateStatusMutation.mutate({ id: plan.id, status: "agreed" })}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Concordato
                                    </Button>
                                  )}
                                  {plan.status === "agreed" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateStatusMutation.mutate({ id: plan.id, status: "in_progress" })}
                                    >
                                      In Corso
                                    </Button>
                                  )}
                                  {plan.status === "in_progress" && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateStatusMutation.mutate({ id: plan.id, status: "completed" })}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Completato
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        Nessun piano di sviluppo creato. Clicca "Nuovo Piano" per iniziare.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Seleziona un ciclo per gestire i piani di sviluppo
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
              title="Piani di Sviluppo"
            >
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  I piani di sviluppo sono strumenti collaborativi per guidare la crescita dei tuoi collaboratori.
                  Definisci obiettivi SMART e azioni concrete.
                </p>
              </div>
            </AppActionsPanel>
          )}
        </div>
      </div>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Modifica Piano di Sviluppo" : "Nuovo Piano di Sviluppo"}</DialogTitle>
            <DialogDescription>
              Crea un piano personalizzato per il collaboratore
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label>Collaboratore *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee} disabled={!!editingPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona collaboratore" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} {member.department && `- ${member.department}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competencies Selection */}
            {selectedEmployee && (
              <div className="space-y-2">
                <Label>Competenze da Sviluppare *</Label>
                <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
                  {competencies.map((comp) => (
                    <div key={comp.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={comp.id}
                        checked={selectedCompetencies.includes(comp.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCompetencies([...selectedCompetencies, comp.id]);
                          } else {
                            setSelectedCompetencies(selectedCompetencies.filter(id => id !== comp.id));
                          }
                        }}
                      />
                      <label htmlFor={comp.id} className="text-sm cursor-pointer flex-1">
                        <span className="font-medium">{comp.name}</span>
                        <span className="text-muted-foreground block text-xs">{comp.description}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Development Goals */}
            <div className="space-y-2">
              <Label htmlFor="goals">Obiettivi di Sviluppo *</Label>
              <Textarea
                id="goals"
                placeholder="Descrivi gli obiettivi di sviluppo in modo chiaro e misurabile..."
                value={developmentGoals}
                onChange={(e) => setDevelopmentGoals(e.target.value)}
                rows={5}
              />
            </div>

            {/* Action Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Azioni Concrete</Label>
                <Button type="button" size="sm" variant="outline" onClick={addActionItem}>
                  <Plus className="h-3 w-3 mr-1" />
                  Aggiungi Azione
                </Button>
              </div>
              <div className="space-y-3">
                {actionItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Descrizione azione..."
                        value={item.action}
                        onChange={(e) => updateActionItem(idx, "action", e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={item.deadline || ""}
                          onChange={(e) => updateActionItem(idx, "deadline", e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateActionItem(idx, "status", value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Da Fare</SelectItem>
                            <SelectItem value="in_progress">In Corso</SelectItem>
                            <SelectItem value="completed">Completato</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {actionItems.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeActionItem(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Manager Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note Manager</Label>
              <Textarea
                id="notes"
                placeholder="Note aggiuntive per il collaboratore..."
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feedbackDate">Data Sessione Feedback</Label>
                <Input
                  id="feedbackDate"
                  type="date"
                  value={feedbackSessionDate}
                  onChange={(e) => setFeedbackSessionDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewDate">Data Revisione</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowCreateDialog(false); }}>
              Annulla
            </Button>
            <Button
              onClick={handleCreateOrUpdate}
              disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingPlan ? "Aggiorna Piano" : "Crea Piano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
