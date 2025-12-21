import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppHeader from "@/components/AppHeader";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Pencil, Trash2, PlayCircle, CheckCircle, Archive } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: "draft" | "active" | "completed" | "archived";
  selfAssessmentStart: string | null;
  selfAssessmentEnd: string | null;
  peerFeedbackStart: string | null;
  peerFeedbackEnd: string | null;
  managerEvaluationStart: string | null;
  managerEvaluationEnd: string | null;
  feedbackDeliveryStart: string | null;
  feedbackDeliveryEnd: string | null;
  enable360Feedback: boolean;
  createdAt: string;
}

const statusLabels = {
  draft: { label: "Bozza", variant: "secondary" as const, icon: Pencil },
  active: { label: "Attivo", variant: "default" as const, icon: PlayCircle },
  completed: { label: "Completato", variant: "outline" as const, icon: CheckCircle },
  archived: { label: "Archiviato", variant: "outline" as const, icon: Archive },
};

export default function AdminEvaluationCyclesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<EvaluationCycle | null>(null);
  const [deleteCycleId, setDeleteCycleId] = useState<string | null>(null);
  const [statusChangeCycle, setStatusChangeCycle] = useState<{ id: string; newStatus: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    enable360Feedback: true,
    selfAssessmentStart: "",
    selfAssessmentEnd: "",
    peerFeedbackStart: "",
    peerFeedbackEnd: "",
    managerEvaluationStart: "",
    managerEvaluationEnd: "",
    feedbackDeliveryStart: "",
    feedbackDeliveryEnd: "",
  });

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch evaluation cycles
  const { data: cycles = [] } = useQuery<EvaluationCycle[]>({
    queryKey: ["/api/admin/evaluation-cycles"],
    enabled: !!user,
  });

  // Create/Update Cycle Mutation
  const saveCycleMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCycle) {
        const res = await apiRequest("PATCH", `/api/admin/evaluation-cycles/${editingCycle.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/evaluation-cycles", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/evaluation-cycles"] });
      toast({ title: editingCycle ? "Ciclo aggiornato" : "Ciclo creato con successo" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Operazione fallita",
        variant: "destructive",
      });
    },
  });

  // Delete Cycle Mutation
  const deleteCycleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/evaluation-cycles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/evaluation-cycles"] });
      toast({ title: "Ciclo eliminato con successo" });
      setDeleteCycleId(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile eliminare il ciclo",
        variant: "destructive",
      });
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/evaluation-cycles/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/evaluation-cycles"] });
      toast({ title: "Stato aggiornato con successo" });
      setStatusChangeCycle(null);
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
    setFormData({
      name: "",
      year: new Date().getFullYear(),
      enable360Feedback: true,
      selfAssessmentStart: "",
      selfAssessmentEnd: "",
      peerFeedbackStart: "",
      peerFeedbackEnd: "",
      managerEvaluationStart: "",
      managerEvaluationEnd: "",
      feedbackDeliveryStart: "",
      feedbackDeliveryEnd: "",
    });
    setEditingCycle(null);
  };

  const handleEdit = (cycle: EvaluationCycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      year: cycle.year,
      enable360Feedback: cycle.enable360Feedback,
      selfAssessmentStart: cycle.selfAssessmentStart ? cycle.selfAssessmentStart.split('T')[0] : "",
      selfAssessmentEnd: cycle.selfAssessmentEnd ? cycle.selfAssessmentEnd.split('T')[0] : "",
      peerFeedbackStart: cycle.peerFeedbackStart ? cycle.peerFeedbackStart.split('T')[0] : "",
      peerFeedbackEnd: cycle.peerFeedbackEnd ? cycle.peerFeedbackEnd.split('T')[0] : "",
      managerEvaluationStart: cycle.managerEvaluationStart ? cycle.managerEvaluationStart.split('T')[0] : "",
      managerEvaluationEnd: cycle.managerEvaluationEnd ? cycle.managerEvaluationEnd.split('T')[0] : "",
      feedbackDeliveryStart: cycle.feedbackDeliveryStart ? cycle.feedbackDeliveryStart.split('T')[0] : "",
      feedbackDeliveryEnd: cycle.feedbackDeliveryEnd ? cycle.feedbackDeliveryEnd.split('T')[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }

    const payload = {
      ...formData,
      selfAssessmentStart: formData.selfAssessmentStart || null,
      selfAssessmentEnd: formData.selfAssessmentEnd || null,
      peerFeedbackStart: formData.peerFeedbackStart || null,
      peerFeedbackEnd: formData.peerFeedbackEnd || null,
      managerEvaluationStart: formData.managerEvaluationStart || null,
      managerEvaluationEnd: formData.managerEvaluationEnd || null,
      feedbackDeliveryStart: formData.feedbackDeliveryStart || null,
      feedbackDeliveryEnd: formData.feedbackDeliveryEnd || null,
    };

    saveCycleMutation.mutate(payload);
  };

  const handleStatusChange = (cycleId: string, newStatus: string) => {
    setStatusChangeCycle({ id: cycleId, newStatus });
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start || !end) return "Non configurato";
    try {
      return `${format(new Date(start), "dd MMM", { locale: it })} - ${format(new Date(end), "dd MMM yyyy", { locale: it })}`;
    } catch {
      return "Data non valida";
    }
  };

  return (
    <>
      <AppHeader
        userName={`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Amministratore"}
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
              <div>
                <h1 className="md3-headline-medium mb-2 flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  Cicli di Valutazione
                </h1>
                <p className="md3-body-large text-muted-foreground">
                  Configura e gestisci i cicli annuali di valutazione delle competenze
                </p>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {cycles.length} cicli configurati
                </p>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Ciclo
                </Button>
              </div>

              <div className="grid gap-4">
                {cycles.map((cycle) => {
                  const statusInfo = statusLabels[cycle.status];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <Card key={cycle.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-xl">{cycle.name}</CardTitle>
                              <Badge variant={statusInfo.variant}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              {cycle.enable360Feedback && (
                                <Badge variant="outline">360° Attivo</Badge>
                              )}
                            </div>
                            <CardDescription>Anno: {cycle.year}</CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(cycle)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteCycleId(cycle.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Phase Timeline */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Autovalutazione</p>
                              <p className="text-sm">{formatDateRange(cycle.selfAssessmentStart, cycle.selfAssessmentEnd)}</p>
                            </div>
                            {cycle.enable360Feedback && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Feedback 360°</p>
                                <p className="text-sm">{formatDateRange(cycle.peerFeedbackStart, cycle.peerFeedbackEnd)}</p>
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Valutazione Manager</p>
                              <p className="text-sm">{formatDateRange(cycle.managerEvaluationStart, cycle.managerEvaluationEnd)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Restituzione Feedback</p>
                              <p className="text-sm">{formatDateRange(cycle.feedbackDeliveryStart, cycle.feedbackDeliveryEnd)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status Actions */}
                        <div className="flex gap-2 pt-3 border-t">
                          {cycle.status === "draft" && (
                            <Button size="sm" onClick={() => handleStatusChange(cycle.id, "active")}>
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Attiva Ciclo
                            </Button>
                          )}
                          {cycle.status === "active" && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(cycle.id, "completed")}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Completa Ciclo
                            </Button>
                          )}
                          {cycle.status === "completed" && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(cycle.id, "archived")}>
                              <Archive className="h-4 w-4 mr-1" />
                              Archivia
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {cycles.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Nessun ciclo di valutazione configurato</p>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crea Primo Ciclo
                    </Button>
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
              title="Cicli Valutazione"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Statistiche</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-center">
                      <div className="text-lg font-bold text-primary">{cycles.filter(c => c.status === "active").length}</div>
                      <div className="text-xs text-muted-foreground">Attivi</div>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/10 text-center">
                      <div className="text-lg font-bold text-green-600">{cycles.filter(c => c.status === "completed").length}</div>
                      <div className="text-xs text-muted-foreground">Completati</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    I cicli di valutazione definiscono le tempistiche del processo: autovalutazione, feedback 360°, valutazione manager e restituzione feedback.
                  </p>
                </div>
              </div>
            </AppActionsPanel>
          )}
        </div>
      </div>

      {/* Cycle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCycle ? "Modifica Ciclo" : "Nuovo Ciclo di Valutazione"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cycle-name">Nome Ciclo *</Label>
                <Input
                  id="cycle-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Performance Review 2024"
                />
              </div>
              <div>
                <Label htmlFor="cycle-year">Anno *</Label>
                <Input
                  id="cycle-year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable-360"
                checked={formData.enable360Feedback}
                onChange={(e) => setFormData({ ...formData, enable360Feedback: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="enable-360" className="font-normal">
                Abilita Feedback 360° per questo ciclo
              </Label>
            </div>

            {/* Phase Dates */}
            <div className="space-y-4">
              <h3 className="font-semibold">Tempistiche Fasi</h3>

              {/* Self Assessment */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="self-start" className="text-xs">Autovalutazione - Inizio</Label>
                  <Input
                    id="self-start"
                    type="date"
                    value={formData.selfAssessmentStart}
                    onChange={(e) => setFormData({ ...formData, selfAssessmentStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="self-end" className="text-xs">Autovalutazione - Fine</Label>
                  <Input
                    id="self-end"
                    type="date"
                    value={formData.selfAssessmentEnd}
                    onChange={(e) => setFormData({ ...formData, selfAssessmentEnd: e.target.value })}
                  />
                </div>
              </div>

              {/* Peer Feedback */}
              {formData.enable360Feedback && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="peer-start" className="text-xs">Feedback 360° - Inizio</Label>
                    <Input
                      id="peer-start"
                      type="date"
                      value={formData.peerFeedbackStart}
                      onChange={(e) => setFormData({ ...formData, peerFeedbackStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="peer-end" className="text-xs">Feedback 360° - Fine</Label>
                    <Input
                      id="peer-end"
                      type="date"
                      value={formData.peerFeedbackEnd}
                      onChange={(e) => setFormData({ ...formData, peerFeedbackEnd: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Manager Evaluation */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="manager-start" className="text-xs">Valutazione Manager - Inizio</Label>
                  <Input
                    id="manager-start"
                    type="date"
                    value={formData.managerEvaluationStart}
                    onChange={(e) => setFormData({ ...formData, managerEvaluationStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="manager-end" className="text-xs">Valutazione Manager - Fine</Label>
                  <Input
                    id="manager-end"
                    type="date"
                    value={formData.managerEvaluationEnd}
                    onChange={(e) => setFormData({ ...formData, managerEvaluationEnd: e.target.value })}
                  />
                </div>
              </div>

              {/* Feedback Delivery */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="feedback-start" className="text-xs">Restituzione Feedback - Inizio</Label>
                  <Input
                    id="feedback-start"
                    type="date"
                    value={formData.feedbackDeliveryStart}
                    onChange={(e) => setFormData({ ...formData, feedbackDeliveryStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="feedback-end" className="text-xs">Restituzione Feedback - Fine</Label>
                  <Input
                    id="feedback-end"
                    type="date"
                    value={formData.feedbackDeliveryEnd}
                    onChange={(e) => setFormData({ ...formData, feedbackDeliveryEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} disabled={saveCycleMutation.isPending}>
              {saveCycleMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCycleId} onOpenChange={(open) => !open && setDeleteCycleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Ciclo</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo ciclo di valutazione? Tutte le valutazioni e i dati associati verranno eliminati. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCycleId && deleteCycleMutation.mutate(deleteCycleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation */}
      <AlertDialog open={!!statusChangeCycle} onOpenChange={(open) => !open && setStatusChangeCycle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambia Stato Ciclo</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler cambiare lo stato di questo ciclo a "{statusChangeCycle && statusLabels[statusChangeCycle.newStatus as keyof typeof statusLabels]?.label}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => statusChangeCycle && updateStatusMutation.mutate({ id: statusChangeCycle.id, status: statusChangeCycle.newStatus })}
            >
              Conferma
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
