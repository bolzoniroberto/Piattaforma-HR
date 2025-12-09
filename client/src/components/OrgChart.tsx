import { ChevronDown, ChevronUp, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
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
          className="w-56 border-2 border-primary/60 bg-primary/8 shadow-lg transition-all duration-200 hover:shadow-xl cursor-pointer relative z-10"
          onClick={() => onUserClick?.(rootUser)}
        >
          <CardContent className="p-5">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <Avatar className="h-20 w-20 mb-3">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {getInitials(rootUser.firstName, rootUser.lastName)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <h2 className="font-bold text-lg text-center">
                {`${rootUser.firstName || ""} ${rootUser.lastName || ""}`.trim()}
              </h2>
              <p className="text-sm text-muted-foreground text-center">
                {rootUser.department || "N/A"}
              </p>
              {rootUser.email && (
                <p className="text-xs text-muted-foreground text-center hover:underline">
                  {rootUser.email}
                </p>
              )}

              {/* Direct Reports Count */}
              {directReports.length > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-xs font-semibold text-primary">
                    {directReports.length}{" "}
                    {directReports.length === 1 ? "collaboratore" : "collaboratori"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Direct Reports */}
        {directReports.length > 0 && (
          <>
            {/* Vertical Connector Line - Enhanced */}
            <div className="relative mt-6 animate-in fade-in zoom-in-95 duration-500">
              {/* Main line */}
              <div className="w-1 h-12 bg-gradient-to-b from-primary via-primary/90 to-primary/70 rounded-full shadow-md" />
              {/* Glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-12 bg-primary/20 blur-sm rounded-full" />
            </div>

            {/* Container with horizontal line and reports */}
            <div className="relative">
              {/* Horizontal Connector Line - Enhanced with shadow and border */}
              {directReports.length > 1 && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2" style={{
                  width: `${Math.min(directReports.length * 200, 800)}px`,
                }}>
                  {/* Shadow/border effect */}
                  <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-primary/20 blur-sm rounded-full animate-in fade-in duration-700" />
                  {/* Main line */}
                  <div className="relative w-full h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70 rounded-full shadow-lg animate-in fade-in zoom-in-95 duration-700">
                    {/* Animated pulse effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse" />
                  </div>
                </div>
              )}

              {/* Flexbox of Direct Reports - Staggered Layout */}
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-16 px-4 pt-8 max-w-6xl">
                {directReports.map((report, index) => {
                  const hasSubReports = users.some((u) => u.managerId === report.id);
                  const isFirst = index === 0;
                  const isLast = index === directReports.length - 1;

                  return (
                    <div
                      key={report.id}
                      className="flex flex-col items-center cursor-pointer group relative animate-in fade-in slide-in-from-bottom-4"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animationDuration: '500ms',
                        animationFillMode: 'backwards'
                      }}
                      onClick={() => {
                        onUserSelect?.(report.id);
                      }}
                    >
                      {/* Vertical Connector Line (from horizontal line to card) - Enhanced */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-0">
                        {/* Glow effect */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-3 h-8 bg-primary/15 blur-sm rounded-full" />
                        {/* Main line with gradient */}
                        <div className="relative w-1 h-8 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/50 rounded-full shadow-md group-hover:from-primary group-hover:to-primary/70 transition-all duration-300" />
                      </div>

                      {/* Enhanced corner connectors for first/last items */}
                      {directReports.length > 1 && (
                        <>
                          {isFirst && (
                            <div className="absolute -top-8 left-1/2 w-20 h-8">
                              {/* Horizontal part */}
                              <div className="absolute top-0 -left-20 w-20 h-1 bg-gradient-to-l from-primary/80 to-primary/50 rounded-full shadow-md" />
                              {/* Glow for horizontal */}
                              <div className="absolute top-0 -left-20 w-20 h-1.5 bg-primary/15 blur-sm rounded-full" />
                            </div>
                          )}
                          {isLast && (
                            <div className="absolute -top-8 right-1/2 w-20 h-8">
                              {/* Horizontal part */}
                              <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-primary/80 to-primary/50 rounded-full shadow-md" />
                              {/* Glow for horizontal */}
                              <div className="absolute top-0 left-0 w-20 h-1.5 bg-primary/15 blur-sm rounded-full" />
                            </div>
                          )}
                        </>
                      )}

                      {/* Report Card */}
                      <Card
                        className={cn(
                          "w-48 transition-all duration-200 hover:shadow-lg hover:border-primary/70",
                          "hover:bg-primary/6 border",
                          hasSubReports ? "border-primary/40 bg-blue-50/50" : "border-border"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUserClick?.(report);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center">
                            {/* Avatar */}
                            <div className="relative mb-3">
                              <Avatar className="h-14 w-14">
                                <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                                  {getInitials(report.firstName, report.lastName)}
                                </AvatarFallback>
                              </Avatar>

                              {/* Badge for sub-reports */}
                              {hasSubReports && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                                  {users.filter((u) => u.managerId === report.id).length}
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <h3 className="font-semibold text-sm text-center truncate w-full">
                              {`${report.firstName || ""} ${report.lastName || ""}`.trim()}
                            </h3>
                            <p className="text-xs text-muted-foreground text-center truncate w-full">
                              {report.department || "N/A"}
                            </p>

                            {/* Explore Button */}
                            {hasSubReports && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-8 w-full text-xs gap-1 group-hover:bg-primary/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUserSelect?.(report.id);
                                }}
                              >
                                <ChevronDown className="h-3 w-3" />
                                Esplora
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
