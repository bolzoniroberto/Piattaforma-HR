import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import EmployeeCard from "@/components/EmployeeCard";
import DocumentList, { type Document } from "@/components/DocumentList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, AlertCircle, Target, Users, Leaf, Building, Calculator, Euro, TrendingUp, BarChart3, CheckCircle2, XCircle, Check, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ObjectiveAssignment, Document as DocumentType, IndicatorCluster, CalculationType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import StatusBadge, { type ObjectiveStatus } from "@/components/StatusBadge";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface EnrichedObjective {
  id: string;
  title: string;
  description: string;
  clusterName: string;
  clusterId: string;
  calculationTypeName: string;
  calculationTypeId: string;
  status: ObjectiveStatus;
  deadline?: string;
  progress: number;
  weight: number;
  economicValue: number;
  objectiveType?: string;
  targetValue?: number | null;
  thresholdValue?: number | null;
  actualValue?: number | null;
  qualitativeResult?: string | null;
  reportedAt?: Date | null;
}

export default function EmployeeDashboard() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [showRegulationModal, setShowRegulationModal] = useState(false);

  // Fetch user's objectives
  const { data: objectiveAssignments = [], isLoading: assignmentsLoading } = useQuery<
    Array<ObjectiveAssignment & { objective: any }>
  >({
    queryKey: ["/api/my-objectives"],
    enabled: !!user,
  });

  // Fetch documents
  const { data: allDocuments = [], isLoading: documentsLoading } = useQuery<DocumentType[]>({
    queryKey: ["/api/documents"],
    enabled: !!user,
  });

  // Fetch user stats
  const { data: stats } = useQuery<{
    totalObjectives: number;
    completedObjectives: number;
  }>({
    queryKey: ["/api/my-stats"],
    enabled: !!user,
  });

  // Fetch document acceptances
  const { data: acceptedDocs = [] } = useQuery<Array<{ documentId: string }>>({
    queryKey: ["/api/my-acceptances"],
    enabled: !!user,
  });

  // Mutation for updating objective status
  const updateObjectiveMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; status: string; progress?: number }) => {
      const res = await apiRequest("PATCH", `/api/assignments/${data.assignmentId}`, {
        status: data.status,
        progress: data.progress,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-stats"] });
      toast({ title: "Obiettivo aggiornato con successo" });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare l'obiettivo",
        variant: "destructive",
      });
    },
  });

  // Mutation for accepting MBO regulation
  const acceptRegulationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/accept-mbo-regulation", {});
      return res.json();
    },
    onSuccess: () => {
      // Invalidate user query to refetch user with updated mboRegulationAcceptedAt
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowRegulationModal(false);
      toast({ 
        title: "Regolamento accettato",
        description: "Hai accettato il regolamento MBO con successo"
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile accettare il regolamento",
        variant: "destructive",
      });
    },
  });

  // Transform API data to component format
  const employee = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      role: "Employee",
      department: user.department || "N/A",
      totalObjectives: stats?.totalObjectives || 0,
      completedObjectives: stats?.completedObjectives || 0,
      clusters: [],
      ral: parseFloat(String(user.ral || 0)),
      mboPercentage: user.mboPercentage || 0,
    };
  }, [user, stats]);

  // Calculate MBO target value
  const mboTarget = useMemo(() => {
    if (!employee) return 0;
    return employee.ral * (employee.mboPercentage / 100);
  }, [employee]);

  // Overall progress (weighted by objective weight, based on reported status)
  const overallProgress = useMemo(() => {
    if (objectiveAssignments.length === 0) return 0;
    let totalWeight = 0;
    let weightedProgress = 0;
    objectiveAssignments.forEach(a => {
      const weight = a.weight || 0;
      totalWeight += weight;
      
      const obj = a.objective as any;
      // If reported, use 100% if reached, 50% if partial, 0% if not reached
      // If not reported, use current progress
      let progressValue = a.progress || 0;
      if (obj?.reportedAt) {
        if (obj.qualitativeResult === "reached") {
          progressValue = 100;
        } else if (obj.qualitativeResult === "partial") {
          progressValue = 50;
        } else {
          progressValue = 0;
        }
      }
      
      weightedProgress += progressValue * weight;
    });
    if (totalWeight === 0) return 0;
    return Math.round(weightedProgress / totalWeight);
  }, [objectiveAssignments]);

  // Total assigned weight
  const totalWeight = useMemo(() => {
    return objectiveAssignments.reduce((sum, a) => sum + (a.weight || 0), 0);
  }, [objectiveAssignments]);

  const objectives: EnrichedObjective[] = useMemo(() => {
    return objectiveAssignments.map((assignment) => {
      const weight = assignment.weight || 0;
      const economicValue = mboTarget * (weight / 100);
      const obj = assignment.objective as any;
      
      return {
        id: assignment.id,
        title: obj?.title || "N/A",
        description: obj?.description || "",
        clusterName: obj?.indicatorCluster?.name || "N/A",
        clusterId: obj?.indicatorCluster?.id || "",
        calculationTypeName: obj?.calculationType?.name || "N/A",
        calculationTypeId: obj?.calculationType?.id || "",
        status: assignment.status as ObjectiveStatus,
        deadline: obj?.deadline
          ? new Date(obj.deadline).toLocaleDateString("it-IT")
          : undefined,
        progress: assignment.progress || 0,
        weight,
        economicValue,
        objectiveType: obj?.objectiveType,
        targetValue: obj?.targetValue,
        thresholdValue: obj?.thresholdValue,
        actualValue: obj?.actualValue,
        qualitativeResult: obj?.qualitativeResult,
        reportedAt: obj?.reportedAt,
      };
    });
  }, [objectiveAssignments, mboTarget]);

  const documents: Document[] = useMemo(() => {
    const acceptedDocIds = new Set(acceptedDocs.map((d) => d.documentId));
    return allDocuments.map((doc) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description || "",
      type: doc.type as "regulation" | "policy" | "contract",
      date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("it-IT") : "N/A",
      requiresAcceptance: doc.requiresAcceptance,
      accepted: acceptedDocIds.has(doc.id),
    }));
  }, [allDocuments, acceptedDocs]);

  const isLoading = userLoading || assignmentsLoading || documentsLoading;
  const isAdmin = user?.role === "admin";
  const regulationNotAccepted = user && !user.mboRegulationAcceptedAt;

  if (!employee) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Non autenticato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Effettua il login per accedere al tuo dashboard MBO.
            </p>
            <Button onClick={() => (window.location.href = "/api/login")} className="w-full">
              Accedi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show modal if regulation not accepted
  if (regulationNotAccepted && !showRegulationModal) {
    setShowRegulationModal(true);
  }

  // Content to render (same for both admin and employee)
  const dashboardContent = (
    <main className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold font-serif mb-2 flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8" />
            Il Mio Dashboard
          </h1>
          <p className="text-muted-foreground">
            Benvenuto, {employee.name}. Ecco il tuo progresso MBO.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Caricamento dati...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <EmployeeCard employee={employee} />
              
              {/* Riepilogo MBO */}
              <Card>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm flex items-center gap-1 font-serif">
                    <BarChart3 className="h-4 w-4" />
                    Riepilogo MBO
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <Euro className="h-3 w-3" />
                        MBO Target
                      </div>
                      <div className="text-lg font-semibold font-mono">
                        {mboTarget.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {employee.mboPercentage}% della RAL
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <Target className="h-3 w-3" />
                        Peso Assegnato
                      </div>
                      <div className="text-lg font-semibold font-mono">
                        {totalWeight}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {objectives.length} obiettivi
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <TrendingUp className="h-3 w-3" />
                        Percentuale Raggiungimento
                      </div>
                      <div className="text-lg font-semibold font-mono">
                        {overallProgress}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Obiettivi raggiunti
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
                <Tabs defaultValue="objectives" className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="objectives" data-testid="tab-objectives">
                      I Miei Obiettivi
                    </TabsTrigger>
                    <TabsTrigger value="regulation" data-testid="tab-regulation">
                      Regolamento MBO
                    </TabsTrigger>
                    <TabsTrigger value="documents" data-testid="tab-documents">
                      Documenti
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="objectives" className="space-y-3 mt-4">
                    {/* Lista Obiettivi */}
                    <div className="space-y-3">
                      {objectives.length === 0 ? (
                        <Card>
                          <CardContent className="pt-6 text-center text-muted-foreground">
                            Nessun obiettivo assegnato al momento
                          </CardContent>
                        </Card>
                      ) : (
                        objectives.map((objective) => (
                          <Card key={objective.id} className="hover-elevate" data-testid={`card-objective-${objective.id}`}>
                            <CardHeader className="pb-1 pt-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-0.5">
                                  <h3 className="font-semibold text-sm leading-tight">{objective.title}</h3>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                      {objective.clusterName}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      <Calculator className="h-3 w-3 mr-1" />
                                      {objective.calculationTypeName}
                                    </Badge>
                                  </div>
                                </div>
                                {objective.reportedAt ? (
                                  objective.qualitativeResult === "reached" ? (
                                    <Badge className="text-xs bg-green-600 hover:bg-green-700">
                                      <Check className="h-3 w-3 mr-1" />
                                      Raggiunto
                                    </Badge>
                                  ) : objective.qualitativeResult === "partial" ? (
                                    <Badge className="text-xs bg-amber-500 hover:bg-amber-600">
                                      <Check className="h-3 w-3 mr-1" />
                                      Raggiunto parzialmente
                                    </Badge>
                                  ) : (
                                    <Badge className="text-xs bg-red-600 hover:bg-red-700">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Non raggiunto
                                    </Badge>
                                  )
                                ) : (
                                  <StatusBadge status={objective.status} />
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 pb-3 pt-2">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {objective.description}
                              </p>
                              
                              <Separator className="my-1" />
                              
                              {/* FASCIA 1: Info principali - Peso, Valore Teorico, Target */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-muted/30 p-2 rounded-lg">
                                <div className="space-y-0.5">
                                  <div className="text-xs text-muted-foreground flex items-center gap-0.5">
                                    <Target className="h-3 w-3" />
                                    Peso
                                  </div>
                                  <div className="text-sm font-semibold font-mono">{objective.weight}%</div>
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-xs text-muted-foreground flex items-center gap-0.5">
                                    <Euro className="h-3 w-3" />
                                    Valore Teorico
                                  </div>
                                  <div className="text-sm font-semibold font-mono text-primary">
                                    {objective.economicValue.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                                  </div>
                                </div>
                                {objective.objectiveType === "numeric" && (
                                  <div className="space-y-0.5">
                                    <div className="text-xs text-muted-foreground">Risultato Target</div>
                                    <div className="text-sm font-semibold font-mono">
                                      {objective.targetValue ? objective.targetValue.toLocaleString() : "-"}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* FASCIA 2: Rendicontazione - solo dopo rendicontazione */}
                              {objective.reportedAt && (
                                <div className="bg-primary/10 p-2 rounded-lg space-y-2 border border-primary/20">
                                  <div className="text-xs font-semibold text-primary">Rendicontazione</div>
                                  
                                  {objective.objectiveType === "numeric" && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-0.5">
                                        <div className="text-xs text-muted-foreground">Valore Rendicontato</div>
                                        <div className="text-sm font-semibold font-mono">
                                          {objective.actualValue ? objective.actualValue.toLocaleString() : "-"}
                                        </div>
                                      </div>
                                      <div className="space-y-0.5">
                                        <div className="text-xs text-muted-foreground flex items-center gap-0.5">
                                          <Euro className="h-3 w-3" />
                                          Valore Economico Raggiunto
                                        </div>
                                        <div className="text-sm font-semibold font-mono">
                                          {(() => {
                                            let multiplier = 0;
                                            if (objective.objectiveType === "numeric") {
                                              const actual = parseFloat(String(objective.actualValue || 0));
                                              const target = parseFloat(String(objective.targetValue || 0));
                                              const threshold = parseFloat(String(objective.thresholdValue || 0));
                                              if (target > threshold && actual >= threshold) {
                                                multiplier = (actual - threshold) / (target - threshold);
                                                multiplier = Math.min(1, Math.max(0, multiplier));
                                              } else if (actual >= target) {
                                                multiplier = 1;
                                              } else if (actual < threshold) {
                                                multiplier = 0;
                                              }
                                            } else {
                                              if (objective.qualitativeResult === "reached") {
                                                multiplier = 1;
                                              } else if (objective.qualitativeResult === "partial") {
                                                multiplier = 0.5;
                                              }
                                            }
                                            const reachedValue = objective.economicValue * multiplier;
                                            return reachedValue.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="regulation" className="mt-6">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-serif">Regolamento MBO</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Consulta il regolamento completo del sistema MBO aziendale per
                            comprendere i criteri di valutazione e le linee guida.
                          </p>
                          <Link href="/regulation">
                            <Button variant="outline" data-testid="button-view-regulation">
                              <FileText className="mr-2 h-4 w-4" />
                              Visualizza Regolamento
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-6">
                    <div className="space-y-4">
                      <DocumentList
                        documents={documents}
                        onAccept={(id) => console.log("Document accepted:", id)}
                        onView={(id) => console.log("View document:", id)}
                        onDownload={(id) => console.log("Download document:", id)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  // If admin, wrap with sidebar
  if (isAdmin) {
    const style = {
      "--sidebar-width": "16rem",
      "--sidebar-width-icon": "3rem",
    };

    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <AppHeader userName={employee.name} userRole="Amministratore" notificationCount={0} showSidebarTrigger={true} />
            {dashboardContent}
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Regulation acceptance modal
  const regulationModal = (
    <AlertDialog open={showRegulationModal} onOpenChange={setShowRegulationModal}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-regulation-required">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-serif">
            Accettazione Regolamento MBO
          </AlertDialogTitle>
          <AlertDialogDescription>
            È necessario leggere e accettare il regolamento MBO prima di proseguire
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 my-4 text-sm text-muted-foreground max-h-[40vh] overflow-y-auto">
          <p>
            <strong>Regolamento della Piattaforma di Gestione MBO</strong>
          </p>
          
          <p>
            La presente piattaforma di gestione degli Obiettivi di Management by Objectives (MBO) è uno strumento aziendale dedicato alla gestione, monitoraggio e valutazione degli obiettivi lavorativi. Tutti gli utenti della piattaforma sono tenuti a leggere e accettare le seguenti condizioni di utilizzo:
          </p>

          <p>
            <strong>1. Scopo e Utilizzo</strong><br />
            La piattaforma è destinata alla gestione degli obiettivi MBO per i dipendenti dell'azienda. Gli utenti si impegnano a utilizzare la piattaforma in conformità alle politiche aziendali e alle normative vigenti.
          </p>

          <p>
            <strong>2. Riservatezza e Protezione dei Dati</strong><br />
            Tutti i dati personali e le informazioni sensibili contenute nella piattaforma sono soggetti alla normativa sulla privacy aziendale e alle normative sulla protezione dei dati (GDPR). Gli utenti si impegnano a mantenere la riservatezza delle informazioni.
          </p>

          <p>
            <strong>3. Integrità dei Dati</strong><br />
            Gli utenti sono responsabili dell'accuratezza e della completezza dei dati che inseriscono nella piattaforma. È vietato modificare, eliminare o alterare i dati di altri utenti.
          </p>

          <p>
            <strong>4. Obiettivi e Rendicontazione</strong><br />
            Gli obiettivi assegnati devono essere rendicontati con accuratezza. La falsificazione dei dati di rendicontazione può comportare conseguenze disciplinari.
          </p>

          <p>
            <strong>5. Accesso e Autorizzazione</strong><br />
            L'accesso alla piattaforma è limitato al personale autorizzato. Ogni utente è responsabile della confidenzialità delle proprie credenziali di accesso.
          </p>

          <p>
            <strong>6. Conformità Normativa</strong><br />
            L'utilizzo della piattaforma è soggetto alle leggi e ai regolamenti applicabili. Qualsiasi utilizzo non autorizzato è vietato.
          </p>

          <p className="pt-2 border-t">
            Accettando questo regolamento, dichiari di aver letto e compreso le condizioni di utilizzo della piattaforma di gestione MBO e ti impegni a rispettarle.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <AlertDialogCancel 
            data-testid="button-skip-regulation"
            disabled={acceptRegulationMutation.isPending}
          >
            Accetta in seguito
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => acceptRegulationMutation.mutate()}
            disabled={acceptRegulationMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-accept-regulation"
          >
            {acceptRegulationMutation.isPending ? "Registrazione in corso..." : "Accetto"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Regular employee layout
  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={employee.name} userRole={employee.role} notificationCount={0} />
      {regulationModal}
      {dashboardContent}
    </div>
  );
}
