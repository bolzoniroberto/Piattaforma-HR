import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Search, 
  Users, 
  Target, 
  Building, 
  Leaf, 
  Plus, 
  Trash2,
  CheckCircle,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, ObjectiveAssignment } from "@shared/schema";

interface ObjectiveDictionary {
  id: string;
  title: string;
  description: string;
  indicatorClusterId: string;
  calculationTypeId: string;
  indicatorCluster?: {
    id: string;
    name: string;
  };
  calculationType?: {
    id: string;
    name: string;
  };
}

interface ObjectiveCluster {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export default function AdminAssignmentsPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<string>("");
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [assignmentDeadline, setAssignmentDeadline] = useState<string>("");

  const { data: targetUser, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: userAssignments = [], isLoading: assignmentsLoading } = useQuery<
    Array<ObjectiveAssignment & { objective: any; cluster: any }>
  >({
    queryKey: [`/api/assignments/${userId}`],
    enabled: !!userId,
  });

  const { data: objectivesDictionary = [] } = useQuery<ObjectiveDictionary[]>({
    queryKey: ["/api/objectives-dictionary"],
    enabled: !!user,
  });

  const { data: objectiveClusters = [] } = useQuery<ObjectiveCluster[]>({
    queryKey: ["/api/clusters"],
    enabled: !!user,
  });

  const { data: allObjectives = [] } = useQuery<any[]>({
    queryKey: ["/api/objectives"],
    enabled: !!user,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { userId: string; objectiveId: string; status: string; progress: number }) => {
      const res = await apiRequest("POST", "/api/assignments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${userId}`] });
      toast({ title: "Obiettivo assegnato con successo" });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile assegnare l'obiettivo",
        variant: "destructive",
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await apiRequest("DELETE", `/api/assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${userId}`] });
      toast({ title: "Assegnazione rimossa" });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile rimuovere l'assegnazione",
        variant: "destructive",
      });
    },
  });

  const assignmentsByCluster = useMemo(() => {
    const grouped: Record<string, typeof userAssignments> = {};
    userAssignments.forEach((assignment) => {
      const clusterName = assignment.cluster?.name || "Non categorizzato";
      if (!grouped[clusterName]) {
        grouped[clusterName] = [];
      }
      grouped[clusterName].push(assignment);
    });
    return grouped;
  }, [userAssignments]);

  const availableObjectivesByCluster = useMemo(() => {
    const assignedObjectiveIds = new Set(userAssignments.map((a) => a.objectiveId));
    const grouped: Record<string, any[]> = {};
    
    allObjectives.forEach((obj) => {
      if (assignedObjectiveIds.has(obj.id)) return;
      
      const cluster = objectiveClusters.find((c) => c.id === obj.clusterId);
      const clusterName = cluster?.name || "Non categorizzato";
      
      if (!grouped[clusterName]) {
        grouped[clusterName] = [];
      }
      
      const dictEntry = objectivesDictionary.find((d) => d.id === obj.dictionaryId);
      grouped[clusterName].push({
        ...obj,
        title: dictEntry?.title || "Obiettivo",
        description: dictEntry?.description || "",
        clusterName,
      });
    });
    
    return grouped;
  }, [allObjectives, userAssignments, objectiveClusters, objectivesDictionary]);

  const getClusterIcon = (name: string) => {
    if (name.includes("Gruppo")) return Users;
    if (name.includes("ESG")) return Leaf;
    if (name.includes("Direzione") || name.includes("Individual")) return Building;
    return Target;
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return (f + l).toUpperCase() || "?";
  };

  const handleAssignSelected = async () => {
    if (!userId || selectedObjectives.length === 0) return;
    
    for (const objectiveId of selectedObjectives) {
      await createAssignmentMutation.mutateAsync({
        userId,
        objectiveId,
        status: "in_progress",
        progress: 0,
      });
    }
    
    setSelectedObjectives([]);
    setIsAssignDialogOpen(false);
  };

  const overallProgress = useMemo(() => {
    if (userAssignments.length === 0) return 0;
    const total = userAssignments.reduce((sum, a) => sum + (a.progress || 0), 0);
    return Math.round(total / userAssignments.length);
  }, [userAssignments]);

  const style = {
    "--sidebar-width": "16rem",
  };

  if (userLoading) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1">
            <div className="flex items-center justify-center flex-1">
              <p className="text-muted-foreground">Caricamento...</p>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!targetUser) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1">
            <div className="flex items-center justify-center flex-1">
              <Card className="max-w-md">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Utente non trovato</p>
                  <Link href="/admin/users">
                    <Button variant="outline">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Torna alla lista utenti
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader
            userName={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Admin"}
            userRole="Amministratore"
            showSidebarTrigger={true}
          />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center gap-4">
                <Link href="/admin/users">
                  <Button variant="ghost" size="icon" data-testid="button-back">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex-1">
                  <h1 className="text-3xl font-semibold mb-1">Assegnazione Obiettivi</h1>
                  <p className="text-muted-foreground">
                    Gestisci gli obiettivi assegnati a questo dipendente
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Informazioni Dipendente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        {targetUser.profileImageUrl && (
                          <AvatarImage src={targetUser.profileImageUrl} alt={targetUser.firstName || ""} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {getInitials(targetUser.firstName, targetUser.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {targetUser.firstName} {targetUser.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{targetUser.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dipartimento</span>
                        <span className="font-medium">{targetUser.department || "-"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">RAL</span>
                        <span className="font-medium">
                          {targetUser.ral ? `€${Number(targetUser.ral).toLocaleString()}` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">MBO %</span>
                        <span className="font-medium">
                          {targetUser.mboPercentage ? `${targetUser.mboPercentage}%` : "-"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Obiettivi Assegnati</span>
                        <span className="font-semibold">{userAssignments.length}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso Medio</span>
                          <span className="font-semibold">{overallProgress}%</span>
                        </div>
                        <Progress value={overallProgress} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle>Obiettivi Assegnati</CardTitle>
                        <CardDescription>
                          Obiettivi attualmente assegnati al dipendente, suddivisi per cluster
                        </CardDescription>
                      </div>
                      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                        <DialogTrigger asChild>
                          <Button data-testid="button-assign-new">
                            <Plus className="mr-2 h-4 w-4" />
                            Assegna Obiettivo
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Assegna Nuovi Obiettivi</DialogTitle>
                            <DialogDescription>
                              Seleziona gli obiettivi da assegnare a {targetUser.firstName} {targetUser.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Tabs defaultValue={objectiveClusters[0]?.id || ""} className="flex-1 overflow-hidden flex flex-col">
                            <TabsList className="w-full justify-start overflow-x-auto">
                              {objectiveClusters.map((cluster) => (
                                <TabsTrigger key={cluster.id} value={cluster.id} className="text-xs">
                                  {cluster.name.replace("Obiettivi di ", "").replace("Obiettivi ", "")}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            
                            {objectiveClusters.map((cluster) => {
                              const clusterObjectives = availableObjectivesByCluster[cluster.name] || [];
                              const Icon = getClusterIcon(cluster.name);
                              
                              return (
                                <TabsContent key={cluster.id} value={cluster.id} className="flex-1 overflow-auto mt-4">
                                  {clusterObjectives.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                      Nessun obiettivo disponibile in questo cluster
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {clusterObjectives.map((obj) => (
                                        <div 
                                          key={obj.id}
                                          className="flex items-start gap-3 p-3 border rounded-md hover-elevate cursor-pointer"
                                          onClick={() => {
                                            setSelectedObjectives((prev) =>
                                              prev.includes(obj.id)
                                                ? prev.filter((id) => id !== obj.id)
                                                : [...prev, obj.id]
                                            );
                                          }}
                                          data-testid={`objective-option-${obj.id}`}
                                        >
                                          <Checkbox
                                            checked={selectedObjectives.includes(obj.id)}
                                            className="mt-1"
                                          />
                                          <div className="flex-1">
                                            <p className="font-medium text-sm">{obj.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {obj.description || "Nessuna descrizione"}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </TabsContent>
                              );
                            })}
                          </Tabs>
                          
                          <DialogFooter className="mt-4">
                            <div className="flex items-center justify-between w-full gap-4">
                              <span className="text-sm text-muted-foreground">
                                {selectedObjectives.length} obiettivi selezionati
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedObjectives([]);
                                    setIsAssignDialogOpen(false);
                                  }}
                                >
                                  Annulla
                                </Button>
                                <Button
                                  onClick={handleAssignSelected}
                                  disabled={selectedObjectives.length === 0 || createAssignmentMutation.isPending}
                                  data-testid="button-confirm-assign"
                                >
                                  {createAssignmentMutation.isPending ? "Assegnazione..." : "Assegna Selezionati"}
                                </Button>
                              </div>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {assignmentsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                    ) : userAssignments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nessun obiettivo assegnato. Clicca "Assegna Obiettivo" per iniziare.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(assignmentsByCluster).map(([clusterName, assignments]) => {
                          const Icon = getClusterIcon(clusterName);
                          const clusterProgress = assignments.length > 0
                            ? Math.round(assignments.reduce((sum, a) => sum + (a.progress || 0), 0) / assignments.length)
                            : 0;
                          
                          return (
                            <div key={clusterName} className="space-y-3">
                              <div className="flex items-center justify-between gap-4 pb-2 border-b">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-5 w-5 text-primary" />
                                  <h3 className="font-semibold">{clusterName}</h3>
                                  <Badge variant="secondary" className="ml-2">
                                    {assignments.length} obiettivi
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-muted-foreground">Progresso:</span>
                                  <span className="font-medium">{clusterProgress}%</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {assignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="flex items-center gap-4 p-3 border rounded-md"
                                    data-testid={`assignment-${assignment.id}`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm">
                                        {assignment.objective?.title || "Obiettivo"}
                                      </p>
                                      <div className="flex items-center gap-3 mt-2">
                                        <Progress value={assignment.progress || 0} className="flex-1 h-2" />
                                        <span className="text-sm font-medium w-12 text-right">
                                          {assignment.progress || 0}%
                                        </span>
                                      </div>
                                    </div>
                                    <Badge
                                      variant={
                                        assignment.status === "completed" || assignment.status === "completato"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="flex items-center gap-1"
                                    >
                                      {assignment.status === "completed" || assignment.status === "completato" ? (
                                        <CheckCircle className="h-3 w-3" />
                                      ) : (
                                        <Clock className="h-3 w-3" />
                                      )}
                                      {assignment.status === "completed" || assignment.status === "completato"
                                        ? "Completato"
                                        : "In Corso"}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                                      disabled={deleteAssignmentMutation.isPending}
                                      data-testid={`button-delete-${assignment.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
