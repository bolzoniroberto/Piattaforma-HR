import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
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
import type { User } from "@shared/schema";

export default function AdminReportingPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const style = {
    "--sidebar-width": "16rem",
  };

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

    if (departmentFilter !== "all") {
      filtered = filtered.filter((u) => u.department === departmentFilter);
    }

    return filtered;
  }, [allUsers, searchQuery, departmentFilter]);

  const stats = useMemo(() => {
    const totalRal = filteredUsers.reduce((sum, u) => sum + (Number(u.ral) || 0), 0);
    const avgMbo = filteredUsers.length > 0
      ? Math.round(
          filteredUsers.reduce((sum, u) => sum + (u.mboPercentage || 0), 0) /
            filteredUsers.length
        )
      : 0;
    const totalMboBudget = Math.round(
      filteredUsers.reduce(
        (sum, u) => sum + (Number(u.ral) || 0) * ((u.mboPercentage || 0) / 100),
        0
      )
    );

    return { totalRal, avgMbo, totalMboBudget };
  }, [filteredUsers]);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return `${f}${l}`.toUpperCase() || "U";
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader
            userName={user?.firstName || "Admin"}
            userRole="Amministratore"
            showSidebarTrigger={true}
          />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-semibold mb-1">Rendicontazione Finanziaria</h1>
                <p className="text-muted-foreground">
                  Visualizza RAL, MBO % e budget premio MBO per dipendente
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      RAL Totale
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">
                      €{stats.totalRal.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      MBO % Medio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{stats.avgMbo}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Budget Premio MBO
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">
                      €{stats.totalMboBudget.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Reporting Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle>Dati Finanziari Dipendenti</CardTitle>
                      <CardDescription>
                        Tabella completa RAL, MBO % e premio calcolato
                      </CardDescription>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-3 flex-wrap">
                      <div className="flex-1 min-w-[250px]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Cerca per nome, email o dipartimento..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            data-testid="input-search"
                          />
                        </div>
                      </div>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[200px]" data-testid="select-department">
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
                </CardHeader>
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
                            <TableHead className="text-right">RAL</TableHead>
                            <TableHead className="text-right">MBO %</TableHead>
                            <TableHead className="text-right">Premio MBO</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((u) => {
                            const mboValue =
                              u.ral && u.mboPercentage
                                ? Math.round((Number(u.ral) * u.mboPercentage) / 100)
                                : 0;

                            return (
                              <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      {u.profileImageUrl && (
                                        <AvatarImage
                                          src={u.profileImageUrl}
                                          alt={u.firstName || ""}
                                        />
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
                                <TableCell className="text-right font-medium">
                                  {u.ral ? `€${Number(u.ral).toLocaleString()}` : "-"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {u.mboPercentage ? `${u.mboPercentage}%` : "-"}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-primary">
                                  {mboValue ? `€${mboValue.toLocaleString()}` : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
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
