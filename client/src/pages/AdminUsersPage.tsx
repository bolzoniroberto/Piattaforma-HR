import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Search, Users, UserPlus, Target, Building, ChevronRight } from "lucide-react";
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
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

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
                      <CardTitle>Elenco Utenti Eligibili</CardTitle>
                      <CardDescription>
                        Tutti gli utenti a cui possono essere assegnati obiettivi
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
                            <TableCell className="text-right">
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
    </SidebarProvider>
  );
}
