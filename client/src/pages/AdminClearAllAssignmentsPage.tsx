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
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
                    <Trash2 className="h-8 w-8" />
                    Disassocia Tutti gli Obiettivi
                  </h1>
                  <p className="text-muted-foreground">
                    Rimuovi tutti gli obiettivi dall'assegnazione di tutti gli utenti
                  </p>
                </div>
              </div>

              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Attenzione: Operazione Importante
                  </CardTitle>
                  <CardDescription>
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
