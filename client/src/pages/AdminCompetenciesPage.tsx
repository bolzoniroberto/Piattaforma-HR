import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
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
  DialogHeader,
  DialogTitle,
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
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Award, Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface CompetencyModel {
  id: string;
  name: string;
  description: string;
  personaType: string;
  isActive: boolean;
  createdAt: string;
}

interface Competency {
  id: string;
  modelId: string;
  name: string;
  description: string;
  category: string;
  isTransversal: boolean;
  displayOrder: number;
}

const personaTypeLabels = {
  executive: "Executive",
  manager: "Manager",
  professional: "Professional",
  individual_contributor: "Individual Contributor",
};

const categoryLabels = {
  technical: "Tecnica",
  behavioral: "Comportamentale",
  leadership: "Leadership",
  transversal: "Trasversale",
};

export default function AdminCompetenciesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();

  // Model states
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<CompetencyModel | null>(null);
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null);
  const [modelFormData, setModelFormData] = useState({
    name: "",
    description: "",
    personaType: "executive",
  });

  // Competency states
  const [isCompetencyDialogOpen, setIsCompetencyDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [deleteCompetencyId, setDeleteCompetencyId] = useState<string | null>(null);
  const [competencyFormData, setCompetencyFormData] = useState({
    modelId: "",
    name: "",
    description: "",
    category: "technical",
    isTransversal: false,
  });

  const [selectedModelFilter, setSelectedModelFilter] = useState<string>("all");

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch competency models
  const { data: models = [] } = useQuery<CompetencyModel[]>({
    queryKey: ["/api/admin/competency-models"],
    enabled: !!user,
  });

  // Fetch competencies
  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/admin/competencies", selectedModelFilter],
    queryFn: async () => {
      const url = selectedModelFilter === "all"
        ? "/api/admin/competencies"
        : `/api/admin/competencies?modelId=${selectedModelFilter}`;
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user,
  });

  // Create/Update Model Mutation
  const saveModelMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingModel) {
        const res = await apiRequest("PATCH", `/api/admin/competency-models/${editingModel.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/competency-models", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competency-models"] });
      toast({ title: editingModel ? "Modello aggiornato" : "Modello creato con successo" });
      setIsModelDialogOpen(false);
      resetModelForm();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Operazione fallita",
        variant: "destructive",
      });
    },
  });

  // Delete Model Mutation
  const deleteModelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/competency-models/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competency-models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competencies"] });
      toast({ title: "Modello eliminato con successo" });
      setDeleteModelId(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile eliminare il modello",
        variant: "destructive",
      });
    },
  });

  // Create/Update Competency Mutation
  const saveCompetencyMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCompetency) {
        const res = await apiRequest("PATCH", `/api/admin/competencies/${editingCompetency.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/competencies", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competencies"] });
      toast({ title: editingCompetency ? "Competenza aggiornata" : "Competenza creata con successo" });
      setIsCompetencyDialogOpen(false);
      resetCompetencyForm();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Operazione fallita",
        variant: "destructive",
      });
    },
  });

  // Delete Competency Mutation
  const deleteCompetencyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/competencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competencies"] });
      toast({ title: "Competenza eliminata con successo" });
      setDeleteCompetencyId(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile eliminare la competenza",
        variant: "destructive",
      });
    },
  });

  const resetModelForm = () => {
    setModelFormData({ name: "", description: "", personaType: "executive" });
    setEditingModel(null);
  };

  const resetCompetencyForm = () => {
    setCompetencyFormData({ modelId: "", name: "", description: "", category: "technical", isTransversal: false });
    setEditingCompetency(null);
  };

  const handleEditModel = (model: CompetencyModel) => {
    setEditingModel(model);
    setModelFormData({
      name: model.name,
      description: model.description || "",
      personaType: model.personaType,
    });
    setIsModelDialogOpen(true);
  };

  const handleEditCompetency = (competency: Competency) => {
    setEditingCompetency(competency);
    setCompetencyFormData({
      modelId: competency.modelId,
      name: competency.name,
      description: competency.description || "",
      category: competency.category,
      isTransversal: competency.isTransversal,
    });
    setIsCompetencyDialogOpen(true);
  };

  const handleSaveModel = () => {
    if (!modelFormData.name.trim()) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }
    saveModelMutation.mutate(modelFormData);
  };

  const handleSaveCompetency = () => {
    if (!competencyFormData.name.trim() || !competencyFormData.modelId) {
      toast({ title: "Errore", description: "Nome e modello sono obbligatori", variant: "destructive" });
      return;
    }
    saveCompetencyMutation.mutate(competencyFormData);
  };

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          {/* SIDEBAR CONTAINER - Fixed 312px width */}
          {/* MAIN CONTENT */}
          <main className="w-full space-y-6 flex flex-col pt-4" >
            <div className="w-full space-y-6">
              <PageHeader 
                context="CONFIGURAZIONE" 
                title="Gestione Competenze" 
                description="Configura modelli di competenze e competenze per ogni persona"
              />

              <Tabs defaultValue="models" className="w-full">
                <TabsList className="mb-6 bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 space-x-8">
                  <TabsTrigger value="models" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Modelli Competenze</TabsTrigger>
                  <TabsTrigger value="competencies" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Competenze</TabsTrigger>
                </TabsList>

                {/* MODELS TAB */}
                <TabsContent value="models" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {models.length} modelli configurati
                    </p>
                    <Button onClick={() => { resetModelForm(); setIsModelDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Modello
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {models.map((model) => (
                      <Card key={model.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{model.name}</CardTitle>
                              <div className="flex gap-2">
                                <Badge variant="secondary">
                                  {personaTypeLabels[model.personaType as keyof typeof personaTypeLabels]}
                                </Badge>
                                {model.isActive && <Badge variant="default">Attivo</Badge>}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditModel(model)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteModelId(model.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {model.description || "Nessuna descrizione"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {models.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nessun modello configurato</p>
                        <Button className="mt-4" onClick={() => { resetModelForm(); setIsModelDialogOpen(true); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crea Primo Modello
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* COMPETENCIES TAB */}
                <TabsContent value="competencies" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <Select value={selectedModelFilter} onValueChange={setSelectedModelFilter}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Filtra per modello" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti i modelli</SelectItem>
                          {models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {competencies.length} competenze
                      </p>
                    </div>
                    <Button onClick={() => { resetCompetencyForm(); setIsCompetencyDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova Competenza
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {competencies.map((competency) => {
                      const model = models.find(m => m.id === competency.modelId);
                      return (
                        <Card key={competency.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3 items-start flex-1">
                              <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{competency.name}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {categoryLabels[competency.category as keyof typeof categoryLabels]}
                                  </Badge>
                                  {competency.isTransversal && (
                                    <Badge variant="secondary" className="text-xs">Trasversale</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {competency.description || "Nessuna descrizione"}
                                </p>
                                {model && (
                                  <p className="text-xs text-muted-foreground">
                                    Modello: {model.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditCompetency(competency)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteCompetencyId(competency.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {competencies.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nessuna competenza configurata</p>
                        <Button className="mt-4" onClick={() => { resetCompetencyForm(); setIsCompetencyDialogOpen(true); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crea Prima Competenza
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>

          {/* AppActionsPanel - Right sidebar */}
          {isActionsPanelOpen && (
            <AppActionsPanel
              isOpen={isActionsPanelOpen}
              onClose={() => setIsActionsPanelOpen(false)}
              title="Competenze"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Statistiche</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-center">
                      <div className="text-lg font-bold text-primary">{models.length}</div>
                      <div className="text-xs text-muted-foreground">Modelli</div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                      <div className="text-lg font-bold text-blue-600">{competencies.length}</div>
                      <div className="text-xs text-muted-foreground">Competenze</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Configura i modelli di competenze per ogni persona (Executive, Manager, Professional, Individual Contributor) e definisci le competenze specifiche o trasversali.
                  </p>
                </div>
              </div>
            </AppActionsPanel>
          )}
        </div>
      </div>

      {/* Model Dialog */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModel ? "Modifica Modello" : "Nuovo Modello di Competenze"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="model-name">Nome Modello *</Label>
              <Input
                id="model-name"
                value={modelFormData.name}
                onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                placeholder="es. Executive Competencies"
              />
            </div>
            <div>
              <Label htmlFor="model-persona">Persona Type *</Label>
              <Select value={modelFormData.personaType} onValueChange={(value) => setModelFormData({ ...modelFormData, personaType: value })}>
                <SelectTrigger id="model-persona">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="individual_contributor">Individual Contributor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="model-description">Descrizione</Label>
              <Textarea
                id="model-description"
                value={modelFormData.description}
                onChange={(e) => setModelFormData({ ...modelFormData, description: e.target.value })}
                placeholder="Descrizione del modello..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModelDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSaveModel} disabled={saveModelMutation.isPending}>
              {saveModelMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Competency Dialog */}
      <Dialog open={isCompetencyDialogOpen} onOpenChange={setIsCompetencyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompetency ? "Modifica Competenza" : "Nuova Competenza"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="comp-model">Modello *</Label>
              <Select value={competencyFormData.modelId} onValueChange={(value) => setCompetencyFormData({ ...competencyFormData, modelId: value })}>
                <SelectTrigger id="comp-model">
                  <SelectValue placeholder="Seleziona modello" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comp-name">Nome Competenza *</Label>
              <Input
                id="comp-name"
                value={competencyFormData.name}
                onChange={(e) => setCompetencyFormData({ ...competencyFormData, name: e.target.value })}
                placeholder="es. Leadership"
              />
            </div>
            <div>
              <Label htmlFor="comp-category">Categoria</Label>
              <Select value={competencyFormData.category} onValueChange={(value) => setCompetencyFormData({ ...competencyFormData, category: value })}>
                <SelectTrigger id="comp-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Tecnica</SelectItem>
                  <SelectItem value="behavioral">Comportamentale</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="transversal">Trasversale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comp-description">Descrizione</Label>
              <Textarea
                id="comp-description"
                value={competencyFormData.description}
                onChange={(e) => setCompetencyFormData({ ...competencyFormData, description: e.target.value })}
                placeholder="Descrizione della competenza..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="comp-transversal"
                checked={competencyFormData.isTransversal}
                onChange={(e) => setCompetencyFormData({ ...competencyFormData, isTransversal: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="comp-transversal" className="font-normal">
                Competenza trasversale (comune a più personas)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompetencyDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSaveCompetency} disabled={saveCompetencyMutation.isPending}>
              {saveCompetencyMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Model Confirmation */}
      <AlertDialog open={!!deleteModelId} onOpenChange={(open) => !open && setDeleteModelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Modello</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo modello? Tutte le competenze associate verranno eliminate. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteModelId && deleteModelMutation.mutate(deleteModelId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Competency Confirmation */}
      <AlertDialog open={!!deleteCompetencyId} onOpenChange={(open) => !open && setDeleteCompetencyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Competenza</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa competenza? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCompetencyId && deleteCompetencyMutation.mutate(deleteCompetencyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
