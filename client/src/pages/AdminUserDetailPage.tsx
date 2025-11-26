import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    managerId: "",
    ral: "",
    mboPercentage: "25",
    role: "employee" as "employee" | "admin",
  });

  const { data: targetUser, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const handleLoadUser = (user: User | undefined) => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        department: user.department || "",
        managerId: user.managerId || "",
        ral: user.ral ? user.ral.toString() : "",
        mboPercentage: user.mboPercentage?.toString() || "25",
        role: (user.role as "employee" | "admin") || "employee",
      });
    }
  };

  // Load user data when it's fetched
  if (targetUser && formData.firstName === "") {
    handleLoadUser(targetUser);
  }

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const departments = Array.from(new Set(allUsers.map((u) => u.department).filter(Boolean)));

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No user selected");
      const res = await apiRequest("PATCH", `/api/users/${userId}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        department: formData.department,
        managerId: formData.managerId || null,
        ral: formData.ral ? parseFloat(formData.ral) : null,
        mboPercentage: parseInt(formData.mboPercentage),
        role: formData.role,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({ title: "Utente aggiornato con successo" });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare l'utente",
        variant: "destructive",
      });
    },
  });

  const style = {
    "--sidebar-width": "16rem",
  };

  if (isLoading) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <AppHeader
              userName={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Admin"}
              userRole="Amministratore"
              showSidebarTrigger={true}
            />
            <main className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Caricamento...</p>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!targetUser) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <AppHeader
              userName={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Admin"}
              userRole="Amministratore"
              showSidebarTrigger={true}
            />
            <main className="flex-1 flex items-center justify-center">
              <Card className="max-w-md">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Utente non trovato</p>
                  <Link href="/admin/users">
                    <Button variant="outline">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Torna alla lista
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const mboBonus = formData.ral && formData.mboPercentage 
    ? Math.round((parseFloat(formData.ral) * parseInt(formData.mboPercentage)) / 100)
    : 0;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AppHeader
            userName={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Admin"}
            userRole="Amministratore"
            showSidebarTrigger={true}
          />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-4">
                <Link href="/admin/users">
                  <Button variant="ghost" size="icon" data-testid="button-back">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-semibold mb-1">Modifica Utente</h1>
                  <p className="text-muted-foreground">
                    {targetUser?.firstName} {targetUser?.lastName}
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Personali</CardTitle>
                  <CardDescription>Modifica i dati dell'utente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div className="md:col-span-2">
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
                      <Select value={formData.department || ""} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                        <SelectTrigger id="department" data-testid="select-department">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept || ""}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compenso e MBO</CardTitle>
                  <CardDescription>RAL, percentuale MBO e premio in cash</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <Label>Premio MBO Calcolato</Label>
                      <div className="mt-2 p-3 bg-primary/10 rounded-md border border-primary/20">
                        <p className="text-lg font-bold text-primary" data-testid="text-mbo-bonus">
                          €{mboBonus.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end">
                <Link href="/admin/users">
                  <Button variant="outline" data-testid="button-cancel">
                    Annulla
                  </Button>
                </Link>
                <Button
                  onClick={() => updateUserMutation.mutate()}
                  disabled={updateUserMutation.isPending}
                  data-testid="button-save"
                >
                  {updateUserMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
