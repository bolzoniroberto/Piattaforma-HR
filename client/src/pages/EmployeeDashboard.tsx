import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import EmployeeCard from "@/components/EmployeeCard";
import ObjectiveCard, { type Objective } from "@/components/ObjectiveCard";
import DocumentList, { type Document } from "@/components/DocumentList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { FileText, AlertCircle, Target, Users, Leaf, Building } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ObjectiveAssignment, Document as DocumentType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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
    };
  }, [user, stats]);

  // Overall progress
  const overallProgress = useMemo(() => {
    if (objectiveAssignments.length === 0) return 0;
    const total = objectiveAssignments.reduce((sum, a) => sum + (a.progress || 0), 0);
    return Math.round(total / objectiveAssignments.length);
  }, [objectiveAssignments]);

  const objectives: Objective[] = useMemo(() => {
    return objectiveAssignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.objective?.title || "N/A",
        description: assignment.objective?.description || "",
        cluster: "N/A",
        clusterId: "",
        status: assignment.status as any,
        deadline: assignment.objective?.deadline
          ? new Date(assignment.objective.deadline).toLocaleDateString("it-IT")
          : undefined,
        progress: assignment.progress,
        readOnly: true, // Employee can only view, not edit
      }));
  }, [objectiveAssignments]);

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
                    {/* Vista Complessiva */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Vista Complessiva</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progresso Totale</span>
                            <span className="text-sm font-semibold">{overallProgress}%</span>
                          </div>
                          <Progress value={overallProgress} className="h-3" data-testid="progress-overall" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Titolo Obiettivi */}
                    <h3 className="text-lg font-semibold">I Miei Obiettivi</h3>

                    {/* Lista Obiettivi */}
                    <div className="space-y-4">
                      {objectives.length === 0 ? (
                        <Card>
                          <CardContent className="pt-6 text-center text-muted-foreground">
                            Nessun obiettivo assegnato al momento
                          </CardContent>
                        </Card>
                      ) : (
                        objectives.map((objective) => (
                          <ObjectiveCard
                            key={objective.id}
                            objective={objective}
                            onStatusChange={(id, status) => {
                              const assignment = objectiveAssignments.find((a) => a.id === id);
                              if (assignment) {
                                updateObjectiveMutation.mutate({ assignmentId: id, status });
                              }
                            }}
                          />
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
