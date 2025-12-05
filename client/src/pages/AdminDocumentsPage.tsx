import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

interface Document {
  id: string;
  title: string;
  description: string;
  type: string;
  requiresAcceptance: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isRailOpen, activeSection, setActiveSection, isPanelOpen, setIsPanelOpen } = useRail();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: !!user,
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string }) => {
      const res = await apiRequest("PATCH", `/api/documents/${data.id}`, {
        title: data.title,
        description: data.description,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Documento aggiornato con successo" });
      setEditingId(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare il documento",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Documento eliminato con successo" });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile eliminare il documento",
        variant: "destructive",
      });
    },
  });

  const handleEditStart = (doc: Document) => {
    setEditingId(doc.id);
    setEditFormData({
      title: doc.title,
      description: doc.description,
    });
  };

  const handleEditSave = () => {
    if (editingId && editFormData.title.trim()) {
      updateDocumentMutation.mutate({
        id: editingId,
        title: editFormData.title,
        description: editFormData.description,
      });
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({ title: "", description: "" });
  };

  return (
    <div className="min-h-screen bg-background p-6">
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
        <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-3rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="md3-headline-medium mb-2 flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                Gestione Documenti
              </h1>
              <p className="md3-body-large text-muted-foreground">
                Visualizza e modifica i documenti aziendali
              </p>
            </div>

              <div className="grid gap-4">
                {documents.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nessun documento disponibile</p>
                    </CardContent>
                  </Card>
                ) : (
                  documents.map((doc) => (
                    <Card key={doc.id} className="p-4" data-testid={`card-document-${doc.id}`}>
                      {editingId === doc.id ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`title-${doc.id}`}>Titolo</Label>
                            <Input
                              id={`title-${doc.id}`}
                              value={editFormData.title}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, title: e.target.value })
                              }
                              data-testid={`input-document-title-${doc.id}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`description-${doc.id}`}>Descrizione</Label>
                            <Textarea
                              id={`description-${doc.id}`}
                              value={editFormData.description}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, description: e.target.value })
                              }
                              data-testid={`input-document-description-${doc.id}`}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleEditCancel}
                              data-testid={`button-cancel-document-${doc.id}`}
                            >
                              Annulla
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleEditSave}
                              disabled={updateDocumentMutation.isPending}
                              data-testid={`button-save-document-${doc.id}`}
                            >
                              Salva
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-semibold text-lg" data-testid={`text-document-title-${doc.id}`}>
                                {doc.title}
                              </h3>
                              {doc.requiresAcceptance && (
                                <span className="inline-block bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs px-2 py-1 rounded">
                                  Richiede accettazione
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {doc.description}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Tipo: {doc.type}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStart(doc)}
                              data-testid={`button-edit-document-${doc.id}`}
                            >
                              Modifica
                            </Button>
                            <AlertDialog open={deleteId === doc.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteId(doc.id)}
                                data-testid={`button-delete-document-${doc.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Elimina Documento</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare il documento "{doc.title}"? Questa azione non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex justify-end gap-2">
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
