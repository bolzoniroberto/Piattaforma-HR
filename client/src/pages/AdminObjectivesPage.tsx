import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ObjectiveClusterCard, { type ObjectiveCluster } from "@/components/ObjectiveClusterCard";
import { Search, Plus, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

export default function AdminObjectivesPage() {
  const { user } = useAuth();

  const { data: clusterData = [] } = useQuery<any[]>({
    queryKey: ["/api/clusters"],
    enabled: !!user,
  });

  const transformedClusters: ObjectiveCluster[] = (clusterData || []).map((cluster: any) => ({
    id: cluster.id,
    name: cluster.name,
    description: cluster.description,
    totalObjectives: 0,
    completedObjectives: 0,
  }));

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader
            userName="Admin User"
            userRole="Amministratore"
            showSidebarTrigger={true}
          />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-semibold mb-2">Gestione Obiettivi</h1>
                  <p className="text-muted-foreground">
                    Gestisci il dizionario MBO e i cluster di obiettivi
                  </p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-objective">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuovo Obiettivo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Crea Nuovo Obiettivo</DialogTitle>
                      <DialogDescription>
                        Inserisci i dettagli del nuovo obiettivo da assegnare
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="objective-title">Titolo</Label>
                        <Input
                          id="objective-title"
                          placeholder="Es. Migliorare la customer satisfaction"
                          data-testid="input-objective-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="objective-description">Descrizione</Label>
                        <Textarea
                          id="objective-description"
                          placeholder="Descrizione dettagliata dell'obiettivo..."
                          rows={4}
                          data-testid="input-objective-description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="objective-cluster">Cluster</Label>
                          <Select>
                            <SelectTrigger id="objective-cluster" data-testid="select-cluster">
                              <SelectValue placeholder="Seleziona cluster" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="strategici">Obiettivi Strategici</SelectItem>
                              <SelectItem value="operativi">Obiettivi Operativi</SelectItem>
                              <SelectItem value="sviluppo">Obiettivi di Sviluppo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="objective-deadline">Scadenza</Label>
                          <Input
                            id="objective-deadline"
                            type="date"
                            data-testid="input-objective-deadline"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="objective-assignee">Assegna a</Label>
                        <Select>
                          <SelectTrigger id="objective-assignee" data-testid="select-assignee">
                            <SelectValue placeholder="Seleziona dipendente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user1">Mario Rossi</SelectItem>
                            <SelectItem value="user2">Laura Bianchi</SelectItem>
                            <SelectItem value="user3">Giovanni Verdi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Annulla
                      </Button>
                      <Button
                        onClick={() => {
                          console.log("Create objective");
                          setIsDialogOpen(false);
                        }}
                        data-testid="button-create"
                      >
                        Crea Obiettivo
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <CardTitle>Cluster di Obiettivi</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca obiettivi..."
                          className="pl-9 w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          data-testid="input-search"
                        />
                      </div>
                      <Button variant="outline" size="icon" data-testid="button-filter">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {transformedClusters.length === 0 ? (
                    <p className="text-center text-muted-foreground">Nessun cluster configurato</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {transformedClusters.map((cluster) => (
                        <ObjectiveClusterCard
                          key={cluster.id}
                          cluster={cluster}
                          onClick={() => console.log("Cluster clicked:", cluster.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Obiettivi Recenti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Migliorare la customer satisfaction del 15%",
                        assignedTo: "Mario Rossi",
                        cluster: "Strategici",
                        status: "in_corso",
                      },
                      {
                        title: "Ridurre i tempi di risposta del supporto",
                        assignedTo: "Laura Bianchi",
                        cluster: "Operativi",
                        status: "assegnato",
                      },
                      {
                        title: "Completare certificazione AWS",
                        assignedTo: "Giovanni Verdi",
                        cluster: "Sviluppo",
                        status: "completato",
                      },
                    ].map((objective, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 p-4 border rounded-md hover-elevate"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">{objective.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            Assegnato a: {objective.assignedTo}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {objective.cluster}
                          </Badge>
                          <Badge
                            variant={
                              objective.status === "completato"
                                ? "default"
                                : objective.status === "in_corso"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {objective.status === "completato"
                              ? "Completato"
                              : objective.status === "in_corso"
                              ? "In Corso"
                              : "Assegnato"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
