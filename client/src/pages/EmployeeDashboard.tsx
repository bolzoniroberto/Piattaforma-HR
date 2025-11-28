import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import EmployeeCard from "@/components/EmployeeCard";
import DocumentList, { type Document } from "@/components/DocumentList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FileText, AlertCircle, Target, Users, Leaf, Building, Calculator, Euro, TrendingUp, BarChart3, CheckCircle2, XCircle, Check } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ObjectiveAssignment, Document as DocumentType, IndicatorCluster, CalculationType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import StatusBadge, { type ObjectiveStatus } from "@/components/StatusBadge";

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
  actualValue?: number | null;
  qualitativeResult?: string | null;
  reportedAt?: Date | null;
}

export default function EmployeeDashboard() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();

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
      // If reported, use 100% if reached, 0% if not reached
      // If not reported, use current progress
      let progressValue = a.progress || 0;
      if (obj?.reportedAt) {
        progressValue = obj.qualitativeResult === "reached" ? 100 : 0;
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={employee.name} userRole={employee.role} notificationCount={0} />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Il Mio Dashboard</h1>
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
              <div className="lg:col-span-1">
                <EmployeeCard employee={employee} />
              </div>

              <div className="lg:col-span-2">
                <Tabs defaultValue="objectives" className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="objectives" data-testid="tab-objectives">
                      I Miei Obiettivi
                    </TabsTrigger>
                    <TabsTrigger value="documents" data-testid="tab-documents">
                      Documenti
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="objectives" className="space-y-6 mt-6">
                    {/* Vista Complessiva MBO */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Riepilogo MBO
                        </CardTitle>
                        <CardDescription>
                          Il tuo obiettivo MBO annuale e il progresso complessivo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Euro className="h-4 w-4" />
                              MBO Target
                            </div>
                            <div className="text-2xl font-semibold font-mono">
                              {mboTarget.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {employee.mboPercentage}% della RAL
                            </div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Target className="h-4 w-4" />
                              Peso Assegnato
                            </div>
                            <div className="text-2xl font-semibold font-mono">
                              {totalWeight}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {objectives.length} obiettivi
                            </div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <TrendingUp className="h-4 w-4" />
                              Percentuale Raggiungimento MBO
                            </div>
                            <div className="text-2xl font-semibold font-mono">
                              {overallProgress}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Obiettivi raggiunti
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Titolo Obiettivi */}
                    <h3 className="text-lg font-semibold">I Miei Obiettivi</h3>

                    {/* Lista Obiettivi Arricchita */}
                    <div className="space-y-4">
                      {objectives.length === 0 ? (
                        <Card>
                          <CardContent className="pt-6 text-center text-muted-foreground">
                            Nessun obiettivo assegnato al momento
                          </CardContent>
                        </Card>
                      ) : (
                        objectives.map((objective) => (
                          <Card key={objective.id} className="hover-elevate" data-testid={`card-objective-${objective.id}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                  <h3 className="font-semibold text-base leading-tight">{objective.title}</h3>
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
                            <CardContent className="space-y-4">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {objective.description}
                              </p>
                              
                              <Separator />
                              
                              {/* Info economiche e peso */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    Peso
                                  </div>
                                  <div className="text-lg font-semibold font-mono">{objective.weight}%</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Euro className="h-3 w-3" />
                                    Valore Economico
                                  </div>
                                  <div className="text-lg font-semibold font-mono text-primary">
                                    {objective.economicValue.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Progresso
                                  </div>
                                  <div className="text-lg font-semibold font-mono">{objective.progress}%</div>
                                </div>
                                {objective.deadline && (
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Scadenza</div>
                                    <div className="text-sm font-medium">{objective.deadline}</div>
                                  </div>
                                )}
                              </div>

                              {/* Valori rendicontazione - solo per obiettivi numerici rendicontati */}
                              {objective.reportedAt && objective.objectiveType === "numeric" && (
                                <div className="border-t pt-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground">Target</div>
                                      <div className="text-sm font-semibold font-mono">
                                        {objective.targetValue ? objective.targetValue.toLocaleString() : "-"}
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground">Rendicontato</div>
                                      <div className="text-sm font-semibold font-mono">
                                        {objective.actualValue ? objective.actualValue.toLocaleString() : "-"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Barra progresso */}
                              <div className="pt-2">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${objective.progress}%` }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-6">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Regolamento MBO</CardTitle>
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
    </div>
  );
}
