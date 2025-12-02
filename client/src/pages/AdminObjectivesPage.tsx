import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Filter, Target, Users, Leaf, Building, ChevronRight, Calculator, Layers, Edit, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ObjectiveDictionary {
  id: string;
  title: string;
  description: string;
  indicatorClusterId: string;
  calculationTypeId: string;
  objectiveType?: string;
  targetValue?: number | null;
  thresholdValue?: number | null;
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

interface IndicatorCluster {
  id: string;
  name: string;
  description: string;
}

interface CalculationType {
  id: string;
  name: string;
  description: string;
}

export default function AdminObjectivesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndicatorCluster, setSelectedIndicatorCluster] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newObjective, setNewObjective] = useState({
    title: "",
    description: "",
    indicatorClusterId: "",
    calculationTypeId: "",
    objectiveType: "numeric",
    targetValue: "",
    thresholdValue: "",
  });

  const { data: objectivesDictionary = [], isLoading: dictLoading } = useQuery<ObjectiveDictionary[]>({
    queryKey: ["/api/objectives-dictionary"],
    enabled: !!user,
  });

  const { data: objectiveClusters = [] } = useQuery<ObjectiveCluster[]>({
    queryKey: ["/api/clusters"],
    enabled: !!user,
  });

  const { data: indicatorClusters = [] } = useQuery<IndicatorCluster[]>({
    queryKey: ["/api/indicator-clusters"],
    enabled: !!user,
  });

  const { data: calculationTypes = [] } = useQuery<CalculationType[]>({
    queryKey: ["/api/calculation-types"],
    enabled: !!user,
  });

  const { data: objectivesWithAssignments = [] } = useQuery<any[]>({
    queryKey: ["/api/objectives-with-assignments"],
    enabled: !!user,
  });

  const createObjectiveMutation = useMutation({
    mutationFn: async (data: typeof newObjective) => {
      const payload = {
        title: data.title,
        description: data.description,
        indicatorClusterId: data.indicatorClusterId,
        calculationTypeId: data.calculationTypeId,
        objectiveType: data.objectiveType,
        targetValue: data.objectiveType === "numeric" && data.targetValue ? parseFloat(data.targetValue) : null,
        thresholdValue: data.objectiveType === "numeric" && data.thresholdValue ? parseFloat(data.thresholdValue) : null,
      };
      const res = await apiRequest("POST", "/api/objectives-dictionary", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-dictionary"] });
      toast({ title: "Obiettivo creato con successo" });
      setIsDialogOpen(false);
      setNewObjective({ title: "", description: "", indicatorClusterId: "", calculationTypeId: "", objectiveType: "numeric", targetValue: "", thresholdValue: "" });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile creare l'obiettivo",
        variant: "destructive",
      });
    },
  });

  const updateObjectiveMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string; indicatorClusterId: string; calculationTypeId: string; objectiveType: string; targetValue: string; thresholdValue: string }) => {
      const payload = {
        title: data.title,
        description: data.description,
        indicatorClusterId: data.indicatorClusterId,
        calculationTypeId: data.calculationTypeId,
        objectiveType: data.objectiveType,
        targetValue: data.objectiveType === "numeric" && data.targetValue ? parseFloat(data.targetValue) : null,
        thresholdValue: data.objectiveType === "numeric" && data.thresholdValue ? parseFloat(data.thresholdValue) : null,
      };
      const res = await apiRequest("PATCH", `/api/objectives-dictionary/${data.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-dictionary"] });
      toast({ title: "Obiettivo aggiornato con successo" });
      setEditingId(null);
      setIsDialogOpen(false);
      setNewObjective({ title: "", description: "", indicatorClusterId: "", calculationTypeId: "", objectiveType: "numeric", targetValue: "", thresholdValue: "" });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare l'obiettivo",
        variant: "destructive",
      });
    },
  });

  const deleteObjectiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/objectives-dictionary/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-with-assignments"] });
      toast({ title: "Obiettivo eliminato con successo" });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile eliminare l'obiettivo",
        variant: "destructive",
      });
    },
  });

  const selectedObjectiveForDelete = useMemo(() => {
    if (!deleteId) return null;
    return objectivesDictionary.find(obj => obj.id === deleteId);
  }, [deleteId, objectivesDictionary]);

  const assignmentsForDeletedObjective = useMemo(() => {
    if (!deleteId) return [];
    const found = objectivesWithAssignments.find(item => item.objective.dictionaryId === deleteId);
    return found?.assignedUsers || [];
  }, [deleteId, objectivesWithAssignments]);

  const filteredObjectives = useMemo(() => {
    let filtered = objectivesDictionary;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (obj) =>
          obj.title.toLowerCase().includes(query) ||
          obj.description?.toLowerCase().includes(query)
      );
    }
    
    if (selectedIndicatorCluster !== "all") {
      filtered = filtered.filter((obj) => obj.indicatorClusterId === selectedIndicatorCluster);
    }
    
    return filtered;
  }, [objectivesDictionary, searchQuery, selectedIndicatorCluster]);

  const objectivesByIndicatorCluster = useMemo(() => {
    const grouped: Record<string, ObjectiveDictionary[]> = {};
    filteredObjectives.forEach((obj) => {
      const clusterName = obj.indicatorCluster?.name || "Non categorizzato";
      if (!grouped[clusterName]) {
        grouped[clusterName] = [];
      }
      grouped[clusterName].push(obj);
    });
    return grouped;
  }, [filteredObjectives]);

  const getClusterIcon = (name: string) => {
    if (name.includes("Gruppo")) return Users;
    if (name.includes("ESG")) return Leaf;
    if (name.includes("Direzione")) return Building;
    return Target;
  };

  const handleEditObjective = (obj: ObjectiveDictionary) => {
    setEditingId(obj.id);
    setNewObjective({
      title: obj.title,
      description: obj.description || "",
      indicatorClusterId: obj.indicatorClusterId,
      calculationTypeId: obj.calculationTypeId,
      objectiveType: obj.objectiveType || "numeric",
      targetValue: obj.targetValue?.toString() || "",
      thresholdValue: obj.thresholdValue?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingId(null);
    setNewObjective({ title: "", description: "", indicatorClusterId: "", calculationTypeId: "", objectiveType: "numeric", targetValue: "", thresholdValue: "" });
    setIsDialogOpen(false);
  };

  const style = {
    "--sidebar-width": "16rem",
  };

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
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-8 w-8" />
                    Database Obiettivi
                  </h1>
                  <p className="text-muted-foreground">
                    Gestisci il dizionario completo degli obiettivi MBO
                  </p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-objective">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuovo Obiettivo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Modifica Obiettivo" : "Crea Nuovo Obiettivo"}</DialogTitle>
                      <DialogDescription>
                        {editingId ? "Modifica i dettagli dell'obiettivo" : "Aggiungi un nuovo obiettivo al dizionario MBO"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="objective-title">Titolo</Label>
                        <Input
                          id="objective-title"
                          placeholder="Es. Migliorare la customer satisfaction del 15%"
                          value={newObjective.title}
                          onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                          data-testid="input-objective-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="objective-description">Descrizione</Label>
                        <Textarea
                          id="objective-description"
                          placeholder="Descrizione dettagliata dell'obiettivo..."
                          rows={3}
                          value={newObjective.description}
                          onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                          data-testid="input-objective-description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="indicator-cluster">Categoria Indicatore</Label>
                          <Select
                            value={newObjective.indicatorClusterId}
                            onValueChange={(value) => setNewObjective({ ...newObjective, indicatorClusterId: value })}
                          >
                            <SelectTrigger id="indicator-cluster" data-testid="select-indicator-cluster">
                              <SelectValue placeholder="Seleziona categoria" />
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
                        <div className="space-y-2">
                          <Label htmlFor="calculation-type">Tipo di Calcolo</Label>
                          <Select
                            value={newObjective.calculationTypeId}
                            onValueChange={(value) => setNewObjective({ ...newObjective, calculationTypeId: value })}
                          >
                            <SelectTrigger id="calculation-type" data-testid="select-calculation-type">
                              <SelectValue placeholder="Seleziona calcolo" />
                            </SelectTrigger>
                            <SelectContent>
                              {calculationTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="objective-type">Tipo di Obiettivo</Label>
                          <Select
                            value={newObjective.objectiveType}
                            onValueChange={(value) => setNewObjective({ ...newObjective, objectiveType: value })}
                          >
                            <SelectTrigger id="objective-type" data-testid="select-objective-type">
                              <SelectValue placeholder="Seleziona tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="numeric">Numerico</SelectItem>
                              <SelectItem value="qualitative">Qualitativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newObjective.objectiveType === "numeric" && (
                          <div className="space-y-2">
                            <Label htmlFor="target-value">Valore Target</Label>
                            <Input
                              id="target-value"
                              type="number"
                              placeholder="Es. 100"
                              value={newObjective.targetValue}
                              onChange={(e) => setNewObjective({ ...newObjective, targetValue: e.target.value })}
                              data-testid="input-target-value"
                            />
                          </div>
                        )}
                      </div>
                      {newObjective.objectiveType === "numeric" && (
                        <div className="space-y-2">
                          <Label htmlFor="threshold-value">Valore Soglia (opzionale)</Label>
                          <Input
                            id="threshold-value"
                            type="number"
                            placeholder="Es. 50 - sotto questo valore l'obiettivo è 0%"
                            value={newObjective.thresholdValue}
                            onChange={(e) => setNewObjective({ ...newObjective, thresholdValue: e.target.value })}
                            data-testid="input-threshold-value"
                          />
                          <p className="text-xs text-muted-foreground">
                            Se impostato: valori sotto la soglia = 0%, tra soglia e target = interpolazione lineare, al target = 100%
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={handleCloseDialog}
                        data-testid="button-cancel"
                      >
                        Annulla
                      </Button>
                      <Button
                        onClick={() => {
                          if (editingId) {
                            updateObjectiveMutation.mutate({ id: editingId, ...newObjective });
                          } else {
                            createObjectiveMutation.mutate(newObjective);
                          }
                        }}
                        disabled={!newObjective.title || !newObjective.indicatorClusterId || !newObjective.calculationTypeId || (newObjective.objectiveType === "numeric" && !newObjective.targetValue) || createObjectiveMutation.isPending || updateObjectiveMutation.isPending}
                        data-testid={editingId ? "button-update" : "button-create"}
                      >
                        {editingId ? (updateObjectiveMutation.isPending ? "Aggiornamento..." : "Aggiorna Obiettivo") : (createObjectiveMutation.isPending ? "Creazione..." : "Crea Obiettivo")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Obiettivi nel Database</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-objectives">
                      {objectivesDictionary.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Totale obiettivi disponibili</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cluster Obiettivi</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-clusters">
                      {objectiveClusters.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Cluster di assegnazione</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tipi di Calcolo</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-calculation-types">
                      {calculationTypes.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Formule di valutazione</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle>Dizionario Obiettivi</CardTitle>
                      <CardDescription>
                        Tutti gli obiettivi disponibili organizzati per categoria
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca obiettivi..."
                          className="pl-9 w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          data-testid="input-search"
                        />
                      </div>
                      <Select value={selectedIndicatorCluster} onValueChange={setSelectedIndicatorCluster}>
                        <SelectTrigger className="w-[200px]" data-testid="select-filter-cluster">
                          <SelectValue placeholder="Filtra per categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutte le categorie</SelectItem>
                          {indicatorClusters.map((cluster) => (
                            <SelectItem key={cluster.id} value={cluster.id}>
                              {cluster.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {dictLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                  ) : Object.keys(objectivesByIndicatorCluster).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nessun obiettivo trovato
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(objectivesByIndicatorCluster).map(([clusterName, objectives]) => {
                        const Icon = getClusterIcon(clusterName);
                        return (
                          <div key={clusterName} className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b">
                              <Icon className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{clusterName}</h3>
                              <Badge variant="secondary" className="ml-auto">
                                {objectives.length} obiettivi
                              </Badge>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[30%]">Titolo</TableHead>
                                  <TableHead className="w-[25%]">Descrizione</TableHead>
                                  <TableHead className="w-[15%]">Indicatore</TableHead>
                                  <TableHead className="w-[15%]">Tipo Calcolo</TableHead>
                                  <TableHead className="w-[15%] text-right">Azioni</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {objectives.map((obj) => (
                                  <TableRow key={obj.id} data-testid={`row-objective-${obj.id}`}>
                                    <TableCell className="font-medium">{obj.title}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      {obj.description || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">
                                        {obj.indicatorCluster?.name || "N/A"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {obj.calculationType?.name || "N/A"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEditObjective(obj)}
                                          data-testid={`button-edit-objective-${obj.id}`}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog open={deleteId === obj.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setDeleteId(obj.id)}
                                            data-testid={`button-delete-objective-${obj.id}`}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Elimina Obiettivo</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Sei sicuro di voler eliminare "{obj.title}"? Questa azione non può essere annullata.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            {assignmentsForDeletedObjective.length > 0 && (
                                              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 space-y-2">
                                                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                                  Attenzione: Questo obiettivo è assegnato a {assignmentsForDeletedObjective.length} {assignmentsForDeletedObjective.length === 1 ? 'dipendente' : 'dipendenti'}
                                                </p>
                                                <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                                                  {assignmentsForDeletedObjective.slice(0, 3).map(({ user: assignedUser }: { user: any }) => (
                                                    <li key={assignedUser.id}>• {assignedUser.firstName} {assignedUser.lastName}</li>
                                                  ))}
                                                  {assignmentsForDeletedObjective.length > 3 && (
                                                    <li>• +{assignmentsForDeletedObjective.length - 3} altri</li>
                                                  )}
                                                </ul>
                                              </div>
                                            )}
                                            <div className="flex justify-end gap-2">
                                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => deleteObjectiveMutation.mutate(obj.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Elimina
                                              </AlertDialogAction>
                                            </div>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cluster di Assegnazione</CardTitle>
                  <CardDescription>
                    I cluster utilizzati per assegnare gli obiettivi ai dipendenti
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {objectiveClusters.map((cluster) => {
                      const Icon = getClusterIcon(cluster.name);
                      return (
                        <Card key={cluster.id} className="hover-elevate" data-testid={`card-cluster-${cluster.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm">{cluster.name}</h4>
                                <p className="text-xs text-muted-foreground">Peso: {cluster.weight}%</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{cluster.description}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
