import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CustomFieldDefinition } from "@shared/schema";

const FIELD_TYPES = [
  { value: "text", label: "Testo" },
  { value: "textarea", label: "Testo Lungo" },
  { value: "number", label: "Numero" },
  { value: "date", label: "Data" },
  { value: "select", label: "Selezione Singola" },
  { value: "multiselect", label: "Selezione Multipla" },
  { value: "boolean", label: "Si/No" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefono" },
  { value: "url", label: "URL" },
];

const CATEGORIES = [
  { value: "personal", label: "Personale" },
  { value: "contact", label: "Contatto" },
  { value: "organizational", label: "Organizzativo" },
  { value: "professional", label: "Professionale" },
  { value: "custom", label: "Personalizzato" },
];

export default function AdminCustomFieldsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPanelOpen, activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [formData, setFormData] = useState({
    fieldName: "",
    fieldLabel: "",
    fieldType: "text",
    category: "custom",
    section: "",
    isRequired: false,
    isActive: true,
    isSearchable: false,
    displayOrder: 0,
    placeholder: "",
    helpText: "",
    options: "",
  });

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch custom fields
  const { data: customFields = [], isLoading } = useQuery<CustomFieldDefinition[]>({
    queryKey: ["/api/custom-fields"],
    enabled: !!user && user.role === "admin",
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/custom-fields", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({
        title: "Campo creato",
        description: "Il campo personalizzato è stato creato con successo",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione del campo",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/custom-fields/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({
        title: "Campo aggiornato",
        description: "Il campo personalizzato è stato aggiornato con successo",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del campo",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/custom-fields/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields"] });
      toast({
        title: "Campo eliminato",
        description: "Il campo personalizzato è stato eliminato",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del campo",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      category: "custom",
      section: "",
      isRequired: false,
      isActive: true,
      isSearchable: false,
      displayOrder: 0,
      placeholder: "",
      helpText: "",
      options: "",
    });
    setEditingField(null);
  };

  const handleOpenDialog = (field?: CustomFieldDefinition) => {
    if (field) {
      setEditingField(field);
      setFormData({
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType,
        category: field.category,
        section: field.section || "",
        isRequired: field.isRequired,
        isActive: field.isActive,
        isSearchable: field.isSearchable,
        displayOrder: field.displayOrder || 0,
        placeholder: field.placeholder || "",
        helpText: field.helpText || "",
        options: field.options ? JSON.stringify(field.options, null, 2) : "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const data: any = {
      fieldName: formData.fieldName,
      fieldLabel: formData.fieldLabel,
      fieldType: formData.fieldType,
      category: formData.category,
      section: formData.section || null,
      isRequired: formData.isRequired,
      isActive: formData.isActive,
      isSearchable: formData.isSearchable,
      displayOrder: formData.displayOrder,
      placeholder: formData.placeholder || null,
      helpText: formData.helpText || null,
    };

    // Parse options for select/multiselect
    if (["select", "multiselect"].includes(formData.fieldType) && formData.options) {
      try {
        data.options = JSON.parse(formData.options);
      } catch (e) {
        toast({
          title: "Errore",
          description: "Le opzioni devono essere in formato JSON valido",
          variant: "destructive",
        });
        return;
      }
    }

    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo campo? Tutti i valori associati saranno eliminati.")) {
      deleteMutation.mutate(id);
    }
  };

  const getFieldTypeLabel = (type: string) => {
    return FIELD_TYPES.find(t => t.value === type)?.label || type;
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <>
      <AppHeader
        userName={`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
        userRole="Amministratore"
        notificationCount={0}
        showSidebarTrigger={true}
        pageTitle="Campi Personalizzati"
        pageIcon={Settings}
        pageDescription="Gestione campi personalizzati per i profili utente"
      />

      <div className="min-h-[calc(100vh-4rem)] bg-background pl-2 pr-6 py-6">
        <div className="flex gap-6 max-w-[1800px] mx-auto">
          {/* SIDEBAR CONTAINER - Fixed 312px width, always reserved */}
          <div className="w-[312px] shrink-0 flex gap-3">
            <AppRail
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
            <AppPanel
              activeSection={activeSection}
              className="transition-opacity duration-200"
            />
          </div>

          <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="max-w-6xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Campi Personalizzati Definiti</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center text-muted-foreground py-8">Caricamento...</p>
                  ) : customFields.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nessun campo personalizzato definito</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Etichetta</TableHead>
                          <TableHead>Nome Interno</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Obbligatorio</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customFields
                          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                          .map((field) => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">{field.fieldLabel}</TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{field.fieldName}</code>
                              </TableCell>
                              <TableCell>{getFieldTypeLabel(field.fieldType)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{getCategoryLabel(field.category)}</Badge>
                              </TableCell>
                              <TableCell>
                                {field.isRequired ? (
                                  <Badge variant="destructive">Sì</Badge>
                                ) : (
                                  <Badge variant="secondary">No</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {field.isActive ? (
                                  <Badge className="gap-1">
                                    <Eye className="h-3 w-3" />
                                    Attivo
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    Nascosto
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDialog(field)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(field.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>

          {isActionsPanelOpen && (
            <AppActionsPanel
              isOpen={isActionsPanelOpen}
              onClose={() => setIsActionsPanelOpen(false)}
              title="Azioni Rapide"
            >
              <Button className="w-full gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Nuovo Campo
              </Button>
            </AppActionsPanel>
          )}
        </div>
      </div>

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingField ? "Modifica Campo" : "Nuovo Campo Personalizzato"}</DialogTitle>
            <DialogDescription>
              {editingField
                ? "Modifica le proprietà del campo personalizzato"
                : "Crea un nuovo campo personalizzato per i profili utente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fieldLabel">Etichetta Campo *</Label>
                <Input
                  id="fieldLabel"
                  value={formData.fieldLabel}
                  onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                  placeholder="Es: Taglia Maglietta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldName">Nome Interno *</Label>
                <Input
                  id="fieldName"
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  placeholder="Es: taglia_maglietta"
                />
                <p className="text-xs text-muted-foreground">Usa snake_case, senza spazi</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fieldType">Tipo di Campo *</Label>
                <Select value={formData.fieldType} onValueChange={(value) => setFormData({ ...formData, fieldType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Sezione (opzionale)</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="Es: Informazioni Aggiuntive"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Ordine Visualizzazione</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder (opzionale)</Label>
              <Input
                id="placeholder"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="Es: Inserisci la taglia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="helpText">Testo di Aiuto (opzionale)</Label>
              <Textarea
                id="helpText"
                value={formData.helpText}
                onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
                placeholder="Informazioni aggiuntive per l'utente"
                rows={2}
              />
            </div>

            {["select", "multiselect"].includes(formData.fieldType) && (
              <div className="space-y-2">
                <Label htmlFor="options">Opzioni (JSON) *</Label>
                <Textarea
                  id="options"
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder='[{"value": "s", "label": "S"}, {"value": "m", "label": "M"}]'
                  rows={5}
                  className="font-mono text-xs"
                />
              </div>
            )}

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="isRequired">Campo Obbligatorio</Label>
                <Switch
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Campo Attivo</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isSearchable">Ricercabile</Label>
                <Switch
                  id="isSearchable"
                  checked={formData.isSearchable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSearchable: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.fieldName || !formData.fieldLabel || createMutation.isPending || updateMutation.isPending}
            >
              {editingField ? "Salva Modifiche" : "Crea Campo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
