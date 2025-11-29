import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [showConfirm, setShowConfirm] = useState(false);

  const style = {
    "--sidebar-width": "16rem",
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
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-dictionary"] });
      
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
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AppHeader
            userName={user?.firstName || "Admin"}
            userRole="Amministratore"
            showSidebarTrigger={true}
          />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
                  <Trash2 className="h-8 w-8" />
                  Cancella tutti gli Obiettivi
                </h1>
                <p className="text-muted-foreground">
                  Deassociate tutti gli obiettivi da tutti gli utenti
                </p>
              </div>

              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Operazione Irreversibile
                  </CardTitle>
                  <CardDescription>
                    Questa azione cancellerà tutti gli obiettivi assegnati a tutti i dipendenti del sistema. Non potrà essere annullata.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-background border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium mb-2">Cosa succederà:</p>
                      <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                        <li>Tutti gli obiettivi verranno rimossi da {allUsers.filter(u => u.role === "employee").length} dipendenti</li>
                        <li>I progressi registrati non verranno persi dal database</li>
                        <li>I dati storici rimarranno disponibili nel reporting</li>
                        <li>Potrai riassegnare gli obiettivi in seguito</li>
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
                      {clearMutation.isPending ? "Deassociazione in corso..." : "Deassociate Tutti gli Obiettivi"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent data-testid="dialog-confirm-clear">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confermare l'operazione?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Stai per deassociare TUTTI gli obiettivi da TUTTI gli utenti. Questa azione non può essere annullata.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogAction
                    onClick={() => clearMutation.mutate()}
                    disabled={clearMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-clear"
                  >
                    {clearMutation.isPending ? "Elaborazione..." : "Deassociate Tutti"}
                  </AlertDialogAction>
                  <AlertDialogCancel data-testid="button-cancel-clear">Annulla</AlertDialogCancel>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
