import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppHeader from "@/components/AppHeader";
import { useRail } from "@/contexts/RailContext";
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
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, ObjectiveAssignment, IndicatorCluster } from "@shared/schema";

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

interface SelectedObjectiveDetail {
  id: string;
  title: string;
  description: string;
  clusterId: string;
  weight: number;
  objectiveType: "numeric" | "qualitative";
  targetValue: number | null;
}

export default function AdminAssignmentsPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isRailOpen, activeSection, setActiveSection, isPanelOpen, setIsPanelOpen } = useRail();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedObjectives, setSelectedObjectives] = useState<SelectedObjectiveDetail[]>([]);
  const [assignmentDeadline, setAssignmentDeadline] = useState<string>("");
  const [configObjective, setConfigObjective] = useState<ObjectiveDictionary | null>(null);
  const [configWeight, setConfigWeight] = useState<number>(20);
  const [configObjectiveType, setConfigObjectiveType] = useState<"numeric" | "qualitative">("numeric");
  const [configTargetValue, setConfigTargetValue] = useState<string>("");

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
      setIsPanelOpen(false);
    } else {
      setActiveSection(sectionId);
      setIsPanelOpen(true);
    }
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
    setActiveSection(null);
  };

  const { data: targetUser, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: userAssignments = [], isLoading: assignmentsLoading } = useQuery<
    Array<ObjectiveAssignment & { objective: any }>
  >({
    queryKey: [`/api/assignments/${userId}`],
    enabled: !!userId,
  });

  const { data: objectivesDictionary = [] } = useQuery<ObjectiveDictionary[]>({
    queryKey: ["/api/objectives-dictionary"],
    enabled: !!user,
  });

  const { data: indicatorClusters = [] } = useQuery<IndicatorCluster[]>({
    queryKey: ["/api/indicator-clusters"],
    enabled: !!user,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { 
      userId: string; 
      objectiveId: string; 
      status: string; 
      progress: number; 
      weight?: number;
      objectiveType?: "numeric" | "qualitative";
      targetValue?: number | null;
    }) => {
      const res = await apiRequest("POST", "/api/assignments", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Impossibile assegnare l'obiettivo");
      }
      return res.json();
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

  const availableObjectives = useMemo(() => {
    const selectedIds = new Set(selectedObjectives.map((s) => s.id));
    // Use dictionaryId from the objective to compare with dictionary items
    const assignedDictionaryIds = new Set(
      userAssignments.map((a) => (a.objective as any)?.dictionaryId).filter(Boolean)
    );
    return objectivesDictionary.filter(
      (obj) => !assignedDictionaryIds.has(obj.id) && !selectedIds.has(obj.id)
    );
  }, [objectivesDictionary, userAssignments, selectedObjectives]);
  
  // Calculate current total assigned weight
  const currentTotalWeight = useMemo(() => {
    return userAssignments.reduce((sum, a) => sum + (a.weight || 0), 0);
  }, [userAssignments]);
  
  // Calculate remaining available weight
  const availableWeight = 100 - currentTotalWeight;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return (f + l).toUpperCase() || "?";
  };

  const handleAssignSelected = async () => {
    if (!userId || selectedObjectives.length === 0) return;
    
    let successCount = 0;
    const errors: string[] = [];
    
    for (const obj of selectedObjectives) {
      try {
        await createAssignmentMutation.mutateAsync({
          userId,
          objectiveId: obj.id,
          status: "in_progress",
          progress: 0,
          weight: obj.weight,
          objectiveType: obj.objectiveType,
          targetValue: obj.targetValue,
        });
        successCount++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Errore per "${obj.title}"`);
      }
    }
    
    // Invalidate queries after all assignments are done
    queryClient.invalidateQueries({ queryKey: [`/api/assignments/${userId}`] });
    
    // Show single summary toast
    if (successCount > 0 && errors.length === 0) {
      toast({ 
        title: successCount === 1 
          ? "Obiettivo assegnato con successo" 
          : `${successCount} obiettivi assegnati con successo` 
      });
    } else if (successCount > 0 && errors.length > 0) {
      toast({ 
        title: `${successCount} obiettivi assegnati`,
        description: `${errors.length} non assegnati: ${errors[0]}`,
        variant: "destructive"
      });
    } else if (errors.length > 0) {
      toast({ 
        title: "Impossibile assegnare gli obiettivi",
        description: errors[0],
        variant: "destructive"
      });
    }
    
    setSelectedObjectives([]);
    setIsAssignDialogOpen(false);
  };

  const handleAddObjectiveWithConfig = () => {
    if (!configObjective || !configObjective.indicatorClusterId) {
      toast({ title: "Errore", description: "Seleziona un cluster", variant: "destructive" });
      return;
    }
    
    setSelectedObjectives((prev) => [
      ...prev,
      {
        id: configObjective.id,
        title: configObjective.title,
        description: configObjective.description || "",
        clusterId: configObjective.indicatorClusterId,
        weight: configWeight,
        objectiveType: configObjectiveType,
        targetValue: configObjectiveType === "numeric" && configTargetValue ? parseFloat(configTargetValue) : null,
      },
    ]);
    
    setConfigObjective(null);
    setConfigWeight(20);
    setConfigObjectiveType("numeric");
    setConfigTargetValue("");
  };

  const overallProgress = useMemo(() => {
    if (userAssignments.length === 0) return 0;
    const total = userAssignments.reduce((sum, a) => sum + (a.progress || 0), 0);
    return Math.round(total / userAssignments.length);
  }, [userAssignments]);

  if (userLoading) {
    return (
      <>
        <AppHeader
          userName={user?.name || "Amministratore"}
          userRole="Amministratore"
          notificationCount={0}
          showSidebarTrigger={true}
        />
        <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
          <div className="flex gap-6 max-w-[1800px] mx-auto">
            <AppRail
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
              isOpen={isRailOpen}
            />
            <AppPanel
              activeSection={activeSection}
              isOpen={isPanelOpen}
              onClose={handlePanelClose}
            />
            <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Caricamento...</p>
            </div>
          </main>
        </div>
      </div>
      </>
    );
  }

  if (!targetUser) {
    return (
      <>
        <AppHeader
          userName={user?.name || "Amministratore"}
          userRole="Amministratore"
          notificationCount={0}
          showSidebarTrigger={true}
        />
        <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
          <div className="flex gap-6 max-w-[1800px] mx-auto">
            <AppRail
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
              isOpen={isRailOpen}
            />
            <AppPanel
              activeSection={activeSection}
              isOpen={isPanelOpen}
              onClose={handlePanelClose}
            />
            <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="flex items-center justify-center h-full">
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
          </main>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        userName={user?.name || "Amministratore"}
        userRole="Amministratore"
        notificationCount={0}
        showSidebarTrigger={true}
      />
      <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
        <div className="flex gap-6 max-w-[1800px] mx-auto">
          <AppRail
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            isOpen={isRailOpen}
          />
          <AppPanel
            activeSection={activeSection}
            isOpen={isPanelOpen}
            onClose={handlePanelClose}
          />
          <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/users">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="md3-headline-medium mb-2 flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  Assegnazione Obiettivi
                </h1>
                <p className="md3-body-large text-muted-foreground">
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
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Peso Totale</span>
                        <span className={`font-semibold ${currentTotalWeight > 100 ? 'text-destructive' : currentTotalWeight === 100 ? 'text-green-600' : ''}`}>
                          {currentTotalWeight}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        <Progress value={Math.min(currentTotalWeight, 100)} className="h-2" />
                        {currentTotalWeight < 100 && (
                          <p className="text-xs text-muted-foreground">
                            Disponibile: {availableWeight}%
                          </p>
                        )}
                        {currentTotalWeight === 100 && (
                          <p className="text-xs text-green-600">
                            Peso completo al 100%
                          </p>
                        )}
                        {currentTotalWeight > 100 && (
                          <p className="text-xs text-destructive">
                            Attenzione: peso totale eccede il 100%
                          </p>
                        )}
                      </div>
                      <div className="space-y-1 pt-2">
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
                          Obiettivi attualmente assegnati al dipendente
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
                          
                          <div className="flex-1 overflow-auto space-y-2">
                            {availableObjectives.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                Nessun obiettivo disponibile
                              </div>
                            ) : (
                              availableObjectives.map((obj: ObjectiveDictionary) => (
                                <div 
                                  key={obj.id}
                                  className="flex items-start gap-3 p-3 border rounded-md hover-elevate cursor-pointer"
                                  onClick={() => {
                                    setConfigObjective(obj);
                                    setConfigWeight(20);
                                  }}
                                  data-testid={`objective-option-${obj.id}`}
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{obj.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {obj.description || "Nessuna descrizione"}
                                    </p>
                                    {obj.indicatorCluster && (
                                      <Badge variant="outline" className="mt-2 text-xs">
                                        {obj.indicatorCluster.name}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          
                          {selectedObjectives.length > 0 && (
                            <div className="border-t pt-3 space-y-2">
                              <p className="text-sm font-medium">Obiettivi selezionati:</p>
                              <div className="space-y-1 max-h-[120px] overflow-auto">
                                {selectedObjectives.map((obj) => (
                                  <div key={obj.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                                    <span>{obj.title} ({obj.weight}%)</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => setSelectedObjectives((prev) => prev.filter((o) => o.id !== obj.id))}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
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

                      {/* Configuration Dialog */}
                      <Dialog open={!!configObjective} onOpenChange={(open) => !open && setConfigObjective(null)}>
                        <DialogContent className="sm:max-w-[400px]">
                          <DialogHeader>
                            <DialogTitle>Configura Obiettivo</DialogTitle>
                            <DialogDescription>
                              {configObjective?.title}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="cluster">Cluster Obiettivo</Label>
                              <Select 
                                value={configObjective?.indicatorClusterId || ""} 
                                onValueChange={(val) => {
                                  if (configObjective) {
                                    setConfigObjective({ ...configObjective, indicatorClusterId: val });
                                  }
                                }}
                              >
                                <SelectTrigger id="cluster">
                                  <SelectValue placeholder="Seleziona cluster" />
                                </SelectTrigger>
                                <SelectContent>
                                  {indicatorClusters.map((cluster) => (
                                    <SelectItem key={cluster.id} value={cluster.id}>
                                      {cluster.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="objectiveType">Tipo Obiettivo</Label>
                              <Select 
                                value={configObjectiveType} 
                                onValueChange={(val: "numeric" | "qualitative") => setConfigObjectiveType(val)}
                              >
                                <SelectTrigger id="objectiveType" data-testid="select-objective-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="numeric">Numerico</SelectItem>
                                  <SelectItem value="qualitative">Qualitativo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {configObjectiveType === "numeric" && (
                              <div>
                                <Label htmlFor="targetValue">Valore Target</Label>
                                <Input
                                  id="targetValue"
                                  type="number"
                                  placeholder="Es. 100000"
                                  value={configTargetValue}
                                  onChange={(e) => setConfigTargetValue(e.target.value)}
                                  data-testid="input-target-value"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Valore numerico da raggiungere
                                </p>
                              </div>
                            )}

                            {configObjectiveType === "qualitative" && (
                              <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm text-muted-foreground">
                                  Per obiettivi qualitativi, la rendicontazione sarà "Raggiunto" o "Non raggiunto"
                                </p>
                              </div>
                            )}

                            <div>
                              <Label htmlFor="weight">Peso nella Scheda ({configWeight}%)</Label>
                              <Slider
                                id="weight"
                                min={5}
                                max={Math.max(5, availableWeight - selectedObjectives.reduce((sum, o) => sum + o.weight, 0))}
                                step={5}
                                value={[configWeight]}
                                onValueChange={(val) => setConfigWeight(val[0])}
                                className="mt-2"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                <span>Multipli di 5%</span>
                                <span className={availableWeight - selectedObjectives.reduce((sum, o) => sum + o.weight, 0) <= 0 ? 'text-destructive' : ''}>
                                  Disponibile: {availableWeight - selectedObjectives.reduce((sum, o) => sum + o.weight, 0)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setConfigObjective(null)}
                            >
                              Annulla
                            </Button>
                            <Button
                              onClick={handleAddObjectiveWithConfig}
                              disabled={availableWeight - selectedObjectives.reduce((sum, o) => sum + o.weight, 0) < configWeight}
                              data-testid="button-confirm-config"
                            >
                              Aggiungi
                            </Button>
                          </div>
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
                      <div className="space-y-2">
                        {userAssignments.map((assignment: any) => (
                          <div
                            key={assignment.id}
                            className="flex items-center gap-4 p-3 border rounded-md"
                            data-testid={`assignment-${assignment.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">
                                  {assignment.objective?.title || "Obiettivo"}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {assignment.weight || 0}%
                                </Badge>
                              </div>
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
                    )}
                  </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
