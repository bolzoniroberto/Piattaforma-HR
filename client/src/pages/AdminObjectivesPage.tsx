import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppActionsPanel from "@/components/AppActionsPanel";
import PageHeader from "@/components/PageHeader";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Filter, Target, Users, Leaf, Building, Calculator, Layers, Edit, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
  thresholdPayout?: number | null;
  allowOverperformance?: number | null;
  maxPayout?: number | null;
  targetDescription?: string | null;
  dataSource?: string | null;
  dataSourceEmail?: string | null;
  deadline?: number | null;
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
  const { isRailOpen, activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndicatorCluster, setSelectedIndicatorCluster] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newObjective, setNewObjective] = useState({
    title: "",
    description: "",
    targetDescription: "",
    dataSource: "",
    dataSourceEmail: "",
    indicatorClusterId: "",
    calculationTypeId: "",
    objectiveType: "numeric",
    targetValue: "",
    thresholdValue: "",
    thresholdPayout: "50",
    allowOverperformance: false,
    maxPayout: "120",
    deadline: "",
  });

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

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
        targetDescription: data.targetDescription || null,
        dataSource: data.dataSource || null,
        dataSourceEmail: data.dataSourceEmail || null,
        indicatorClusterId: data.indicatorClusterId,
        calculationTypeId: data.calculationTypeId,
        objectiveType: data.objectiveType,
        targetValue: data.objectiveType === "numeric" && data.targetValue ? parseFloat(data.targetValue) : null,
        thresholdValue: data.objectiveType === "numeric" && data.thresholdValue ? parseFloat(data.thresholdValue) : null,
        thresholdPayout: data.objectiveType === "numeric" && data.thresholdValue ? parseFloat(data.thresholdPayout) : null,
        allowOverperformance: data.allowOverperformance ? 1 : 0,
        maxPayout: data.allowOverperformance ? parseFloat(data.maxPayout) : null,
        deadline: data.deadline ? Math.floor(new Date(data.deadline).getTime() / 1000) : null,
      };
      const res = await apiRequest("POST", "/api/objectives-dictionary", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-dictionary"] });
      toast({ title: "Obiettivo creato con successo" });
      setIsDialogOpen(false);
      setNewObjective({ title: "", description: "", targetDescription: "", dataSource: "", dataSourceEmail: "", indicatorClusterId: "", calculationTypeId: "", objectiveType: "numeric", targetValue: "", thresholdValue: "", thresholdPayout: "50", allowOverperformance: false, maxPayout: "120", deadline: "" });
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
    mutationFn: async (data: { id: string; title: string; description: string; targetDescription: string; dataSource: string; dataSourceEmail: string; indicatorClusterId: string; calculationTypeId: string; objectiveType: string; targetValue: string; thresholdValue: string; thresholdPayout: string; allowOverperformance: boolean; maxPayout: string; deadline: string }) => {
      const payload = {
        title: data.title,
        description: data.description,
        targetDescription: data.targetDescription || null,
        dataSource: data.dataSource || null,
        dataSourceEmail: data.dataSourceEmail || null,
        indicatorClusterId: data.indicatorClusterId,
        calculationTypeId: data.calculationTypeId,
        objectiveType: data.objectiveType,
        targetValue: data.objectiveType === "numeric" && data.targetValue ? parseFloat(data.targetValue) : null,
        thresholdValue: data.objectiveType === "numeric" && data.thresholdValue ? parseFloat(data.thresholdValue) : null,
        thresholdPayout: data.objectiveType === "numeric" && data.thresholdValue ? parseFloat(data.thresholdPayout) : null,
        allowOverperformance: data.allowOverperformance ? 1 : 0,
        maxPayout: data.allowOverperformance ? parseFloat(data.maxPayout) : null,
        deadline: data.deadline ? Math.floor(new Date(data.deadline).getTime() / 1000) : null,
      };
      const res = await apiRequest("PATCH", `/api/objectives-dictionary/${data.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-dictionary"] });
      toast({ title: "Obiettivo aggiornato con successo" });
      setEditingId(null);
      setIsDialogOpen(false);
      setNewObjective({ title: "", description: "", targetDescription: "", dataSource: "", dataSourceEmail: "", indicatorClusterId: "", calculationTypeId: "", objectiveType: "numeric", targetValue: "", thresholdValue: "", thresholdPayout: "50", allowOverperformance: false, maxPayout: "120", deadline: "" });
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
      thresholdPayout: (obj.thresholdPayout ?? 50).toString(),
      allowOverperformance: (obj.allowOverperformance ?? 0) === 1,
      maxPayout: (obj.maxPayout ?? 120).toString(),
      targetDescription: obj.targetDescription || "",
      dataSource: obj.dataSource || "",
      dataSourceEmail: obj.dataSourceEmail || "",
      deadline: obj.deadline ? new Date(obj.deadline * 1000).toISOString().split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingId(null);
    setNewObjective({ title: "", description: "", targetDescription: "", dataSource: "", dataSourceEmail: "", indicatorClusterId: "", calculationTypeId: "", objectiveType: "numeric", targetValue: "", thresholdValue: "", thresholdPayout: "50", allowOverperformance: false, maxPayout: "120", deadline: "" });
    setIsDialogOpen(false);
  };

  return (
    <div className="flex gap-6 w-full pb-8">
      <main className="w-full space-y-6 flex flex-col pt-4" >
        <div className="w-full space-y-6 w-full relative h-full">
          <PageHeader 
            context="GESTIONE OBIETTIVI" 
            title="Database Obiettivi" 
            description="Gestisci il dizionario centralizzato degli obiettivi assegnabili ai dipendenti."
          />
                <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                  <DialogContent className="sm:max-w-[600px] rounded-3xl" style={{boxShadow: 'var(--shadow-5)'}}>
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Modifica Obiettivo" : "Crea Nuovo Obiettivo"}</DialogTitle>
                      <DialogDescription>
                        {editingId ? "Modifica i dettagli dell'obiettivo" : "Aggiungi un nuovo obiettivo al dizionario"}
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
                          rows={2}
                          value={newObjective.description}
                          onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                          data-testid="input-objective-description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-description">Descrizione Target</Label>
                        <Textarea
                          id="target-description"
                          placeholder="Cosa significa raggiungere il target? Es. Presentazione piano al CdA entro 30 giugno..."
                          rows={2}
                          value={newObjective.targetDescription}
                          onChange={(e) => setNewObjective({ ...newObjective, targetDescription: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="data-source">Fonte Dati</Label>
                          <Input
                            id="data-source"
                            placeholder="Es. Dati consuntivazione al 31 dic. — [Fonte: Controlling]"
                            value={newObjective.dataSource}
                            onChange={(e) => setNewObjective({ ...newObjective, dataSource: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="data-source-email">Email Responsabile Fonte</Label>
                          <Input
                            id="data-source-email"
                            type="email"
                            placeholder="Es. controlling@azienda.it"
                            value={newObjective.dataSourceEmail}
                            onChange={(e) => setNewObjective({ ...newObjective, dataSourceEmail: e.target.value })}
                          />
                          <p className="text-[10px] text-muted-foreground">Riceverà link per rendicontare via email</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline">Data di Scadenza / Verifica</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={newObjective.deadline}
                          onChange={(e) => setNewObjective({ ...newObjective, deadline: e.target.value })}
                        />
                        <p className="text-[10px] text-muted-foreground">Il dipendente riceve alert 60 e 30 giorni prima</p>
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
                        <div className="space-y-4">
                          {/* Threshold Value + Threshold Payout */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="threshold-value">Valore Soglia (opzionale)</Label>
                              <Input
                                id="threshold-value"
                                type="number"
                                placeholder="Es. 85"
                                value={newObjective.thresholdValue}
                                onChange={(e) => setNewObjective({ ...newObjective, thresholdValue: e.target.value })}
                                data-testid="input-threshold-value"
                              />
                              <p className="text-xs text-muted-foreground">Sotto questo valore: 0%</p>
                            </div>
                            {newObjective.thresholdValue && (
                              <div className="space-y-2">
                                <Label htmlFor="threshold-payout">Payout alla Soglia (%)</Label>
                                <Input
                                  id="threshold-payout"
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Es. 50"
                                  value={newObjective.thresholdPayout}
                                  onChange={(e) => setNewObjective({ ...newObjective, thresholdPayout: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">% erogata esattamente alla soglia</p>
                              </div>
                            )}
                          </div>
                          {newObjective.thresholdValue && (
                            <p className="text-xs text-muted-foreground bg-slate-50 rounded p-2">
                              Logica: sotto soglia = 0% · alla soglia = {newObjective.thresholdPayout}% · interpolazione lineare fino al target = 100%
                            </p>
                          )}

                          {/* Overperformance toggle */}
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                              <p className="text-sm font-medium">Consenti Overperformance</p>
                              <p className="text-xs text-muted-foreground">Il payout può superare il 100% se l'actual supera il target</p>
                            </div>
                            <Switch
                              checked={newObjective.allowOverperformance}
                              onCheckedChange={(checked) => setNewObjective({ ...newObjective, allowOverperformance: checked })}
                            />
                          </div>
                          {newObjective.allowOverperformance && (
                            <div className="space-y-2">
                              <Label htmlFor="max-payout">Payout Massimo (%)</Label>
                              <Input
                                id="max-payout"
                                type="number"
                                min="100"
                                max="200"
                                placeholder="Es. 120"
                                value={newObjective.maxPayout}
                                onChange={(e) => setNewObjective({ ...newObjective, maxPayout: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground">Cap massimo del payout (es. 120 = fino al 120%)</p>
                            </div>
                          )}
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

              <Card className="md3-surface md3-motion-standard">
                <CardContent className="pt-6">
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
                            <div className="flex items-center gap-3 pb-3 border-b">
                              <div className="p-2 rounded-xl bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <h3 className="md3-title-medium flex-1">{clusterName}</h3>
                              <Badge variant="secondary" className="rounded-full px-3">
                                {objectives.length}
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
                                          className="md3-state-layer rounded-full"
                                          onClick={() => handleEditObjective(obj)}
                                          data-testid={`button-edit-objective-${obj.id}`}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog open={deleteId === obj.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="md3-state-layer rounded-full"
                                            onClick={() => setDeleteId(obj.id)}
                                            data-testid={`button-delete-objective-${obj.id}`}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                          <AlertDialogContent className="rounded-3xl" style={{boxShadow: 'var(--shadow-5)'}}>
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
          </div>
        </main>

          {isActionsPanelOpen && (
            <AppActionsPanel
              isOpen={isActionsPanelOpen}
              onClose={() => setIsActionsPanelOpen(false)}
              title="Gestione Obiettivi"
            >
            <Button
              className="w-full gap-2"
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-add-objective-sidebar"
            >
              <Plus className="h-4 w-4" />
              Nuovo Obiettivo
            </Button>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Cerca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca obiettivi..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-sidebar"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Filtra per categoria</Label>
              <Select value={selectedIndicatorCluster} onValueChange={setSelectedIndicatorCluster}>
                <SelectTrigger data-testid="select-filter-cluster-sidebar">
                  <SelectValue placeholder="Tutte le categorie" />
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

            <div className="pt-4 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Statistiche</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-center" data-testid="stat-total-objectives">
                  <div className="text-lg font-bold text-primary">{objectivesDictionary.length}</div>
                  <div className="text-xs text-muted-foreground">Obiettivi DB</div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-center" data-testid="stat-total-clusters">
                  <div className="text-lg font-bold text-primary">{objectiveClusters.length}</div>
                  <div className="text-xs text-muted-foreground">Cluster</div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-center" data-testid="stat-calculation-types">
                  <div className="text-lg font-bold text-primary">{calculationTypes.length}</div>
                  <div className="text-xs text-muted-foreground">Tipi Calcolo</div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-center">
                  <div className="text-lg font-bold text-primary">{filteredObjectives.length}</div>
                  <div className="text-xs text-muted-foreground">Filtrati</div>
                </div>
              </div>
            </div>
          </AppActionsPanel>
        )}
    </div>
  );
}
