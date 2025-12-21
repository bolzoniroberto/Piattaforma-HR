import { useParams, useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import { useRail } from "@/contexts/RailContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowLeft } from "lucide-react";

export default function AdminUserProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { codiceFiscale } = useParams<{ codiceFiscale: string }>();
  const { activeSection, setActiveSection } = useRail();

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Fetch user data
  const { data: persona, isLoading } = useQuery({
    queryKey: [`/api/users/${codiceFiscale}`],
    enabled: !!codiceFiscale,
    queryFn: async () => {
      const response = await fetch(`/api/users/${codiceFiscale}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("User not found");
      return response.json();
    },
  });

  return (
    <>
      <AppHeader
        userName={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Amministratore" : "Amministratore"}
        userRole="Amministratore"
        notificationCount={0}
        showSidebarTrigger={true}
        pageTitle={persona ? `${persona.firstName} ${persona.lastName}` : "Profilo Dipendente"}
        pageIcon={Users}
        pageDescription={persona ? `CF: ${persona.codiceFiscale || "-"}` : "Caricamento profilo..."}
      />

      <div className="min-h-[calc(100vh-4rem)] bg-background pl-2 pr-6 py-6">
        <div className="flex gap-6 max-w-[1800px] mx-auto">
          {/* SIDEBAR CONTAINER */}
          <div className="w-[312px] shrink-0 flex gap-3">
            <AppRail activeSection={activeSection} onSectionClick={handleSectionClick} />
            <AppPanel activeSection={activeSection} className="transition-opacity duration-200" />
          </div>

          {/* Main Content */}
          <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: "var(--shadow-2)" }}>
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Back Button */}
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/users")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Torna a Elenco Utenti
              </Button>

              {/* Placeholder Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Profilo Dipendente</CardTitle>
                  <CardDescription>
                    Questa pagina verrà completata nella prossima fase dello sviluppo con la gestione completa dell'anagrafica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Caricamento profilo...</div>
                  ) : persona ? (
                    <div className="space-y-4">
                      <div>
                        <strong>Nome:</strong> {persona.firstName} {persona.lastName}
                      </div>
                      <div>
                        <strong>Email:</strong> {persona.email}
                      </div>
                      {persona.codiceFiscale && (
                        <div>
                          <strong>Codice Fiscale:</strong> {persona.codiceFiscale}
                        </div>
                      )}
                      <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                        <p>In questa pagina sarà possibile gestire:</p>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>Dati Anagrafici</li>
                          <li>Contatti</li>
                          <li>Organizzazione</li>
                          <li>Contratto</li>
                          <li>Part-time</li>
                          <li>Retribuzione</li>
                          <li>Ruoli & Responsabili</li>
                          <li>Smart Working (Storico)</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">Dipendente non trovato</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Actions Panel */}
      {/* AppActionsPanel is managed by RailContext */}
    </>
  );
}
