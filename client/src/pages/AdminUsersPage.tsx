import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import AppActionsPanel from "@/components/AppActionsPanel";
import AppHeader from "@/components/AppHeader";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, UserPlus, Target, Building, Trash2, Edit2, Power, PowerOff, ChevronRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
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
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, CustomFieldDefinition, CustomFieldValue } from "@shared/schema";
import CustomFieldInput from "@/components/CustomFieldInput";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection, isPanelOpen, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 5; // Ridotto a 5 per testare la paginazione con dataset piccoli

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    codiceFiscale: "",
    department: "",
    cdc: "",
    managerId: "",
    ral: "",
    mboPercentage: "25",
    role: "employee" as "employee" | "admin",
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Paginated query with fallback
  const { data: paginatedData, isLoading } = useQuery<{ data: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | User[]>({
    queryKey: ["/api/users", { page, limit }],
    queryFn: async () => {
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user,
  });

  // Separate query for all users (for statistics)
  const { data: allUsersForStats = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch(`/api/users`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user,
  });

  // Handle both paginated and non-paginated responses
  const allUsers = useMemo(() => {
    if (!paginatedData) return [];
    // Check if it's paginated response
    if ('data' in paginatedData && Array.isArray(paginatedData.data)) {
      return paginatedData.data;
    }
    // Fallback for non-paginated (array response)
    return paginatedData as User[];
  }, [paginatedData]);

  const pagination = useMemo(() => {
    if (paginatedData && 'pagination' in paginatedData) {
      return paginatedData.pagination;
    }
    return null;
  }, [paginatedData]);

  const { data: businessFunctions = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/business-functions"],
    enabled: !!user,
  });

  // Fetch custom field definitions
  const { data: customFields = [] } = useQuery<CustomFieldDefinition[]>({
    queryKey: ["/api/custom-fields"],
    enabled: !!user,
  });

  // Fetch user's custom field values when editing
  const { data: userCustomFieldValues = [] } = useQuery<Array<CustomFieldValue & { field: CustomFieldDefinition }>>({
    queryKey: [`/api/users/${editingUser?.id}/custom-field-values`],
    enabled: !!editingUser && editingUser.id !== "new",
    onSuccess: (data) => {
      const values: Record<string, string> = {};
      data.forEach((item) => {
        values[item.fieldId] = item.value || "";
      });
      setCustomFieldValues(values);
    },
  });

  const departments = useMemo(() => {
    // Get departments from business functions first, then from existing users
    const depts = new Set<string>();
    businessFunctions.forEach((bf) => {
      if (bf.name) depts.add(bf.name);
    });
    allUsersForStats.forEach((u) => {
      if (u.department) depts.add(u.department);
    });
    return Array.from(depts).sort();
  }, [allUsersForStats, businessFunctions]);

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

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users", {
        id: undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        codiceFiscale: formData.codiceFiscale || null,
        department: formData.department,
        cdc: formData.cdc || null,
        ral: formData.ral ? parseFloat(formData.ral) : null,
        mboPercentage: parseInt(formData.mboPercentage),
        role: formData.role,
      });
      const newUser = await res.json();

      // Save custom field values if any
      if (Object.keys(customFieldValues).length > 0) {
        const values = Object.entries(customFieldValues).map(([fieldId, value]) => ({
          fieldId,
          value,
        }));
        await apiRequest("POST", `/api/users/${newUser.id}/custom-field-values/bulk`, { values });
      }

      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente creato con successo" });
      setIsCreatingNew(false);
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
        codiceFiscale: formData.codiceFiscale || null,
        department: formData.department,
        cdc: formData.cdc || null,
        ral: formData.ral ? parseFloat(formData.ral) : null,
        mboPercentage: parseInt(formData.mboPercentage),
        role: formData.role,
      });
      const updatedUser = await res.json();

      // Update custom field values if any
      const values = Object.entries(customFieldValues).map(([fieldId, value]) => ({
        fieldId,
        value,
      }));
      await apiRequest("POST", `/api/users/${editingUser.id}/custom-field-values/bulk`, { values });

      return updatedUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente aggiornato con successo" });
      setEditingUser(null);
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

  const toggleUserActiveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const user = allUsers.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      const res = await apiRequest("PATCH", `/api/users/${userId}`, {
        isActive: !user.isActive,
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

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      codiceFiscale: "",
      department: "",
      cdc: "",
      managerId: "",
      ral: "",
      mboPercentage: "25",
      role: "employee",
    });
    setCustomFieldValues({});
    setEditingUser(null);
  };

  const handleAddUser = () => {
    resetForm();
    setIsCreatingNew(true);
    setEditingUser(null);
  };

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setIsCreatingNew(false);
    setFormData({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      codiceFiscale: u.codiceFiscale || "",
      department: u.department || "",
      cdc: u.cdc || "",
      managerId: u.managerId || "",
      ral: u.ral ? u.ral.toString() : "",
      mboPercentage: u.mboPercentage?.toString() || "25",
      role: (u.role as "employee" | "admin") || "employee",
    });
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditingUser(null);
    setIsCreatingNew(false);
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

  return (
    <>
      <AppHeader
        userName={user?.name || "Amministratore"}
        userRole="Amministratore"
        notificationCount={0}
        showSidebarTrigger={true}
        pageTitle="Gestione Utenti"
        pageIcon={Users}
        pageDescription="Visualizza e gestisci tutti gli utenti del sistema MBO"
      />
      <div className="min-h-[calc(100vh-4rem)] bg-background pl-2 pr-6 py-6">
        <div className="flex gap-6 max-w-[1800px] mx-auto">
          {/* SIDEBAR CONTAINER - Fixed 312px width, always reserved */}
          <div className="w-[312px] shrink-0 flex gap-3">
            <AppRail
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
            <AppPanel
              activeSection={activeSection}
              className="transition-opacity duration-200"
            />
          </div>

          {/* Main Content - flex-1 grows naturally, NO margin transitions */}
          <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
          <div className="max-w-7xl mx-auto space-y-6">
              <Card className="md3-surface md3-motion-standard">
                <CardHeader className="pb-4">
                  <div>
                    <CardTitle className="md3-title-large">Elenco Utenti</CardTitle>
                  </div>
                </CardHeader>
                
                {/* In-page form for creating/editing user */}
                {(isCreatingNew || editingUser) && (
                  <Card className="mb-6 border-primary/30">
                    <CardHeader>
                      <CardTitle>
                        {editingUser ? "Modifica Utente" : "Aggiungi Nuovo Utente"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                          <Input
                            id="codiceFiscale"
                            value={formData.codiceFiscale}
                            onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value })}
                            placeholder="Es: BNCRSS80A01F205O"
                            data-testid="input-codice-fiscale"
                          />
                        </div>
                        <div>
                          <Label htmlFor="department">Dipartimento</Label>
                          <Select 
                            value={formData.department} 
                            onValueChange={(value) => setFormData({ ...formData, department: value })}
                          >
                            <SelectTrigger id="department" data-testid="select-department">
                              <SelectValue placeholder="Seleziona dipartimento" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="cdc">CDC (Centro di Costo)</Label>
                          <Input
                            id="cdc"
                            value={formData.cdc}
                            onChange={(e) => setFormData({ ...formData, cdc: e.target.value })}
                            placeholder="Es: CDC001"
                            data-testid="input-cdc"
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

                        {/* Custom Fields Section */}
                        {customFields.length > 0 && (
                          <>
                            <div className="md:col-span-2">
                              <Separator className="my-4" />
                              <h3 className="text-sm font-semibold mb-4">Informazioni Aggiuntive</h3>
                            </div>
                            {customFields
                              .filter((field) => field.isActive)
                              .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                              .map((field) => (
                                <div key={field.id}>
                                  <CustomFieldInput
                                    field={field}
                                    value={customFieldValues[field.id] || ""}
                                    onChange={(value) =>
                                      setCustomFieldValues((prev) => ({ ...prev, [field.id]: value }))
                                    }
                                  />
                                </div>
                              ))}
                          </>
                        )}
                      </div>
                      <div className="flex gap-3 mt-6">
                        <Button
                          onClick={handleSaveUser}
                          disabled={createUserMutation.isPending || updateUserMutation.isPending}
                          data-testid="button-save-user"
                        >
                          {createUserMutation.isPending || updateUserMutation.isPending ? "Salvataggio..." : "Salva"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          data-testid="button-cancel-edit"
                        >
                          Annulla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nessun utente trovato
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utente</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Dipartimento</TableHead>
                          <TableHead>Ruolo</TableHead>
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
                              <div className="flex items-center gap-2">
                                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                  {u.role === "admin" ? "Admin" : "Dipendente"}
                                </Badge>
                                {!u.isActive && (
                                  <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                                    Disattivato
                                  </Badge>
                                )}
                              </div>
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
                                onClick={() => toggleUserActiveMutation.mutate(u.id)}
                                disabled={toggleUserActiveMutation.isPending}
                                title={u.isActive ? "Disattiva" : "Attiva"}
                                data-testid={`button-toggle-user-${u.id}`}
                              >
                                {u.isActive ? (
                                  <Power className="h-4 w-4 text-amber-600" />
                                ) : (
                                  <PowerOff className="h-4 w-4 text-gray-400" />
                                )}
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
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination && (
                    <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {((page - 1) * limit) + 1}-{Math.min(page * limit, pagination.total)} di {pagination.total} utenti
                      </div>

                      {pagination.totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setPage(p => Math.max(1, p - 1))}
                              className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>

                          {/* First page */}
                          {page > 2 && (
                            <>
                              <PaginationItem>
                                <PaginationLink onClick={() => setPage(1)} className="cursor-pointer">
                                  1
                                </PaginationLink>
                              </PaginationItem>
                              {page > 3 && <PaginationEllipsis />}
                            </>
                          )}

                          {/* Previous page */}
                          {page > 1 && (
                            <PaginationItem>
                              <PaginationLink onClick={() => setPage(page - 1)} className="cursor-pointer">
                                {page - 1}
                              </PaginationLink>
                            </PaginationItem>
                          )}

                          {/* Current page */}
                          <PaginationItem>
                            <PaginationLink isActive className="cursor-default">
                              {page}
                            </PaginationLink>
                          </PaginationItem>

                          {/* Next page */}
                          {page < pagination.totalPages && (
                            <PaginationItem>
                              <PaginationLink onClick={() => setPage(page + 1)} className="cursor-pointer">
                                {page + 1}
                              </PaginationLink>
                            </PaginationItem>
                          )}

                          {/* Last page */}
                          {page < pagination.totalPages - 1 && (
                            <>
                              {page < pagination.totalPages - 2 && <PaginationEllipsis />}
                              <PaginationItem>
                                <PaginationLink onClick={() => setPage(pagination.totalPages)} className="cursor-pointer">
                                  {pagination.totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            </>
                          )}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                              className={page >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      )}

                      <div className="text-sm text-muted-foreground">
                        Pagina {page} di {pagination.totalPages}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </main>

          {/* Sidebar Level 3 - Actions Panel (destra) */}
          {isActionsPanelOpen && (
            <AppActionsPanel isOpen={isActionsPanelOpen} onClose={() => setIsActionsPanelOpen(false)} title="Gestione Utenti">
              {/* Nuovo Utente */}
              <Button className="w-full gap-2" onClick={handleAddUser} data-testid="button-add-user-sidebar">
                <UserPlus className="h-4 w-4" />
                Nuovo Utente
              </Button>

              <div className="border-t my-4" />

              {/* Filtri */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">Cerca</Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-users-sidebar"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Ruolo</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="mt-1.5" data-testid="select-role-filter-sidebar">
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
                  <Label className="text-xs font-medium">Dipartimento</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="mt-1.5" data-testid="select-department-filter-sidebar">
                      <SelectValue />
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
                </div>
              </div>

              <div className="border-t my-4" />

              {/* Statistiche */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Statistiche</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-center" data-testid="stat-total-users">
                    <div className="text-lg font-bold text-primary">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Utenti Totali</div>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10 text-center" data-testid="stat-employees">
                    <div className="text-lg font-bold text-primary">{stats.employees}</div>
                    <div className="text-xs text-muted-foreground">Dipendenti</div>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10 text-center" data-testid="stat-admins">
                    <div className="text-lg font-bold text-primary">{stats.admins}</div>
                    <div className="text-xs text-muted-foreground">Amministratori</div>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10 text-center" data-testid="stat-departments">
                    <div className="text-lg font-bold text-primary">{stats.departments}</div>
                    <div className="text-xs text-muted-foreground">Dipartimenti</div>
                  </div>
                </div>
              </div>

              <div className="border-t my-4" />

              {/* Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Totale: <span className="font-medium text-foreground">{stats.total}</span> utenti</p>
                {pagination && (
                  <p>Pagina <span className="font-medium text-foreground">{page}</span> di <span className="font-medium text-foreground">{pagination.totalPages}</span></p>
                )}
              </div>
            </AppActionsPanel>
          )}
      </div>
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
    </>
  );
}
