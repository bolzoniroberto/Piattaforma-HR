import { ChevronDown, ChevronUp, User, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User as UserType } from "@shared/schema";

interface OrgChartProps {
  users: UserType[];
  selectedUserId?: string;
  onUserSelect?: (userId: string) => void;
  onUserClick?: (user: UserType) => void;
}

export default function OrgChart({ users, selectedUserId, onUserSelect, onUserClick }: OrgChartProps) {
  // Find the selected user or the first top-level manager
  const findRootUser = (): UserType | null => {
    if (selectedUserId) {
      return users.find((u) => u.id === selectedUserId) || null;
    }

    // Find first user with no manager
    return users.find((u) => !u.managerId) || users[0] || null;
  };

  const rootUser = findRootUser();

  if (!rootUser) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Nessun utente disponibile</p>
      </div>
    );
  }

  // Get direct reports of the current user
  const directReports = users.filter((u) => u.managerId === rootUser.id);

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
    <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
      {/* Root User (Current Selected) */}
      <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
        {/* User Card */}
        <Card
          className="relative w-72 shadow-lg transition-all duration-200 hover:shadow-xl cursor-pointer bg-card border border-border z-10"
        >
          {/* Badge conteggio collaboratori (top-right) */}
          {directReports.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center p-0 text-sm font-bold shadow-md hover:bg-primary/90">
              {directReports.length}
            </Badge>
          )}

          <CardContent className="p-6 pt-8">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {getInitials(rootUser.firstName, rootUser.lastName)}
                </AvatarFallback>
              </Avatar>

              {/* Nome (link cliccabile) */}
              <button
                onClick={() => onUserClick?.(rootUser)}
                className="text-primary hover:text-primary/80 font-semibold text-lg mb-1 transition-colors text-center w-full"
              >
                {`${rootUser.firstName || ""} ${rootUser.lastName || ""}`.trim()}
              </button>

              {/* Dipartimento */}
              <p className="text-sm text-muted-foreground text-center mb-3">
                {rootUser.department || "Dipartimento non specificato"}
              </p>

              {/* Sede/Indirizzo con icona */}
              {rootUser.indirizzo && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{rootUser.indirizzo}</span>
                </div>
              )}

              {/* Email */}
              {rootUser.email && (
                <p className="text-xs text-muted-foreground text-center">
                  {rootUser.email}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Direct Reports */}
        {directReports.length > 0 && (
          <>
            {/* Vertical Connector Line from Root */}
            <div className="flex justify-center mt-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-0.5 h-16 bg-gradient-to-b from-primary to-primary/40" />
            </div>

            {/* Container with horizontal line and reports */}
            <div className="relative">
              {/* Horizontal Connector Line */}
              {directReports.length > 1 && (
                <div className="flex justify-center mb-8">
                  <div className="relative h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" style={{
                    width: `${Math.min(directReports.length * 280, 1400)}px`,
                  }}>
                    {/* Center connection point */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                  </div>
                </div>
              )}

              {/* Grid of Direct Reports with Better Spacing */}
              <div className="flex flex-wrap justify-center gap-x-16 gap-y-12 px-4 max-w-7xl mx-auto">
                {directReports.map((report, index) => {
                  const hasSubReports = users.some((u) => u.managerId === report.id);

                  return (
                    <div
                      key={report.id}
                      className="relative flex flex-col items-center animate-in fade-in slide-in-from-bottom-4"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animationDuration: '500ms',
                        animationFillMode: 'backwards'
                      }}
                    >
                      {/* Vertical Connector Line (individual per card) */}
                      <div className="w-0.5 h-12 bg-gradient-to-b from-primary/40 to-transparent mb-4" />

                      {/* Report Card */}
                      <Card
                        className="relative w-64 shadow-lg transition-all duration-200 hover:shadow-xl bg-card border border-border"
                      >
                        {/* Badge conteggio sub-reports (top-right) */}
                        {hasSubReports && (
                          <Badge className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center p-0 text-xs font-bold shadow-md hover:bg-primary/90">
                            {users.filter((u) => u.managerId === report.id).length}
                          </Badge>
                        )}

                        <CardContent className="p-6 pt-7">
                          <div className="flex flex-col items-center">
                            {/* Avatar */}
                            <Avatar className="h-20 w-20 mb-4 border-2 border-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                                {getInitials(report.firstName, report.lastName)}
                              </AvatarFallback>
                            </Avatar>

                            {/* Nome (link cliccabile) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUserClick?.(report);
                              }}
                              className="text-primary hover:text-primary/80 font-semibold text-base mb-1 transition-colors text-center w-full"
                            >
                              {`${report.firstName || ""} ${report.lastName || ""}`.trim()}
                            </button>

                            {/* Dipartimento */}
                            <p className="text-sm text-muted-foreground text-center mb-2">
                              {report.department || "Dipartimento non specificato"}
                            </p>

                            {/* Sede/Indirizzo con icona */}
                            {report.indirizzo && (
                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-3">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{report.indirizzo}</span>
                              </div>
                            )}

                            {/* Explore Button */}
                            {hasSubReports && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mt-2 gap-1.5 hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUserSelect?.(report.id);
                                }}
                              >
                                <ChevronDown className="h-4 w-4" />
                                Esplora Team
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Back Button */}
            {selectedUserId && (
              <div className="mt-8 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentUser = users.find((u) => u.id === selectedUserId);
                    if (currentUser?.managerId) {
                      onUserSelect?.(currentUser.managerId);
                    }
                  }}
                  className="gap-2 hover:scale-105 transition-transform duration-200"
                >
                  <ChevronUp className="h-4 w-4" />
                  Torna al Superiore
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
