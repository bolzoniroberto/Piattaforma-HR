import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRail } from "@/contexts/RailContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { User } from "@shared/schema";

interface ObjectiveDictionary {
  id: string;
  title: string;
  description: string;
  indicatorClusterId: string;
  calculationTypeId: string;
  indicatorCluster?: {
    id: string;
    name: string;
  };
  calculationType?: {
    id: string;
    name: string;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isRailOpen, activeSection, setActiveSection, isPanelOpen, setIsPanelOpen } = useRail();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const { data: objectivesDictionary = [] } = useQuery<ObjectiveDictionary[]>({
    queryKey: ["/api/objectives-dictionary"],
    enabled: !!user,
  });

  const updateObjectiveMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string }) => {
      const res = await apiRequest("PATCH", `/api/objectives-dictionary/${data.id}`, {
        title: data.title,
        description: data.description,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-dictionary"] });
      toast({ title: "Obiettivo aggiornato con successo" });
      setEditingId(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare l'obiettivo",
        variant: "destructive",
      });
    },
  });

  const handleEditStart = (objective: ObjectiveDictionary) => {
    setEditingId(objective.id);
    setEditFormData({
      title: objective.title,
      description: objective.description,
    });
  };

  const handleEditSave = () => {
    if (editingId && editFormData.title.trim()) {
      updateObjectiveMutation.mutate({
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

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      // Toggle off if clicking same section
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

  return (
    <>
      <AppHeader
        userName={user?.name || "Amministratore"}
        userRole="Amministratore"
        notificationCount={0}
        showSidebarTrigger={true}
      />
      <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
        <div className="flex gap-6 max-w-[1800px] mx-auto">
          {/* Sidebar Level 1 - Navigation Rail */}
          <AppRail
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            isOpen={isRailOpen}
          />

          {/* Sidebar Level 2 - Contextual Panel */}
          <AppPanel
            activeSection={activeSection}
            isOpen={isPanelOpen}
            onClose={handlePanelClose}
          />

          {/* Main Content */}
          <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="md3-headline-medium mb-2 flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                  </div>
                  Dashboard
                </h1>
                <p className="md3-body-large text-muted-foreground">
                  Gestione dipendenti e obiettivi
                </p>
              </div>

              <Tabs defaultValue="employees" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="employees" data-testid="tab-employees">
                    <Users className="mr-2 h-4 w-4" />
                    Dipendenti
                  </TabsTrigger>
                  <TabsTrigger value="objectives" data-testid="tab-objectives">
                    <Target className="mr-2 h-4 w-4" />
                    Obiettivi
                  </TabsTrigger>
                </TabsList>

                {/* Tab Dipendenti */}
                <TabsContent value="employees" className="space-y-4">
                  <Card className="md3-surface md3-motion-standard">
                    <CardHeader>
                      <CardTitle className="md3-title-large">Dipendenti Eligibili ({allUsers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {allUsers.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            Nessun dipendente disponibile
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {allUsers.map((emp) => (
                              <Card key={emp.id} className="p-4 md3-elevated md3-motion-standard">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base" data-testid={`text-employee-name-${emp.id}`}>
                                      {emp.firstName} {emp.lastName}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                                      <div>
                                        <span className="font-medium">Email:</span> {emp.email}
                                      </div>
                                      <div>
                                        <span className="font-medium">Dipartimento:</span>{" "}
                                        {emp.department || "N/A"}
                                      </div>
                                      {emp.ral && (
                                        <div>
                                          <span className="font-medium">RAL:</span> €
                                          {Number(emp.ral).toLocaleString("it-IT")}
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-medium">MBO %:</span> {emp.mboPercentage}%
                                      </div>
                                    </div>
                                  </div>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        data-testid={`button-view-assignments-${emp.id}`}
                                      >
                                        Assegna
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Assegna obiettivi a {emp.firstName} {emp.lastName}
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="text-sm text-muted-foreground">
                                        <p>Usa il menu "Assegnazione Obiettivi" nella sidebar per gestire le assegnazioni.</p>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab Obiettivi */}
                <TabsContent value="objectives" className="space-y-4">
                  <Card className="md3-surface md3-motion-standard">
                    <CardHeader>
                      <CardTitle className="md3-title-large">Obiettivi Disponibili ({objectivesDictionary.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {objectivesDictionary.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            Nessun obiettivo disponibile
                          </p>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {objectivesDictionary.map((obj) => (
                              <Card
                                key={obj.id}
                                className="p-4 md3-elevated md3-motion-standard flex flex-col"
                                data-testid={`card-objective-${obj.id}`}
                              >
                                {editingId === obj.id ? (
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor={`title-${obj.id}`}>Titolo</Label>
                                      <Input
                                        id={`title-${obj.id}`}
                                        value={editFormData.title}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, title: e.target.value })
                                        }
                                        data-testid={`input-objective-title-${obj.id}`}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`description-${obj.id}`}>Descrizione</Label>
                                      <Textarea
                                        id={`description-${obj.id}`}
                                        value={editFormData.description}
                                        onChange={(e) =>
                                          setEditFormData({ ...editFormData, description: e.target.value })
                                        }
                                        data-testid={`input-objective-description-${obj.id}`}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={handleEditSave}
                                        disabled={updateObjectiveMutation.isPending}
                                        data-testid={`button-save-objective-${obj.id}`}
                                      >
                                        Salva
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleEditCancel}
                                        data-testid={`button-cancel-objective-${obj.id}`}
                                      >
                                        Annulla
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-sm mb-2" data-testid={`text-objective-title-${obj.id}`}>
                                        {obj.title}
                                      </h3>
                                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                        {obj.description}
                                      </p>
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        {obj.indicatorCluster && (
                                          <div className="inline-block bg-secondary px-2 py-1 rounded text-xs">
                                            {obj.indicatorCluster.name}
                                          </div>
                                        )}
                                        {obj.calculationType && (
                                          <div className="inline-block bg-secondary px-2 py-1 rounded text-xs">
                                            {obj.calculationType.name}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditStart(obj)}
                                      data-testid={`button-edit-objective-${obj.id}`}
                                    >
                                      Modifica
                                    </Button>
                                  </>
                                )}
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
