import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface IndicatorCluster {
  id: string;
  name: string;
  description?: string;
}

interface CalculationType {
  id: string;
  name: string;
  description?: string;
  formula?: string;
}

interface BusinessFunction {
  id: string;
  name: string;
  description?: string;
  primoLivelloId?: string;
  secondoLivelloId?: string;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [openClusterDialog, setOpenClusterDialog] = useState(false);
  const [openCalcDialog, setOpenCalcDialog] = useState(false);
  const [openBusinessDialog, setOpenBusinessDialog] = useState(false);
  const [editingCluster, setEditingCluster] = useState<IndicatorCluster | null>(null);
  const [editingCalc, setEditingCalc] = useState<CalculationType | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<BusinessFunction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"cluster" | "calc" | "business" | null>(null);

  const [clusterForm, setClusterForm] = useState({ name: "", description: "" });
  const [calcForm, setCalcForm] = useState({ name: "", description: "", formula: "" });
  const [businessForm, setBusinessForm] = useState({ name: "", description: "", primoLivelloId: "", secondoLivelloId: "" });

  // Queries
  const { data: clusters = [], isLoading: clusterLoading } = useQuery<IndicatorCluster[]>({
    queryKey: ["/api/indicator-clusters"],
    enabled: !!user,
  });

  const { data: calcTypes = [], isLoading: calcLoading } = useQuery<CalculationType[]>({
    queryKey: ["/api/calculation-types"],
    enabled: !!user,
  });

  const { data: businessFunctions = [], isLoading: businessLoading } = useQuery<BusinessFunction[]>({
    queryKey: ["/api/business-functions"],
    enabled: !!user,
  });

  // Mutations - Clusters
  const createClusterMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/indicator-clusters", clusterForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicator-clusters"] });
      setClusterForm({ name: "", description: "" });
      setOpenClusterDialog(false);
      toast({ title: "Successo", description: "Cluster creato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione del cluster", variant: "destructive" });
    },
  });

  const updateClusterMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/indicator-clusters/${editingCluster?.id}`, clusterForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicator-clusters"] });
      setClusterForm({ name: "", description: "" });
      setEditingCluster(null);
      setOpenClusterDialog(false);
      toast({ title: "Successo", description: "Cluster aggiornato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento del cluster", variant: "destructive" });
    },
  });

  const deleteClusterMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/indicator-clusters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicator-clusters"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Cluster eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione del cluster", variant: "destructive" });
    },
  });

  // Mutations - Calculation Types
  const createCalcMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/calculation-types", calcForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculation-types"] });
      setCalcForm({ name: "", description: "", formula: "" });
      setOpenCalcDialog(false);
      toast({ title: "Successo", description: "Tipo di calcolo creato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione del tipo di calcolo", variant: "destructive" });
    },
  });

  const updateCalcMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/calculation-types/${editingCalc?.id}`, calcForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculation-types"] });
      setCalcForm({ name: "", description: "", formula: "" });
      setEditingCalc(null);
      setOpenCalcDialog(false);
      toast({ title: "Successo", description: "Tipo di calcolo aggiornato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento del tipo di calcolo", variant: "destructive" });
    },
  });

  const deleteCalcMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/calculation-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculation-types"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Tipo di calcolo eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione del tipo di calcolo", variant: "destructive" });
    },
  });

  // Mutations - Business Functions
  const createBusinessMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/business-functions", businessForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-functions"] });
      setBusinessForm({ name: "", description: "", primoLivelloId: "", secondoLivelloId: "" });
      setOpenBusinessDialog(false);
      toast({ title: "Successo", description: "Funzione aziendale creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione della funzione aziendale", variant: "destructive" });
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/business-functions/${editingBusiness?.id}`, businessForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-functions"] });
      setBusinessForm({ name: "", description: "", primoLivelloId: "", secondoLivelloId: "" });
      setEditingBusiness(null);
      setOpenBusinessDialog(false);
      toast({ title: "Successo", description: "Funzione aziendale aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento della funzione aziendale", variant: "destructive" });
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/business-functions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-functions"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Funzione aziendale eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione della funzione aziendale", variant: "destructive" });
    },
  });

  const handleEditCluster = (cluster: IndicatorCluster) => {
    setEditingCluster(cluster);
    setClusterForm({ name: cluster.name, description: cluster.description || "" });
    setOpenClusterDialog(true);
  };

  const handleEditCalc = (calc: CalculationType) => {
    setEditingCalc(calc);
    setCalcForm({ name: calc.name, description: calc.description || "", formula: calc.formula || "" });
    setOpenCalcDialog(true);
  };

  const handleEditBusiness = (business: BusinessFunction) => {
    setEditingBusiness(business);
    setBusinessForm({ 
      name: business.name, 
      description: business.description || "",
      primoLivelloId: business.primoLivelloId || "",
      secondoLivelloId: business.secondoLivelloId || ""
    });
    setOpenBusinessDialog(true);
  };

  const handleSaveCluster = () => {
    if (!clusterForm.name.trim()) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }
    if (editingCluster) {
      updateClusterMutation.mutate();
    } else {
      createClusterMutation.mutate();
    }
  };

  const handleSaveCalc = () => {
    if (!calcForm.name.trim()) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }
    if (editingCalc) {
      updateCalcMutation.mutate();
    } else {
      createCalcMutation.mutate();
    }
  };

  const handleSaveBusiness = () => {
    if (!businessForm.name.trim()) {
      toast({ title: "Errore", description: "Il nome del dipartimento è obbligatorio", variant: "destructive" });
      return;
    }
    if (editingBusiness) {
      updateBusinessMutation.mutate();
    } else {
      createBusinessMutation.mutate();
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteId || !deleteType) return;
    if (deleteType === "cluster") {
      deleteClusterMutation.mutate(deleteId);
    } else if (deleteType === "calc") {
      deleteCalcMutation.mutate(deleteId);
    } else if (deleteType === "business") {
      deleteBusinessMutation.mutate(deleteId);
    }
  };

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Settings className="h-8 w-8" />
                  Impostazioni Strutture
                </h1>
                <p className="text-muted-foreground mt-2">Configura indicatori, tipi di calcolo e funzioni aziendali</p>
              </div>

              <Tabs defaultValue="clusters" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="clusters">Indicatori</TabsTrigger>
                  <TabsTrigger value="calculations">Tipi di Calcolo</TabsTrigger>
                  <TabsTrigger value="business">Funzioni Aziendali</TabsTrigger>
                </TabsList>

                {/* Clusters Tab */}
                <TabsContent value="clusters" className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>Cluster Indicatori</CardTitle>
                        <CardDescription>Crea e gestisci i cluster di indicatori per gli obiettivi</CardDescription>
                      </div>
                      <Dialog open={openClusterDialog} onOpenChange={setOpenClusterDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingCluster(null); setClusterForm({ name: "", description: "" }); }} data-testid="button-add-cluster">
                            <Plus className="h-4 w-4 mr-2" />
                            Nuovo Cluster
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-cluster">
                          <DialogHeader>
                            <DialogTitle>{editingCluster ? "Modifica Cluster" : "Nuovo Cluster"}</DialogTitle>
                            <DialogDescription>
                              Compila i dettagli del cluster indicatore
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="cluster-name">Nome *</Label>
                              <Input
                                id="cluster-name"
                                value={clusterForm.name}
                                onChange={(e) => setClusterForm({ ...clusterForm, name: e.target.value })}
                                placeholder="Es: Obiettivi di Gruppo"
                                data-testid="input-cluster-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cluster-description">Descrizione</Label>
                              <Textarea
                                id="cluster-description"
                                value={clusterForm.description}
                                onChange={(e) => setClusterForm({ ...clusterForm, description: e.target.value })}
                                placeholder="Descrizione del cluster"
                                data-testid="input-cluster-description"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSaveCluster}
                              disabled={createClusterMutation.isPending || updateClusterMutation.isPending}
                              data-testid="button-save-cluster"
                            >
                              {createClusterMutation.isPending || updateClusterMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {clusterLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                      ) : clusters.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nessun cluster trovato</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Descrizione</TableHead>
                              <TableHead className="w-24">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {clusters.map((cluster) => (
                              <TableRow key={cluster.id} data-testid={`row-cluster-${cluster.id}`}>
                                <TableCell className="font-medium" data-testid={`text-cluster-name-${cluster.id}`}>{cluster.name}</TableCell>
                                <TableCell data-testid={`text-cluster-description-${cluster.id}`}>{cluster.description || "-"}</TableCell>
                                <TableCell className="space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCluster(cluster)}
                                    data-testid={`button-edit-cluster-${cluster.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteId(cluster.id); setDeleteType("cluster"); }}
                                    data-testid={`button-delete-cluster-${cluster.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Calculation Types Tab */}
                <TabsContent value="calculations" className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>Tipi di Calcolo</CardTitle>
                        <CardDescription>Crea e gestisci i tipi di calcolo per la valutazione degli obiettivi</CardDescription>
                      </div>
                      <Dialog open={openCalcDialog} onOpenChange={setOpenCalcDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingCalc(null); setCalcForm({ name: "", description: "", formula: "" }); }} data-testid="button-add-calc">
                            <Plus className="h-4 w-4 mr-2" />
                            Nuovo Tipo
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-calc">
                          <DialogHeader>
                            <DialogTitle>{editingCalc ? "Modifica Tipo" : "Nuovo Tipo di Calcolo"}</DialogTitle>
                            <DialogDescription>
                              Compila i dettagli del tipo di calcolo
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="calc-name">Nome *</Label>
                              <Input
                                id="calc-name"
                                value={calcForm.name}
                                onChange={(e) => setCalcForm({ ...calcForm, name: e.target.value })}
                                placeholder="Es: Interpolazione Lineare"
                                data-testid="input-calc-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="calc-description">Descrizione</Label>
                              <Textarea
                                id="calc-description"
                                value={calcForm.description}
                                onChange={(e) => setCalcForm({ ...calcForm, description: e.target.value })}
                                placeholder="Descrizione del tipo di calcolo"
                                data-testid="input-calc-description"
                              />
                            </div>
                            <div>
                              <Label htmlFor="calc-formula">Formula</Label>
                              <Textarea
                                id="calc-formula"
                                value={calcForm.formula}
                                onChange={(e) => setCalcForm({ ...calcForm, formula: e.target.value })}
                                placeholder="Es: score = (actual / target) * 100"
                                data-testid="input-calc-formula"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSaveCalc}
                              disabled={createCalcMutation.isPending || updateCalcMutation.isPending}
                              data-testid="button-save-calc"
                            >
                              {createCalcMutation.isPending || updateCalcMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {calcLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                      ) : calcTypes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nessun tipo trovato</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Descrizione</TableHead>
                              <TableHead>Formula</TableHead>
                              <TableHead className="w-24">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {calcTypes.map((calc) => (
                              <TableRow key={calc.id} data-testid={`row-calc-${calc.id}`}>
                                <TableCell className="font-medium" data-testid={`text-calc-name-${calc.id}`}>{calc.name}</TableCell>
                                <TableCell data-testid={`text-calc-description-${calc.id}`}>{calc.description || "-"}</TableCell>
                                <TableCell className="text-xs font-mono" data-testid={`text-calc-formula-${calc.id}`}>{calc.formula ? calc.formula.substring(0, 40) + "..." : "-"}</TableCell>
                                <TableCell className="space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCalc(calc)}
                                    data-testid={`button-edit-calc-${calc.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteId(calc.id); setDeleteType("calc"); }}
                                    data-testid={`button-delete-calc-${calc.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Functions Tab - Departments */}
                <TabsContent value="business" className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>Funzioni Aziendali</CardTitle>
                        <CardDescription>Gestisci i dipartimenti (strutture di primo livello)</CardDescription>
                      </div>
                      <Dialog open={openBusinessDialog} onOpenChange={setOpenBusinessDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingBusiness(null); setBusinessForm({ name: "", description: "", primoLivelloId: "", secondoLivelloId: "" }); }} data-testid="button-add-business">
                            <Plus className="h-4 w-4 mr-2" />
                            Nuovo Dipartimento
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-business">
                          <DialogHeader>
                            <DialogTitle>{editingBusiness ? "Modifica Dipartimento" : "Nuovo Dipartimento"}</DialogTitle>
                            <DialogDescription>
                              Compila i dettagli del dipartimento con le sue strutture gerarchiche
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="business-name">Nome del Dipartimento *</Label>
                              <Input
                                id="business-name"
                                value={businessForm.name}
                                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                                placeholder="Es: Contabilità, Risorse Umane, IT"
                                data-testid="input-business-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="business-primo-livello">Struttura di Primo Livello</Label>
                              <Select value={businessForm.primoLivelloId || ""} onValueChange={(val) => setBusinessForm({ ...businessForm, primoLivelloId: val })}>
                                <SelectTrigger id="business-primo-livello" data-testid="select-business-primo-livello">
                                  <SelectValue placeholder="Seleziona primo livello" />
                                </SelectTrigger>
                                <SelectContent>
                                  {businessFunctions.map((b) => (
                                    <SelectItem key={b.id} value={b.id} data-testid={`option-primo-livello-${b.id}`}>{b.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="business-secondo-livello">Struttura di Secondo Livello</Label>
                              <Select value={businessForm.secondoLivelloId || ""} onValueChange={(val) => setBusinessForm({ ...businessForm, secondoLivelloId: val })}>
                                <SelectTrigger id="business-secondo-livello" data-testid="select-business-secondo-livello">
                                  <SelectValue placeholder="Seleziona secondo livello" />
                                </SelectTrigger>
                                <SelectContent>
                                  {businessFunctions.map((b) => (
                                    <SelectItem key={b.id} value={b.id} data-testid={`option-secondo-livello-${b.id}`}>{b.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="business-description">Descrizione</Label>
                              <Textarea
                                id="business-description"
                                value={businessForm.description}
                                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                                placeholder="Descrizione del dipartimento"
                                data-testid="input-business-description"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSaveBusiness}
                              disabled={createBusinessMutation.isPending || updateBusinessMutation.isPending}
                              data-testid="button-save-business"
                            >
                              {createBusinessMutation.isPending || updateBusinessMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {businessLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                      ) : businessFunctions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nessun dipartimento trovato</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome Dipartimento</TableHead>
                              <TableHead>Primo Livello</TableHead>
                              <TableHead>Secondo Livello</TableHead>
                              <TableHead>Descrizione</TableHead>
                              <TableHead className="w-24">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {businessFunctions.map((business) => (
                              <TableRow key={business.id} data-testid={`row-business-${business.id}`}>
                                <TableCell className="font-medium" data-testid={`text-business-name-${business.id}`}>{business.name}</TableCell>
                                <TableCell data-testid={`text-business-primo-${business.id}`}>{businessFunctions.find((b) => b.id === business.primoLivelloId)?.name || "-"}</TableCell>
                                <TableCell data-testid={`text-business-secondo-${business.id}`}>{businessFunctions.find((b) => b.id === business.secondoLivelloId)?.name || "-"}</TableCell>
                                <TableCell data-testid={`text-business-description-${business.id}`}>{business.description || "-"}</TableCell>
                                <TableCell className="space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditBusiness(business)}
                                    data-testid={`button-edit-business-${business.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteId(business.id); setDeleteType("business"); }}
                                    data-testid={`button-delete-business-${business.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={deleteId !== null} onOpenChange={() => { setDeleteId(null); setDeleteType(null); }}>
                <AlertDialogContent data-testid="dialog-confirm-delete">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare questo elemento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione non può essere annullata
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    disabled={deleteClusterMutation.isPending || deleteCalcMutation.isPending || deleteBusinessMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    Elimina
                  </AlertDialogAction>
                  <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
