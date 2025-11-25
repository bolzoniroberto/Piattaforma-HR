import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminReportingPage() {
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
                <h1 className="text-3xl font-semibold mb-2">Rendicontazione Obiettivi</h1>
                <p className="text-muted-foreground">
                  Registra i risultati e verifica il raggiungimento degli obiettivi
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rendicontazione Obiettivi</CardTitle>
                  <CardDescription>
                    Visualizza lo stato di tutti gli obiettivi assegnati e registra i risultati
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sezione in fase di sviluppo. Qui potrai registrare se gli obiettivi sono stati raggiunti, con valutazioni e risultati finali.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
