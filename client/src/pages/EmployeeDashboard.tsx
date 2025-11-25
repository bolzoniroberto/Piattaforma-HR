import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import EmployeeCard from "@/components/EmployeeCard";
import ObjectiveCard, { type Objective } from "@/components/ObjectiveCard";
import DocumentList, { type Document } from "@/components/DocumentList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Link } from "wouter";

export default function EmployeeDashboard() {
  // Mock data - todo: remove mock functionality
  const [employee] = useState({
    id: "1",
    name: "Mario Rossi",
    role: "Senior Developer",
    department: "IT Development",
    totalObjectives: 12,
    completedObjectives: 8,
    clusters: [
      { name: "Obiettivi Strategici", progress: 75 },
      { name: "Obiettivi Operativi", progress: 60 },
      { name: "Obiettivi di Sviluppo", progress: 85 },
    ],
  });

  const [objectives] = useState<Objective[]>([
    {
      id: "1",
      title: "Migliorare la customer satisfaction del 15%",
      description: "Implementare un nuovo sistema di feedback clienti e ridurre i tempi di risposta.",
      cluster: "Obiettivi Strategici",
      status: "in_corso",
      deadline: "31/12/2025",
      progress: 65,
    },
    {
      id: "2",
      title: "Completare certificazione AWS Solutions Architect",
      description: "Ottenere la certificazione professionale per supportare la migrazione cloud.",
      cluster: "Obiettivi di Sviluppo",
      status: "in_corso",
      deadline: "30/06/2025",
      progress: 80,
    },
    {
      id: "3",
      title: "Ridurre bug in produzione del 30%",
      description: "Implementare test automatizzati e code review più rigorosi.",
      cluster: "Obiettivi Operativi",
      status: "assegnato",
      deadline: "31/08/2025",
      progress: 20,
    },
  ]);

  const [documents] = useState<Document[]>([
    {
      id: "1",
      title: "Regolamento MBO 2025",
      description: "Linee guida e criteri di valutazione",
      type: "regulation",
      date: "01/01/2025",
      requiresAcceptance: true,
      accepted: false,
    },
    {
      id: "2",
      title: "Codice di Condotta Aziendale",
      description: "Norme etiche e comportamentali",
      type: "policy",
      date: "15/01/2025",
      requiresAcceptance: true,
      accepted: true,
    },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={employee.name} userRole={employee.role} notificationCount={3} />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Il Mio Dashboard</h1>
            <p className="text-muted-foreground">
              Benvenuto, {employee.name}. Ecco il tuo progresso MBO.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <EmployeeCard employee={employee} />
            </div>

            <div className="lg:col-span-2">
              <Tabs defaultValue="objectives" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="objectives" data-testid="tab-objectives">
                    I Miei Obiettivi
                  </TabsTrigger>
                  <TabsTrigger value="documents" data-testid="tab-documents">
                    Documenti
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="objectives" className="space-y-4 mt-6">
                  {objectives.map((objective) => (
                    <ObjectiveCard
                      key={objective.id}
                      objective={objective}
                      onStatusChange={(id, status) =>
                        console.log(`Objective ${id} changed to ${status}`)
                      }
                    />
                  ))}
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Regolamento MBO</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Consulta il regolamento completo del sistema MBO aziendale per
                          comprendere i criteri di valutazione e le linee guida.
                        </p>
                        <Link href="/regulation">
                          <Button variant="outline" data-testid="button-view-regulation">
                            <FileText className="mr-2 h-4 w-4" />
                            Visualizza Regolamento
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <DocumentList
                      documents={documents}
                      onAccept={(id) => console.log("Document accepted:", id)}
                      onView={(id) => console.log("View document:", id)}
                      onDownload={(id) => console.log("Download document:", id)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
