import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
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
import { FileCheck, Star, CheckCircle, ArrowLeft, Save, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface SelfAssessment {
  competencyId: string;
  competencyName: string;
  rating: number;
  comment: string;
}

interface PeerFeedbackAggregated {
  competencyId: string;
  competencyName: string;
  avgRating: number;
  count: number;
  comments: string[];
}

interface ManagerEvaluation {
  competencyId: string;
  rating: number;
  comment: string;
}

interface SavedManagerEvaluation {
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

const CATEGORY_LABELS: Record<string, string> = {
  technical: "Tecnica",
  behavioral: "Comportamentale",
  leadership: "Leadership",
  transversal: "Trasversale",
};

export default function ManagerEmployeeEvaluationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [, params] = useRoute("/manager/team-evaluations/:userId/:cycleId");
  const [evaluations, setEvaluations] = useState<Record<string, ManagerEvaluation>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const userId = params?.userId || "";
  const cycleId = params?.cycleId || "";

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch employee info
  const { data: employee } = useQuery({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  // Fetch competencies for employee
  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/manager/employee-competencies", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/manager/employee-competencies/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  // Fetch employee self-assessments
  const { data: selfAssessments = [] } = useQuery<SelfAssessment[]>({
    queryKey: ["/api/manager/employee-self-assessment", userId, cycleId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/manager/employee-self-assessment/${userId}/${cycleId}`);
      return res.json();
    },
    enabled: !!userId && !!cycleId,
  });

  // Fetch aggregated peer feedback
  const { data: peerFeedback = [] } = useQuery<PeerFeedbackAggregated[]>({
    queryKey: ["/api/manager/employee-peer-feedback", userId, cycleId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/manager/employee-peer-feedback/${userId}/${cycleId}`);
      return res.json();
    },
    enabled: !!userId && !!cycleId,
  });

  // Fetch my manager evaluations
  const { data: savedEvaluations = [] } = useQuery<SavedManagerEvaluation[]>({
    queryKey: ["/api/manager/my-evaluations", userId, cycleId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/manager/my-evaluations/${userId}/${cycleId}`);
      return res.json();
    },
    enabled: !!userId && !!cycleId,
  });

  // Load saved evaluations into state
  useState(() => {
    const loaded: Record<string, ManagerEvaluation> = {};
    savedEvaluations.forEach(ev => {
      loaded[ev.competencyId] = {
        competencyId: ev.competencyId,
        rating: ev.rating,
        comment: ev.comment,
      };
    });
    setEvaluations(loaded);
  });

  const isSubmitted = savedEvaluations.some(ev => ev.submittedAt !== null);

  // Calculate progress
  const totalCompetencies = competencies.length;
  const completedEvaluations = Object.keys(evaluations).filter(
    key => evaluations[key]?.rating > 0 && evaluations[key]?.comment.trim() !== ""
  ).length;

  const handleRatingChange = (competencyId: string, rating: number) => {
    setEvaluations(prev => ({
      ...prev,
      [competencyId]: {
        competencyId,
        rating,
        comment: prev[competencyId]?.comment || "",
      },
    }));
  };

  const handleCommentChange = (competencyId: string, comment: string) => {
    setEvaluations(prev => ({
      ...prev,
      [competencyId]: {
        competencyId,
        rating: prev[competencyId]?.rating || 0,
        comment,
      },
    }));
  };

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const evaluationsArray = Object.values(evaluations).filter(
        e => e.rating > 0 && e.comment.trim() !== ""
      );

      await Promise.all(
        evaluationsArray.map(evaluation =>
          apiRequest("POST", "/api/manager/evaluations", {
            cycleId,
            employeeUserId: userId,
            ...evaluation,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/my-evaluations", userId, cycleId] });
      toast({
        title: "Bozza salvata",
        description: "Le valutazioni sono state salvate come bozza.",
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
      const evaluationsArray = Object.values(evaluations);

      // First save all evaluations
      await Promise.all(
        evaluationsArray.map(evaluation =>
          apiRequest("POST", "/api/manager/evaluations", {
            cycleId,
            employeeUserId: userId,
            ...evaluation,
          })
        )
      );

      // Then submit
      await apiRequest("POST", `/api/manager/evaluations/${cycleId}/${userId}/submit`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/my-evaluations", userId, cycleId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manager/team-evaluations", cycleId] });
      toast({
        title: "Valutazione inviata",
        description: "La valutazione è stata inviata con successo.",
      });
      setShowSubmitDialog(false);
      navigate("/manager/team-evaluations");
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile inviare la valutazione",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    saveDraftMutation.mutate();
  };

  const handleSubmit = () => {
    if (completedEvaluations < totalCompetencies) {
      toast({
        title: "Attenzione",
        description: "Devi completare tutte le competenze prima di inviare la valutazione.",
        variant: "destructive",
      });
      return;
    }
    setShowSubmitDialog(true);
  };

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          {/* SIDEBAR CONTAINER */}
          {/* MAIN CONTENT */}
          <main className="w-full space-y-6 flex flex-col pt-4" >
            <div className="w-full space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate("/manager/team-evaluations")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alla Lista
                </Button>
              </div>

              <div>
                <h1 className="md3-headline-medium mb-2 flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  Valutazione: {employee?.name}
                </h1>
                <p className="md3-body-large text-muted-foreground">
                  Rivedi l'autovalutazione e il feedback 360°, quindi fornisci la tua valutazione
                </p>
              </div>

              {isSubmitted && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Valutazione inviata</p>
                        <p className="text-sm text-green-700 mt-1">
                          Hai già inviato la valutazione per questo collaboratore. Non è più possibile modificarla.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {competencies.length > 0 ? (
                <Tabs defaultValue="my-evaluation" className="w-full">
                  <TabsList className="mb-6 bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 space-x-8">
                    <TabsTrigger value="self-assessment" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Autovalutazione</TabsTrigger>
                    <TabsTrigger value="peer-feedback" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">
                      Feedback 360°
                      {peerFeedback.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{peerFeedback.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="my-evaluation" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">La Mia Valutazione</TabsTrigger>
                    {isSubmitted && <TabsTrigger value="comparison" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Confronto</TabsTrigger>}
                  </TabsList>

                  {/* Tab: Self Assessment */}
                  <TabsContent value="self-assessment" className="space-y-4">
                    {selfAssessments.length > 0 ? (
                      selfAssessments.map((sa) => (
                        <Card key={sa.competencyId}>
                          <CardHeader>
                            <CardTitle className="text-base">{sa.competencyName}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label className="text-sm text-muted-foreground">Valutazione</Label>
                              <div className="flex items-center gap-2 mt-1">
                                {[...Array(5)].map((_, idx) => (
                                  <Star
                                    key={idx}
                                    className={`h-5 w-5 ${
                                      idx < sa.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 font-medium">{sa.rating}/5</span>
                                <span className="text-sm text-muted-foreground">
                                  ({RATING_LABELS[sa.rating as keyof typeof RATING_LABELS]})
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Commento</Label>
                              <div className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                                {sa.comment}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          Nessuna autovalutazione disponibile
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Tab: Peer Feedback */}
                  <TabsContent value="peer-feedback" className="space-y-4">
                    {peerFeedback.length > 0 ? (
                      peerFeedback.map((pf) => (
                        <Card key={pf.competencyId}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{pf.competencyName}</CardTitle>
                              <div className="text-right">
                                <p className="text-2xl font-bold">{pf.avgRating.toFixed(1)}/5</p>
                                <p className="text-xs text-muted-foreground">{pf.count} feedback</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Label className="text-sm text-muted-foreground">Commenti anonimi:</Label>
                            <div className="space-y-2 mt-2">
                              {pf.comments.map((comment, idx) => (
                                <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                                  {comment}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          Nessun feedback 360° disponibile
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Tab: My Evaluation */}
                  <TabsContent value="my-evaluation" className="space-y-4">
                    {/* Progress */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Avanzamento</CardTitle>
                        <CardDescription>
                          {completedEvaluations} di {totalCompetencies} competenze valutate
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    {/* Competencies */}
                    {competencies.map((competency) => {
                      const evaluation = evaluations[competency.id];
                      const isComplete = evaluation?.rating > 0 && evaluation?.comment?.trim() !== "";

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
                                <Badge variant="outline" className="mt-2">
                                  {CATEGORY_LABELS[competency.category] || competency.category}
                                </Badge>
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
                                    variant={evaluation?.rating === rating ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleRatingChange(competency.id, rating)}
                                    disabled={isSubmitted}
                                  >
                                    <Star
                                      className={`h-4 w-4 mr-1 ${
                                        evaluation?.rating === rating ? "fill-current" : ""
                                      }`}
                                    />
                                    {rating}
                                  </Button>
                                ))}
                              </div>
                              {evaluation?.rating > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {RATING_LABELS[evaluation.rating as keyof typeof RATING_LABELS]}
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
                                placeholder="Fornisci un feedback dettagliato basato su fatti osservabili..."
                                value={evaluation?.comment || ""}
                                onChange={(e) => handleCommentChange(competency.id, e.target.value)}
                                rows={4}
                                disabled={isSubmitted}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Action Buttons */}
                    {!isSubmitted && (
                      <div className="flex gap-3 justify-end sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
                        <Button
                          variant="outline"
                          onClick={handleSaveDraft}
                          disabled={saveDraftMutation.isPending || Object.keys(evaluations).length === 0}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salva Bozza
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={submitMutation.isPending || completedEvaluations < totalCompetencies}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Invia Valutazione
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab: Comparison (only if submitted) */}
                  {isSubmitted && (
                    <TabsContent value="comparison" className="space-y-4">
                      {competencies.map((competency) => {
                        const selfAssessment = selfAssessments.find(sa => sa.competencyId === competency.id);
                        const peer = peerFeedback.find(pf => pf.competencyId === competency.id);
                        const managerEval = evaluations[competency.id];

                        return (
                          <Card key={competency.id}>
                            <CardHeader>
                              <CardTitle className="text-base">{competency.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-1">Autovalutazione</p>
                                  <p className="text-3xl font-bold text-blue-600">
                                    {selfAssessment?.rating || "-"}
                                  </p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-1">360° Feedback</p>
                                  <p className="text-3xl font-bold text-purple-600">
                                    {peer ? peer.avgRating.toFixed(1) : "-"}
                                  </p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-1">Manager</p>
                                  <p className="text-3xl font-bold text-green-600">
                                    {managerEval?.rating || "-"}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </TabsContent>
                  )}
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nessuna competenza disponibile per questo utente
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
              title="Valutazione"
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Progresso</p>
                    <p className="text-sm">
                      {completedEvaluations}/{totalCompetencies} competenze
                    </p>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Considera l'autovalutazione e il feedback 360° del collaboratore mentre fornisci la tua
                      valutazione. Fornisci commenti costruttivi e basati su fatti osservabili.
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
            <AlertDialogTitle>Conferma invio valutazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler inviare la valutazione per {employee?.name}? Una volta inviata, non potrai più
              modificarla.
              <br />
              <br />
              Hai completato {completedEvaluations} su {totalCompetencies} competenze.
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
