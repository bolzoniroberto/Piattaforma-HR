import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, UserPlus, Target, Building, ChevronRight, Trash2, Edit2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    ral: "",
    mboPercentage: "25",
    role: "employee" as "employee" | "admin",
  });

  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const departments = useMemo(() => {
    const depts = new Set<string>();
    allUsers.forEach((u) => {
      if (u.department) depts.add(u.department);
    });
    return Array.from(depts).sort();
  }, [allUsers]);

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
    const employees = allUsers.filter((u) => u.role === "employee");
    const admins = allUsers.filter((u) => u.role === "admin");
    return {
      total: allUsers.length,
      employees: employees.length,
      admins: admins.length,
      departments: departments.length,
    };
  }, [allUsers, departments]);

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users", {
        id: undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        department: formData.department,
        ral: formData.ral ? parseFloat(formData.ral) : null,
        mboPercentage: parseInt(formData.mboPercentage),
        role: formData.role,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente creato con successo" });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile creare l'utente",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) throw new Error("No user selected");
      const res = await apiRequest("PATCH", `/api/users/${editingUser.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        department: formData.department,
        ral: formData.ral ? parseFloat(formData.ral) : null,
        mboPercentage: parseInt(formData.mboPercentage),
        role: formData.role,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente aggiornato con successo" });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare l'utente",
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

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      ral: "",
      mboPercentage: "25",
      role: "employee",
    });
    setEditingUser(null);
  };

  const handleAddUser = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      department: u.department || "",
      ral: u.ral ? u.ral.toString() : "",
      mboPercentage: u.mboPercentage?.toString() || "25",
      role: (u.role as "employee" | "admin") || "employee",
    });
    setOpenDialog(true);
  };

  const handleSaveUser = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast({
        title: "Errore",
        description: "Nome, cognome ed email sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate();
    } else {
      createUserMutation.mutate();
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return (f + l).toUpperCase() || "?";
  };

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader
            userName={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Admin"}
            userRole="Amministratore"
            showSidebarTrigger={true}
          />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-semibold mb-2">Gestione Utenti</h1>
                  <p className="text-muted-foreground">
                    Visualizza e gestisci tutti gli utenti del sistema MBO
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-users">
                      {stats.total}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Registrati nel sistema</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dipendenti</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-employees">
                      {stats.employees}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Utenti con ruolo employee</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Amministratori</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-admins">
                      {stats.admins}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Utenti con ruolo admin</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dipartimenti</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-departments">
                      {stats.departments}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Aree aziendali</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle>Elenco Utenti</CardTitle>
                      <CardDescription>
                        Gestisci tutti gli utenti del sistema
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca utenti..."
                          className="pl-9 w-56"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          data-testid="input-search-users"
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[140px]" data-testid="select-role-filter">
                          <SelectValue placeholder="Ruolo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti i ruoli</SelectItem>
                          <SelectItem value="employee">Dipendente</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[160px]" data-testid="select-department-filter">
                          <SelectValue placeholder="Dipartimento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti i dipartimenti</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={handleAddUser} data-testid="button-add-user">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Aggiungi Utente
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-user-form">
                          <DialogHeader>
                            <DialogTitle>
                              {editingUser ? "Modifica Utente" : "Aggiungi Nuovo Utente"}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="firstName">Nome</Label>
                              <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                data-testid="input-first-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName">Cognome</Label>
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                data-testid="input-last-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                data-testid="input-email"
                              />
                            </div>
                            <div>
                              <Label htmlFor="department">Dipartimento</Label>
                              <Input
                                id="department"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                data-testid="input-department"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ral">RAL (€)</Label>
                              <Input
                                id="ral"
                                type="number"
                                value={formData.ral}
                                onChange={(e) => setFormData({ ...formData, ral: e.target.value })}
                                data-testid="input-ral"
                              />
                            </div>
                            <div>
                              <Label htmlFor="mboPercentage">MBO % (multiplo di 5)</Label>
                              <Input
                                id="mboPercentage"
                                type="number"
                                min="0"
                                max="100"
                                step="5"
                                value={formData.mboPercentage}
                                onChange={(e) => setFormData({ ...formData, mboPercentage: e.target.value })}
                                data-testid="input-mbo-percentage"
                              />
                            </div>
                            <div>
                              <Label htmlFor="role">Ruolo</Label>
                              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as "employee" | "admin" })}>
                                <SelectTrigger id="role" data-testid="select-role">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="employee">Dipendente</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              onClick={handleSaveUser}
                              disabled={createUserMutation.isPending || updateUserMutation.isPending}
                              data-testid="button-save-user"
                              className="w-full"
                            >
                              {createUserMutation.isPending || updateUserMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nessun utente trovato
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utente</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Dipartimento</TableHead>
                          <TableHead>Ruolo</TableHead>
                          <TableHead>RAL</TableHead>
                          <TableHead>MBO %</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  {u.profileImageUrl && (
                                    <AvatarImage src={u.profileImageUrl} alt={u.firstName || ""} />
                                  )}
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {getInitials(u.firstName, u.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {u.firstName} {u.lastName}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {u.email || "-"}
                            </TableCell>
                            <TableCell>
                              {u.department ? (
                                <Badge variant="outline">{u.department}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                {u.role === "admin" ? "Admin" : "Dipendente"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {u.ral ? `€${Number(u.ral).toLocaleString()}` : "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {u.mboPercentage ? `${u.mboPercentage}%` : "-"}
                            </TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditUser(u)}
                                data-testid={`button-edit-user-${u.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setDeleteUserId(u.id)}
                                data-testid={`button-delete-user-${u.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                              <Link href={`/admin/assignments/${u.id}`}>
                                <Button variant="ghost" size="sm" data-testid={`button-assign-${u.id}`}>
                                  Assegna
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>

      <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare l'utente?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. L'utente sarà eliminato definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
