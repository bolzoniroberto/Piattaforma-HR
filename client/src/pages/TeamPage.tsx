import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserCircle,
  Mail,
  Phone,
  Building2,
  ChevronRight,
} from "lucide-react";
import type { User } from "@shared/schema";
import { Link } from "wouter";

export default function TeamPage() {
  const { user, isLoading: userLoading } = useAuth();
  const { activeSection, setActiveSection } = useRail();

  // Fetch all users to build team structure
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  if (userLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Utente non trovato</p>
      </div>
    );
  }

  // Find manager
  const manager = user.managerId
    ? allUsers.find((u) => u.id === user.managerId)
    : null;

  // Find colleagues (same manager, excluding current user)
  const colleagues = user.managerId
    ? allUsers.filter(
        (u) => u.managerId === user.managerId && u.id !== user.id && u.isActive
      )
    : [];

  // Find direct reports (people who report to current user)
  const directReports = allUsers.filter(
    (u) => u.managerId === user.id && u.isActive
  );

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const name = `${firstName || ""} ${lastName || ""}`.trim();
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getFullName = (u: User) => {
    return `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Senza nome";
  };

  const UserCard = ({ user: u, role }: { user: User; role?: string }) => (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={u.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(u.firstName, u.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-base">{getFullName(u)}</p>
                {role && (
                  <Badge variant="outline" className="mt-1">
                    {role}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {u.department && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{u.department}</span>
                </div>
              )}
              {u.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{u.email}</span>
                </div>
              )}
              {u.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{u.telefono}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <AppHeader
        userName={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
        userRole={user.role === "admin" ? "Amministratore" : "Dipendente"}
        notificationCount={0}
        showSidebarTrigger={true}
        pageTitle="Team"
        pageIcon={Users}
        pageDescription="Il tuo team e la struttura organizzativa"
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

          {/* MAIN CONTENT - flex-1, never resizes, NO margin transitions */}
          <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="max-w-5xl mx-auto space-y-6">

              {/* Hierarchy Breadcrumb */}
              {manager && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Struttura:</span>
                      <span className="font-medium">{manager.department || "Dipartimento"}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getFullName(manager)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-primary">Tu</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manager Section */}
              {manager && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <UserCircle className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Il tuo Responsabile</h2>
                  </div>
                  <UserCard user={manager} role="Responsabile" />
                </div>
              )}

              {!manager && (
                <Card className="bg-muted/50">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Non hai un responsabile assegnato</p>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Colleagues Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    Colleghi{" "}
                    <span className="text-muted-foreground text-base font-normal">
                      ({colleagues.length})
                    </span>
                  </h2>
                </div>

                {colleagues.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colleagues.map((colleague) => (
                      <UserCard key={colleague.id} user={colleague} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-muted/50">
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nessun collega con lo stesso responsabile</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Direct Reports Section (if user is a manager) */}
              {directReports.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">
                        I tuoi Collaboratori{" "}
                        <span className="text-muted-foreground text-base font-normal">
                          ({directReports.length})
                        </span>
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {directReports.map((report) => (
                        <UserCard key={report.id} user={report} role="Collaboratore" />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Link to Full Org Chart */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base">Visualizza l'Organigramma Completo</h3>
                      <p className="text-sm text-muted-foreground">
                        Esplora l'intera struttura organizzativa aziendale
                      </p>
                    </div>
                    <Link href="/organigramma">
                      <a>
                        <Button variant="default" className="gap-2">
                          <Building2 className="h-4 w-4" />
                          Vai all'Organigramma
                        </Button>
                      </a>
                    </Link>
                  </div>
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
