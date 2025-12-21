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
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Star, CheckCircle, Clock, Send, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: string;
  name: string;
  department: string | null;
  role: string;
}

interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
  enable360Feedback: boolean;
  peerFeedbackStart: string;
  peerFeedbackEnd: string;
}

interface PeerFeedbackRequest {
  id: string;
  peerUserId: string;
  peerUserName: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
}

interface PeerFeedback {
  competencyId: string;
  rating: number;
  comment: string;
}

interface AggregatedFeedback {
  competencyId: string;
  competencyName: string;
  avgRating: number;
  count: number;
  comments: string[];
}

const RATING_LABELS = {
  1: "Insufficiente",
  2: "Base",
  3: "Intermedio",
  4: "Avanzato",
  5: "Esperto",
};

export default function EmployeePeerFeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);
  const [activeFeedbackRequest, setActiveFeedbackRequest] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, PeerFeedback>>({});

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch active cycles with 360° enabled
  const { data: cycles = [] } = useQuery<EvaluationCycle[]>({
    queryKey: ["/api/evaluation-cycles/active-360"],
    enabled: !!user,
  });

  // Auto-select first cycle with 360° enabled
  useState(() => {
    if (cycles.length > 0 && !selectedCycle) {
      const activeCycle = cycles.find(c => c.status === "active" && c.enable360Feedback) || cycles[0];
      if (activeCycle) setSelectedCycle(activeCycle.id);
    }
  });

  // Fetch all users (potential peers)
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Filter out self from peer list
  const availablePeers = allUsers.filter(u => u.id !== user?.id);

  // Fetch my peer feedback requests (sent)
  const { data: sentRequests = [] } = useQuery<PeerFeedbackRequest[]>({
    queryKey: ["/api/peer-feedback-requests/sent", selectedCycle],
    queryFn: async () => {
      if (!selectedCycle) return [];
      const res = await apiRequest("GET", `/api/peer-feedback-requests/sent/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  // Fetch peer feedback requests I received
  const { data: receivedRequests = [] } = useQuery<PeerFeedbackRequest[]>({
    queryKey: ["/api/peer-feedback-requests/received", selectedCycle],
    queryFn: async () => {
      if (!selectedCycle) return [];
      const res = await apiRequest("GET", `/api/peer-feedback-requests/received/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  // Fetch aggregated 360° feedback I received
  const { data: aggregatedFeedback = [] } = useQuery<AggregatedFeedback[]>({
    queryKey: ["/api/peer-feedbacks/aggregated", selectedCycle],
    queryFn: async () => {
      if (!selectedCycle) return [];
      const res = await apiRequest("GET", `/api/peer-feedbacks/aggregated/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  // Fetch competencies for the person I'm giving feedback to
  const { data: feedbackCompetencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/peer-feedback-competencies", activeFeedbackRequest],
    queryFn: async () => {
      if (!activeFeedbackRequest) return [];
      const res = await apiRequest("GET", `/api/peer-feedback-competencies/${activeFeedbackRequest}`);
      return res.json();
    },
    enabled: !!activeFeedbackRequest,
  });

  const selectedCycleData = cycles.find(c => c.id === selectedCycle);
  const now = new Date();
  const isInPhase = selectedCycleData
    ? now >= new Date(selectedCycleData.peerFeedbackStart) &&
      now <= new Date(selectedCycleData.peerFeedbackEnd)
    : false;

  // Request feedback mutation
  const requestFeedbackMutation = useMutation({
    mutationFn: async (peerIds: string[]) => {
      await apiRequest("POST", "/api/peer-feedback-requests", {
        cycleId: selectedCycle,
        peerUserIds: peerIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/peer-feedback-requests/sent", selectedCycle] });
      toast({
        title: "Richieste inviate",
        description: `Hai richiesto feedback a ${selectedPeers.length} colleghi.`,
      });
      setShowRequestDialog(false);
      setSelectedPeers([]);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile inviare le richieste",
        variant: "destructive",
      });
    },
  });

  // Submit peer feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: { requestId: string; feedbacks: PeerFeedback[] }) => {
      await apiRequest("POST", "/api/peer-feedbacks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/peer-feedback-requests/received", selectedCycle] });
      toast({
        title: "Feedback inviato",
        description: "Il tuo feedback è stato inviato in modo anonimo.",
      });
      setActiveFeedbackRequest(null);
      setFeedbacks({});
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile inviare il feedback",
        variant: "destructive",
      });
    },
  });

  const handleRequestFeedback = () => {
    if (selectedPeers.length === 0) {
      toast({
        title: "Attenzione",
        description: "Seleziona almeno un collega",
        variant: "destructive",
      });
      return;
    }
    requestFeedbackMutation.mutate(selectedPeers);
  };

  const handleRatingChange = (competencyId: string, rating: number) => {
    setFeedbacks(prev => ({
      ...prev,
      [competencyId]: {
        competencyId,
        rating,
        comment: prev[competencyId]?.comment || "",
      },
    }));
  };

  const handleCommentChange = (competencyId: string, comment: string) => {
    setFeedbacks(prev => ({
      ...prev,
      [competencyId]: {
        competencyId,
        rating: prev[competencyId]?.rating || 0,
        comment,
      },
    }));
  };

  const handleSubmitFeedback = () => {
    if (!activeFeedbackRequest) return;

    const feedbacksArray = Object.values(feedbacks);
    const allComplete = feedbacksArray.length === feedbackCompetencies.length &&
      feedbacksArray.every(f => f.rating > 0 && f.comment.trim() !== "");

    if (!allComplete) {
      toast({
        title: "Attenzione",
        description: "Completa tutte le valutazioni prima di inviare",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      requestId: activeFeedbackRequest,
      feedbacks: feedbacksArray,
    });
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
        userName={`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Dipendente"}
        userRole={user?.role === "admin" ? "Amministratore" : "Dipendente"}
        notificationCount={receivedRequests.filter(r => r.status === "pending").length}
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
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    Feedback 360°
                  </h1>
                  <p className="md3-body-large text-muted-foreground">
                    Richiedi e fornisci feedback anonimi ai colleghi
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

              {selectedCycle && selectedCycleData ? (
                <Tabs defaultValue="request" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="request">Richiedi Feedback</TabsTrigger>
                    <TabsTrigger value="give">
                      Fornisci Feedback
                      {receivedRequests.filter(r => r.status === "pending").length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {receivedRequests.filter(r => r.status === "pending").length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="results">I Miei Risultati 360°</TabsTrigger>
                  </TabsList>

                  {/* Tab: Request Feedback */}
                  <TabsContent value="request" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Richiedi Feedback ai Colleghi</CardTitle>
                        <CardDescription>
                          Seleziona i colleghi da cui vuoi ricevere feedback anonimo sulle tue competenze
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={() => setShowRequestDialog(true)} disabled={!isInPhase}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Nuova Richiesta
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Sent Requests List */}
                    <div className="space-y-3">
                      <h3 className="font-medium">Richieste Inviate</h3>
                      {sentRequests.length > 0 ? (
                        sentRequests.map((request) => (
                          <Card key={request.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{request.peerUserName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Richiesto il {new Date(request.requestedAt).toLocaleDateString("it-IT")}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    request.status === "completed"
                                      ? "default"
                                      : request.status === "declined"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {request.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                  {request.status === "completed"
                                    ? "Completato"
                                    : request.status === "declined"
                                    ? "Rifiutato"
                                    : "In Attesa"}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            Nessuna richiesta inviata
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab: Give Feedback */}
                  <TabsContent value="give" className="space-y-4">
                    {activeFeedbackRequest ? (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle>Fornisci Feedback Anonimo</CardTitle>
                            <CardDescription>
                              Il tuo feedback sarà completamente anonimo e verrà aggregato con quelli di altri colleghi
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        <div className="space-y-4">
                          {feedbackCompetencies.map((competency) => {
                            const feedback = feedbacks[competency.id];

                            return (
                              <Card key={competency.id}>
                                <CardHeader>
                                  <CardTitle className="text-base">{competency.name}</CardTitle>
                                  <CardDescription>{competency.description}</CardDescription>
                                  <Badge variant="outline" className="w-fit">
                                    {categoryLabels[competency.category] || competency.category}
                                  </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Valutazione (1-5)</Label>
                                    <div className="flex gap-2">
                                      {[1, 2, 3, 4, 5].map((rating) => (
                                        <Button
                                          key={rating}
                                          type="button"
                                          variant={feedback?.rating === rating ? "default" : "outline"}
                                          size="sm"
                                          className="flex-1"
                                          onClick={() => handleRatingChange(competency.id, rating)}
                                        >
                                          <Star
                                            className={`h-4 w-4 mr-1 ${
                                              feedback?.rating === rating ? "fill-current" : ""
                                            }`}
                                          />
                                          {rating}
                                        </Button>
                                      ))}
                                    </div>
                                    {feedback?.rating > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        {RATING_LABELS[feedback.rating as keyof typeof RATING_LABELS]}
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Commento</Label>
                                    <Textarea
                                      placeholder="Fornisci un feedback costruttivo..."
                                      value={feedback?.comment || ""}
                                      onChange={(e) => handleCommentChange(competency.id, e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        <div className="flex gap-3 justify-end">
                          <Button variant="outline" onClick={() => setActiveFeedbackRequest(null)}>
                            Annulla
                          </Button>
                          <Button onClick={handleSubmitFeedback} disabled={submitFeedbackMutation.isPending}>
                            <Send className="h-4 w-4 mr-2" />
                            Invia Feedback
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="font-medium">Richieste Ricevute</h3>
                        {receivedRequests.length > 0 ? (
                          receivedRequests.map((request) => (
                            <Card key={request.id}>
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">Richiesta da {request.peerUserName}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Ricevuto il {new Date(request.requestedAt).toLocaleDateString("it-IT")}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge
                                      variant={request.status === "completed" ? "default" : "secondary"}
                                    >
                                      {request.status === "completed" ? "Completato" : "In Attesa"}
                                    </Badge>
                                    {request.status === "pending" && (
                                      <Button
                                        size="sm"
                                        onClick={() => setActiveFeedbackRequest(request.id)}
                                      >
                                        Fornisci Feedback
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                              Nessuna richiesta ricevuta
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab: My 360° Results */}
                  <TabsContent value="results" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>I Tuoi Risultati 360°</CardTitle>
                        <CardDescription>
                          Feedback anonimi aggregati ricevuti dai tuoi colleghi
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    {aggregatedFeedback.length > 0 ? (
                      <div className="space-y-4">
                        {aggregatedFeedback.map((agg) => (
                          <Card key={agg.competencyId}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{agg.competencyName}</CardTitle>
                                <div className="text-right">
                                  <p className="text-2xl font-bold">{agg.avgRating.toFixed(1)}</p>
                                  <p className="text-xs text-muted-foreground">{agg.count} feedback</p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Label>Commenti anonimi:</Label>
                                {agg.comments.map((comment, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-muted rounded-lg text-sm"
                                  >
                                    {comment}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Nessun feedback ricevuto per questo ciclo
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {cycles.length === 0
                        ? "Nessun ciclo con feedback 360° disponibile"
                        : "Seleziona un ciclo per gestire il feedback 360°"}
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
              title="Feedback 360°"
            >
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Il feedback 360° ti permette di ricevere valutazioni anonime dai tuoi colleghi e di fornire
                  feedback agli altri in modo costruttivo.
                </p>
              </div>
            </AppActionsPanel>
          )}
        </div>
      </div>

      {/* Request Feedback Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Richiedi Feedback ai Colleghi</DialogTitle>
            <DialogDescription>
              Seleziona i colleghi da cui vuoi ricevere feedback anonimo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {availablePeers.map((peer) => (
              <div key={peer.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={peer.id}
                  checked={selectedPeers.includes(peer.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPeers([...selectedPeers, peer.id]);
                    } else {
                      setSelectedPeers(selectedPeers.filter(id => id !== peer.id));
                    }
                  }}
                />
                <label htmlFor={peer.id} className="flex-1 cursor-pointer">
                  <p className="font-medium">{peer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {peer.department} - {peer.role === "admin" ? "Amministratore" : peer.role === "manager" ? "Manager" : "Dipendente"}
                  </p>
                </label>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleRequestFeedback}
              disabled={selectedPeers.length === 0 || requestFeedbackMutation.isPending}
            >
              Invia Richieste ({selectedPeers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
