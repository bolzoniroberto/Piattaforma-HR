import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppActionsPanel from "@/components/AppActionsPanel";
import AppHeader from "@/components/AppHeader";
import OrgChart from "@/components/OrgChart";
import { useRail } from "@/contexts/RailContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Network, Search, Users, Edit2, Save, X } from "lucide-react";
import type { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function OrgChartPage() {
  const { user } = useAuth();
  const { isRailOpen, activeSection, setActiveSection, isPanelOpen, setIsPanelOpen, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch orgchart users (hybrid access)
  const { data, isLoading } = useQuery<{
    users: User[];
    metadata: {
      isFiltered: boolean;
      totalVisible: number;
      viewerRole: string;
    }
  }>({
    queryKey: ["/api/orgchart"],
  });

  const users = data?.users || [];
  const isFilteredView = data?.metadata.isFiltered || false;
  const isAdmin = user?.role === "admin";
  const { toast } = useToast();

  // Fetch business functions for department selection
  const { data: businessFunctions = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/business-functions"],
    enabled: isAdmin,
  });

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

  const handleUserClick = (clickedUser: User) => {
    if (editMode && isAdmin) {
      setEditingUser(clickedUser);
    } else {
      setSelectedUser(clickedUser);
    }
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
  };

  const handleCloseEditDialog = () => {
    setEditingUser(null);
  };

  // Check if a user is a descendant (direct or indirect report) of another user
  const isDescendant = (potentialDescendantId: string, ancestorId: string): boolean => {
    // Find all direct reports of the ancestor
    const directReports = users.filter(u => u.managerId === ancestorId);

    // Check if potentialDescendant is a direct report
    if (directReports.some(u => u.id === potentialDescendantId)) {
      return true;
    }

    // Recursively check all descendants
    for (const report of directReports) {
      if (isDescendant(potentialDescendantId, report.id)) {
        return true;
      }
    }

    return false;
  };

  // Mutation for updating user
  const updateUserMutation = useMutation({
    mutationFn: async (data: { userId: string; department?: string; managerId?: string | null }) => {
      const res = await apiRequest("PATCH", `/api/users/${data.userId}`, {
        department: data.department,
        managerId: data.managerId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgchart"] });
      toast({ title: "Utente aggiornato con successo" });
      handleCloseEditDialog();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare l'utente",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const name = `${firstName || ""} ${lastName || ""}`.trim();
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <AppHeader
        userName={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Utente"}
        userRole={user?.role === "admin" ? "Amministratore" : "Dipendente"}
        notificationCount={0}
        showSidebarTrigger={true}
        pageTitle="Organigramma Aziendale"
        pageIcon={Network}
        pageDescription="Visualizza la struttura organizzativa e la gerarchia dell'azienda"
        pageBadge={isFilteredView ? (
          <Badge variant="outline" className="text-xs">
            Vista limitata al tuo team
          </Badge>
        ) : undefined}
      />
      <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
        <div className="relative max-w-[1800px] mx-auto">
          {/* Sidebar Level 1 - Navigation Rail */}
          <div className={`absolute left-0 top-0 transition-opacity duration-200 ${isRailOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <AppRail
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
              isOpen={true}
            />
          </div>

          {/* Sidebar Level 2 - Contextual Panel */}
          <div className={`absolute left-[84px] top-0 transition-opacity duration-200 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <AppPanel
              activeSection={activeSection}
              isOpen={true}
              onClose={handlePanelClose}
            />
          </div>

          {/* Main Content - Dynamic margin */}
          <main className={`ml-[348px] ${isActionsPanelOpen ? 'mr-[264px]' : 'mr-0'} transition-[margin] duration-200 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]`} style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Organization Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Struttura Organizzativa
                  </CardTitle>
                  <CardDescription>
                    Clicca sulle card per espandere e visualizzare i collaboratori diretti
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Caricamento organigramma...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? "Nessun risultato trovato per la ricerca"
                          : "Nessun utente disponibile"}
                      </p>
                    </div>
                  ) : (
                    <OrgChart
                      users={filteredUsers}
                      selectedUserId={selectedUserId}
                      onUserSelect={setSelectedUserId}
                      onUserClick={handleUserClick}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </main>

          {/* Sidebar Level 3 - Actions Panel (destra) */}
          <div className={`absolute right-0 top-0 transition-opacity duration-200 ${isActionsPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <AppActionsPanel isOpen={true} onClose={() => setIsActionsPanelOpen(false)} title="Azioni Organigramma">
              {/* Search Section */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Cerca Persone</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, email, reparto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {searchQuery && (
                  <p className="text-xs text-muted-foreground">
                    {filteredUsers.length} {filteredUsers.length === 1 ? "risultato" : "risultati"}
                  </p>
                )}
              </div>

              {/* Divider */}
              {isAdmin && <div className="border-t my-4" />}

              {/* Edit Mode Toggle (solo admin) */}
              {isAdmin && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Modalità Modifica</Label>
                  <Button
                    variant={editMode ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? (
                      <>
                        <Save className="h-4 w-4" />
                        Esci da Modifica
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-4 w-4" />
                        Abilita Modifica
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {editMode
                      ? "Clicca su un utente per modificarlo"
                      : "Attiva per gestire la struttura"}
                  </p>
                </div>
              )}
            </AppActionsPanel>
          </div>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{`${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim()}</DialogTitle>
                    <DialogDescription>
                      {selectedUser.department || "Dipartimento non specificato"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {selectedUser.role === "admin" && (
                  <div>
                    <Badge variant="default">Amministratore</Badge>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Email:</span>
                    <span className="col-span-2">{selectedUser.email}</span>
                  </div>

                  {selectedUser.department && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">Reparto:</span>
                      <span className="col-span-2">{selectedUser.department}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Stato:</span>
                    <span className="col-span-2">
                      <Badge variant={selectedUser.isActive ? "default" : "outline"}>
                        {selectedUser.isActive ? "Attivo" : "Non attivo"}
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog (Admin Only) */}
      <Dialog open={editingUser !== null} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-md">
          {editingUser && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                      {getInitials(editingUser.firstName, editingUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">Modifica Utente</DialogTitle>
                    <DialogDescription>
                      {`${editingUser.firstName || ""} ${editingUser.lastName || ""}`.trim()}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Department Selection */}
                <div className="space-y-2">
                  <Label htmlFor="department">Dipartimento</Label>
                  <Select
                    value={editingUser.department || ""}
                    onValueChange={(value) => {
                      setEditingUser({ ...editingUser, department: value });
                    }}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Seleziona dipartimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessFunctions.map((bf) => (
                        <SelectItem key={bf.id} value={bf.name}>
                          {bf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Manager Selection */}
                <div className="space-y-2">
                  <Label htmlFor="manager">Superiore Diretto</Label>
                  <Select
                    value={editingUser.managerId || "none"}
                    onValueChange={(value) => {
                      setEditingUser({
                        ...editingUser,
                        managerId: value === "none" ? null : value,
                      });
                    }}
                  >
                    <SelectTrigger id="manager">
                      <SelectValue placeholder="Seleziona superiore" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno (Top Level)</SelectItem>
                      {users
                        .filter((u) => u.id !== editingUser.id)
                        .map((u) => {
                          const isSubordinate = isDescendant(u.id, editingUser.id);
                          return (
                            <SelectItem
                              key={u.id}
                              value={u.id}
                              disabled={isSubordinate}
                            >
                              {`${u.firstName || ""} ${u.lastName || ""}`.trim()} - {u.department || "N/A"}
                              {isSubordinate && " ⚠️ (Collaboratore di questo utente)"}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Non puoi selezionare collaboratori diretti o indiretti come superiore
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      // Validate: check if the new manager would create a recursive hierarchy
                      if (editingUser.managerId && editingUser.managerId !== "none") {
                        // Check if the selected manager is a descendant of this user
                        if (isDescendant(editingUser.managerId, editingUser.id)) {
                          const managerName = users.find(u => u.id === editingUser.managerId);
                          const managerFullName = managerName
                            ? `${managerName.firstName || ""} ${managerName.lastName || ""}`.trim()
                            : "questo utente";

                          toast({
                            title: "Gerarchia Ricorsiva Non Permessa",
                            description: `Non puoi assegnare ${managerFullName} come superiore perché è già un collaboratore (diretto o indiretto) di ${editingUser.firstName || ""} ${editingUser.lastName || ""}. Questo creerebbe una gerarchia circolare.`,
                            variant: "destructive",
                          });
                          return;
                        }
                      }

                      updateUserMutation.mutate({
                        userId: editingUser.id,
                        department: editingUser.department || undefined,
                        managerId: editingUser.managerId,
                      });
                    }}
                    disabled={updateUserMutation.isPending}
                    className="flex-1 gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateUserMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCloseEditDialog}
                    disabled={updateUserMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
