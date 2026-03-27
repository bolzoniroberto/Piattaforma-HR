import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function AdminClearAllAssignmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/assignments/clear-all", {});
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Impossibile completare l'operazione");
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate all assignment-related queries using predicate to match all patterns
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.includes("/api/assignments");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-with-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "Deassociazione completata",
        description: `${data.deletedCount || 0} obiettivi rimossi da tutti gli utenti`,
      });
      setShowConfirm(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile completare l'operazione",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          {/* SIDEBAR CONTAINER - Fixed 312px width, always reserved */}
          {/* MAIN CONTENT - flex-1, never resizes, NO margin transitions */}
          <main className="w-full space-y-6 flex flex-col pt-4" >
          <div className="w-full space-y-6">
              <PageHeader 
                context="GESTIONE ASSEGNAZIONI" 
                title="Disassocia Tutti gli Obiettivi" 
                description="Rimuovi massivamente le assegnazioni degli obiettivi da tutti gli utenti. I dati storici rimarranno intatti."
              />
              <Card className="md3-surface md3-motion-standard border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="md3-title-large text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Attenzione: Operazione Importante
                  </CardTitle>
                  <CardDescription className="md3-body-medium">
                    Questa azione disassocerà tutti gli obiettivi da tutti i dipendenti. Gli obiettivi rimangono nel sistema, ma verranno rimossi dalle assegnazioni dei dipendenti.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-background border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium mb-2">Cosa succederà:</p>
                      <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                        <li>Gli obiettivi verranno disassociati da {allUsers.filter(u => u.role === "employee").length} dipendenti</li>
                        <li>I dati degli obiettivi non verranno eliminati dal database</li>
                        <li>I progressi e la rendicontazione storica rimarranno disponibili nel reporting</li>
                        <li>Potrai riassegnare gli obiettivi agli utenti in seguito</li>
                      </ul>
                    </div>

                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => setShowConfirm(true)}
                      disabled={clearMutation.isPending}
                      className="w-full"
                      data-testid="button-clear-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {clearMutation.isPending ? "Disassociazione in corso..." : "Disassocia Tutti gli Obiettivi"}
                    </Button>
                  </div>
                </CardContent>
            </Card>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent data-testid="dialog-confirm-clear">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confermare la disassociazione?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Stai per disassociare TUTTI gli obiettivi da TUTTI gli utenti. Gli obiettivi rimarranno nel sistema ma non saranno più assegnati ai dipendenti. I dati storici resteranno disponibili.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogAction
                    onClick={() => clearMutation.mutate()}
                    disabled={clearMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-clear"
                  >
                    {clearMutation.isPending ? "Disassociazione in corso..." : "Disassocia Tutti"}
                  </AlertDialogAction>
                <AlertDialogCancel data-testid="button-cancel-clear">Annulla</AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>

          {/* AppActionsPanel - Right sidebar, conditional rendering OK */}
          {isActionsPanelOpen && (
            <AppActionsPanel
              isOpen={isActionsPanelOpen}
              onClose={() => setIsActionsPanelOpen(false)}
              title="Disassocia Tutti"
            >
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="text-xs font-medium text-destructive">Operazione Critica</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Questa azione rimuoverà tutte le assegnazioni obiettivi da tutti i dipendenti.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Statistiche</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dipendenti Totali</span>
                  <span className="font-semibold">{allUsers.filter(u => u.role === "employee").length}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Attenzione: Gli obiettivi rimangono nel dizionario, solo le assegnazioni vengono rimosse.
              </p>
            </div>
            </AppActionsPanel>
          )}
        </div>
      </div>
    </>
  );
}
