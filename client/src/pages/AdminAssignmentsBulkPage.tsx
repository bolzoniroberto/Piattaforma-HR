import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function AdminAssignmentsBulkPage() {
  const { user } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader
            userName={user?.firstName || "Admin"}
            userRole="Amministratore"
            showSidebarTrigger={true}
          />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-2">Assegnazione Obiettivi</h1>
                <p className="text-muted-foreground">
                  Gestisci l'assegnazione degli obiettivi ai dipendenti
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Assegna Obiettivi a Dipendente</CardTitle>
                  <CardDescription>
                    Seleziona un dipendente e assegnagli uno o più obiettivi dal database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Vai alla sezione "Gestione Utenti" per selezionare un dipendente e iniziare ad assegnare gli obiettivi.
                  </p>
                  <Link href="/admin/users">
                    <Button>
                      Vai a Gestione Utenti
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
