import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppHeader from "@/components/AppHeader";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, UserPlus, Eye, Trash2, Power, PowerOff } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { activeSection, setActiveSection } = useRail();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({
    codiceFiscale: "",
    firstName: "",
    lastName: "",
    email: "",
  });
  const limit = 5;

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Paginated query
  const { data: paginatedData, isLoading } = useQuery<{
    data: User[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } | User[]>({
    queryKey: ["/api/users", { page, limit }],
    queryFn: async () => {
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`, {
        credentials: "include",
      });
      return response.json();
    },
    enabled: !!user,
  });

  // All users for stats and filters
  const { data: allUsersForStats = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      return response.json();
    },
    enabled: !!user,
  });

  const allUsers = useMemo(() => {
    if (!paginatedData) return [];
    if ("data" in paginatedData && Array.isArray(paginatedData.data)) {
      return paginatedData.data;
    }
    return paginatedData as User[];
  }, [paginatedData]);

  const pagination = useMemo(() => {
    if (paginatedData && "pagination" in paginatedData) {
      return paginatedData.pagination;
    }
    return null;
  }, [paginatedData]);

  const departments = useMemo(() => {
    const depts = new Set<string>();
    allUsersForStats.forEach((u) => {
      if (u.department) depts.add(u.department);
    });
    return Array.from(depts).sort();
  }, [allUsersForStats]);

  const filteredUsers = useMemo(() => {
    let filtered = allUsers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(query) ||
          u.lastName?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.department?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((u) => u.department === departmentFilter);
    }

    return filtered;
  }, [allUsers, searchQuery, roleFilter, departmentFilter]);

  const stats = useMemo(() => {
    const employees = allUsersForStats.filter((u) => u.role === "employee");
    const admins = allUsersForStats.filter((u) => u.role === "admin");
    return {
      total: allUsersForStats.length,
      employees: employees.length,
      admins: admins.length,
      departments: departments.length,
    };
  }, [allUsersForStats, departments]);

  const quickCreateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users", {
        id: undefined,
        firstName: quickCreateData.firstName,
        lastName: quickCreateData.lastName,
        email: quickCreateData.email,
        codiceFiscale: quickCreateData.codiceFiscale || null,
        role: "employee",
      });
      const newUser = await res.json();
      return newUser;
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Dipendente creato con successo" });
      setIsQuickCreateOpen(false);
      setQuickCreateData({
        codiceFiscale: "",
        firstName: "",
        lastName: "",
        email: "",
      });
      // Redirect to profile page
      navigate(`/admin/users/${newUser.codiceFiscale || newUser.id}`);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile creare il dipendente",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return res.status === 204;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente eliminato con successo" });
      setDeleteUserId(null);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile eliminare l'utente",
        variant: "destructive",
      });
    },
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const u = allUsers.find((user) => user.id === userId);
      if (!u) throw new Error("User not found");
      const res = await apiRequest("PATCH", `/api/users/${userId}`, {
        isActive: !u.isActive,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      const action = data.isActive ? "attivato" : "disattivato";
      toast({ title: `Utente ${action} con successo` });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile cambiare lo stato dell'utente",
        variant: "destructive",
      });
    },
  });

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return (f + l).toUpperCase() || "?";
  };

  const handleQuickCreate = () => {
    if (!quickCreateData.firstName.trim() || !quickCreateData.lastName.trim() || !quickCreateData.email.trim()) {
      toast({
        title: "Errore",
        description: "Nome, cognome ed email sono obbligatori",
        variant: "destructive",
      });
      return;
    }
    quickCreateMutation.mutate();
  };

  return (
    <>
      <AppHeader
        userName={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Amministratore" : "Amministratore"}
        userRole="Amministratore"
        notificationCount={0}
        showSidebarTrigger={true}
        pageTitle="Gestione Utenti"
        pageIcon={Users}
        pageDescription="Visualizza e gestisci tutti gli utenti del sistema MBO"
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
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Totale Utenti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Dipendenti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.employees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Admin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.admins}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Dipartimenti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.departments}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Users List Card */}
              <Card className="md3-surface md3-motion-standard">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="md3-title-large">Elenco Utenti</CardTitle>
                    <CardDescription>Visualizza e gestisci i dipendenti</CardDescription>
                  </div>
                  <Button onClick={() => setIsQuickCreateOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Nuovo Dipendente
                  </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="search" className="text-xs text-muted-foreground mb-2 block">
                        Ricerca
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Nome, email, dipartimento..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="role-filter" className="text-xs text-muted-foreground mb-2 block">
                        Ruolo
                      </Label>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger id="role-filter" className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti i ruoli</SelectItem>
                          <SelectItem value="employee">Dipendente</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dept-filter" className="text-xs text-muted-foreground mb-2 block">
                        Dipartimento
                      </Label>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger id="dept-filter" className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Users Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utente</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Ruolo</TableHead>
                        <TableHead>Dipartimento</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Caricamento...
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nessun utente trovato
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={u.profileImageUrl || undefined} />
                                  <AvatarFallback>{getInitials(u.firstName, u.lastName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {u.firstName} {u.lastName}
                                  </span>
                                  {u.codiceFiscale && <span className="text-xs text-muted-foreground">{u.codiceFiscale}</span>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role === "admin" ? "Admin" : "Dipendente"}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{u.department || "-"}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleUserActiveMutation.mutate(u.id)}
                                disabled={toggleUserActiveMutation.isPending}
                              >
                                {u.isActive ? (
                                  <Power className="h-4 w-4 text-green-600" />
                                ) : (
                                  <PowerOff className="h-4 w-4 text-red-600" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Link href={`/admin/users/${u.codiceFiscale || u.id}`}>
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteUserId(u.id)}
                                disabled={deleteUserMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                          >
                            Precedente
                          </Button>
                        </PaginationItem>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === page}
                              onClick={() => setPage(p)}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                            disabled={page === pagination.totalPages}
                          >
                            Prossima
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Quick Create Dialog */}
      <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Dipendente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="qc-cf">Codice Fiscale *</Label>
              <Input
                id="qc-cf"
                value={quickCreateData.codiceFiscale}
                onChange={(e) => setQuickCreateData({ ...quickCreateData, codiceFiscale: e.target.value })}
                placeholder="Es: BNCRSS80A01F205O"
              />
            </div>
            <div>
              <Label htmlFor="qc-name">Nome *</Label>
              <Input
                id="qc-name"
                value={quickCreateData.firstName}
                onChange={(e) => setQuickCreateData({ ...quickCreateData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="qc-surname">Cognome *</Label>
              <Input
                id="qc-surname"
                value={quickCreateData.lastName}
                onChange={(e) => setQuickCreateData({ ...quickCreateData, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="qc-email">Email *</Label>
              <Input
                id="qc-email"
                type="email"
                value={quickCreateData.email}
                onChange={(e) => setQuickCreateData({ ...quickCreateData, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickCreateOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleQuickCreate} disabled={quickCreateMutation.isPending}>
              {quickCreateMutation.isPending ? "Creazione..." : "Crea e continua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Utente</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo utente? L'azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteUserId) deleteUserMutation.mutate(deleteUserId);
              }}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Actions Panel */}
      {/* AppActionsPanel is managed by RailContext */}
    </>
  );
}
