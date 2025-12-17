import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppHeader from "@/components/AppHeader";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, Star, CheckCircle, AlertCircle, Save } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
  isTransversal: boolean;
}

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
  selfAssessmentStart: string;
  selfAssessmentEnd: string;
}

interface SelfAssessment {
  competencyId: string;
  rating: number;
  comment: string;
}

interface SavedAssessment {
  id: string;
  competencyId: string;
  rating: number;
  comment: string;
  submittedAt: string | null;
}

const RATING_LABELS = {
  1: "Insufficiente",
  2: "Base",
  3: "Intermedio",
  4: "Avanzato",
  5: "Esperto",
};

export default function EmployeeSelfAssessmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [assessments, setAssessments] = useState<Record<string, SelfAssessment>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch active cycles
  const { data: cycles = [] } = useQuery<EvaluationCycle[]>({
    queryKey: ["/api/evaluation-cycles/active"],
    enabled: !!user,
  });

  // Auto-select first active cycle
  useState(() => {
    if (cycles.length > 0 && !selectedCycle) {
      const activeCycle = cycles.find(c => c.status === "active") || cycles[0];
      setSelectedCycle(activeCycle.id);
    }
  });

  // Fetch competencies for my persona
  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/my-competencies"],
    enabled: !!user,
  });

  // Fetch existing self assessments
  const { data: savedAssessments = [] } = useQuery<SavedAssessment[]>({
    queryKey: ["/api/self-assessments", selectedCycle],
    queryFn: async () => {
      if (!selectedCycle) return [];
      const res = await apiRequest("GET", `/api/self-assessments/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  // Load saved assessments into state
  useState(() => {
    const loaded: Record<string, SelfAssessment> = {};
    savedAssessments.forEach(sa => {
      loaded[sa.competencyId] = {
        competencyId: sa.competencyId,
        rating: sa.rating,
        comment: sa.comment,
      };
    });
    setAssessments(loaded);
  });

  const isSubmitted = savedAssessments.some(sa => sa.submittedAt !== null);

  // Check if in assessment phase
  const selectedCycleData = cycles.find(c => c.id === selectedCycle);
  const now = new Date();
  const isInPhase = selectedCycleData
    ? now >= new Date(selectedCycleData.selfAssessmentStart) &&
      now <= new Date(selectedCycleData.selfAssessmentEnd)
    : false;

  // Calculate progress
  const totalCompetencies = competencies.length;
  const completedCompetencies = Object.keys(assessments).filter(
    key => assessments[key]?.rating > 0 && assessments[key]?.comment.trim() !== ""
  ).length;
  const progressPercent = totalCompetencies > 0 ? (completedCompetencies / totalCompetencies) * 100 : 0;

  const handleRatingChange = (competencyId: string, rating: number) => {
    setAssessments(prev => ({
      ...prev,
      [competencyId]: {
        competencyId,
        rating,
        comment: prev[competencyId]?.comment || "",
      },
    }));
  };

  const handleCommentChange = (competencyId: string, comment: string) => {
    setAssessments(prev => ({
      ...prev,
      [competencyId]: {
        competencyId,
        rating: prev[competencyId]?.rating || 0,
        comment,
      },
    }));
  };

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const assessmentsArray = Object.values(assessments).filter(
        a => a.rating > 0 && a.comment.trim() !== ""
      );

      await Promise.all(
        assessmentsArray.map(assessment =>
          apiRequest("POST", "/api/self-assessments", {
            cycleId: selectedCycle,
            ...assessment,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/self-assessments", selectedCycle] });
      toast({
        title: "Bozza salvata",
        description: "Le tue autovalutazioni sono state salvate come bozza.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare la bozza",
        variant: "destructive",
      });
    },
  });

  // Submit final mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const assessmentsArray = Object.values(assessments);

      // First save all assessments
      await Promise.all(
        assessmentsArray.map(assessment =>
          apiRequest("POST", "/api/self-assessments", {
            cycleId: selectedCycle,
            ...assessment,
          })
        )
      );

      // Then submit
      await apiRequest("POST", `/api/self-assessments/${selectedCycle}/submit`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/self-assessments", selectedCycle] });
      toast({
        title: "Autovalutazione inviata",
        description: "La tua autovalutazione è stata inviata con successo.",
      });
      setShowSubmitDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile inviare l'autovalutazione",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    saveDraftMutation.mutate();
  };

  const handleSubmit = () => {
    if (completedCompetencies < totalCompetencies) {
      toast({
        title: "Attenzione",
        description: "Devi completare tutte le competenze prima di inviare l'autovalutazione.",
        variant: "destructive",
      });
      return;
    }
    setShowSubmitDialog(true);
  };

  const categoryLabels: Record<string, string> = {
    technical: "Tecnica",
    behavioral: "Comportamentale",
    leadership: "Leadership",
    transversal: "Trasversale",
  };

  return (
    <>
      <AppHeader
        userName={user?.name || "Dipendente"}
        userRole={user?.role === "admin" ? "Amministratore" : "Dipendente"}
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
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="md3-headline-medium mb-2 flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10">
                      <FileCheck className="h-6 w-6 text-primary" />
                    </div>
                    Autovalutazione Competenze
                  </h1>
                  <p className="md3-body-large text-muted-foreground">
                    Valuta le tue competenze per il ciclo di valutazione corrente
                  </p>
                </div>

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

              {!isInPhase && selectedCycleData && !isSubmitted && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Fase non attiva</p>
                        <p className="text-sm text-orange-700 mt-1">
                          La fase di autovalutazione è attiva dal{" "}
                          {new Date(selectedCycleData.selfAssessmentStart).toLocaleDateString("it-IT")} al{" "}
                          {new Date(selectedCycleData.selfAssessmentEnd).toLocaleDateString("it-IT")}.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isSubmitted && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Autovalutazione inviata</p>
                        <p className="text-sm text-green-700 mt-1">
                          Hai già inviato la tua autovalutazione per questo ciclo. Non è più possibile modificarla.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedCycle && competencies.length > 0 ? (
                <>
                  {/* Progress Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Avanzamento</CardTitle>
                      <CardDescription>
                        {completedCompetencies} di {totalCompetencies} competenze completate
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={progressPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {progressPercent.toFixed(0)}% completato
                      </p>
                    </CardContent>
                  </Card>

                  {/* Competencies List */}
                  <div className="space-y-4">
                    {competencies.map((competency) => {
                      const assessment = assessments[competency.id];
                      const isComplete = assessment?.rating > 0 && assessment?.comment?.trim() !== "";

                      return (
                        <Card key={competency.id} className={isComplete ? "border-green-200" : ""}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CardTitle className="text-base">{competency.name}</CardTitle>
                                  {isComplete && <CheckCircle className="h-4 w-4 text-green-600" />}
                                </div>
                                <CardDescription>{competency.description}</CardDescription>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline">
                                    {categoryLabels[competency.category] || competency.category}
                                  </Badge>
                                  {competency.isTransversal && (
                                    <Badge variant="secondary">Trasversale</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Rating */}
                            <div className="space-y-2">
                              <Label>Valutazione (1-5)</Label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Button
                                    key={rating}
                                    type="button"
                                    variant={assessment?.rating === rating ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleRatingChange(competency.id, rating)}
                                    disabled={isSubmitted}
                                  >
                                    <Star
                                      className={`h-4 w-4 mr-1 ${
                                        assessment?.rating === rating ? "fill-current" : ""
                                      }`}
                                    />
                                    {rating}
                                  </Button>
                                ))}
                              </div>
                              {assessment?.rating > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {RATING_LABELS[assessment.rating as keyof typeof RATING_LABELS]}
                                </p>
                              )}
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                              <Label htmlFor={`comment-${competency.id}`}>
                                Commento <span className="text-destructive">*</span>
                              </Label>
                              <Textarea
                                id={`comment-${competency.id}`}
                                placeholder="Descrivi la tua valutazione e fornisci esempi concreti..."
                                value={assessment?.comment || ""}
                                onChange={(e) => handleCommentChange(competency.id, e.target.value)}
                                rows={4}
                                disabled={isSubmitted}
                              />
                              <p className="text-xs text-muted-foreground">
                                {assessment?.comment?.length || 0} caratteri
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  {!isSubmitted && (
                    <div className="flex gap-3 justify-end sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
                      <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={saveDraftMutation.isPending || Object.keys(assessments).length === 0}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salva Bozza
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={
                          submitMutation.isPending ||
                          completedCompetencies < totalCompetencies ||
                          !isInPhase
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Invia Autovalutazione
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {cycles.length === 0
                        ? "Nessun ciclo di valutazione disponibile"
                        : competencies.length === 0
                        ? "Nessuna competenza assegnata al tuo profilo"
                        : "Seleziona un ciclo per iniziare l'autovalutazione"}
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
              title="Autovalutazione"
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Avanzamento</p>
                    <div className="space-y-2">
                      <Progress value={progressPercent} className="h-2" />
                      <p className="text-sm">
                        {completedCompetencies}/{totalCompetencies} competenze
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Valuta te stesso su una scala da 1 a 5 per ogni competenza e fornisci un commento dettagliato
                      con esempi concreti del tuo lavoro.
                    </p>
                  </div>
                </div>
              </div>
            </AppActionsPanel>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma invio autovalutazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler inviare la tua autovalutazione? Una volta inviata, non potrai più modificarla.
              <br />
              <br />
              Hai completato {completedCompetencies} su {totalCompetencies} competenze.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => submitMutation.mutate()}>
              Conferma Invio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
