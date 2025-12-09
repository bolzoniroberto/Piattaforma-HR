import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppHeader from "@/components/AppHeader";
import OrgChart from "@/components/OrgChart";
import { useRail } from "@/contexts/RailContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Network, Search, Users } from "lucide-react";
import type { User } from "@shared/schema";
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
  const { isRailOpen, activeSection, setActiveSection, isPanelOpen, setIsPanelOpen } = useRail();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

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
    setSelectedUser(clickedUser);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
  };

  // Filter users based on search
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getInitials = (firstName?: string, lastName?: string) => {
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

          {/* Main Content - Fixed margin */}
          <main className="ml-[348px] bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Search Bar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Search className="h-5 w-5" />
                    Cerca Persone
                  </CardTitle>
                  <CardDescription>
                    Filtra l'organigramma per nome, email, reparto o ruolo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca per nome, email, reparto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searchQuery && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {filteredUsers.length} {filteredUsers.length === 1 ? "risultato" : "risultati"} trovati
                    </p>
                  )}
                </CardContent>
              </Card>

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

                  {selectedUser.location && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">Sede:</span>
                      <span className="col-span-2">{selectedUser.location}</span>
                    </div>
                  )}

                  {selectedUser.businessFunction && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">Funzione:</span>
                      <span className="col-span-2">{selectedUser.businessFunction}</span>
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
    </>
  );
}
