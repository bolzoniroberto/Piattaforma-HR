import { useState } from "react";
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
    <div className="flex flex-col items-center justify-center min-h-full py-6">
      {/* Root User (Current Selected) */}
      <div className="flex flex-col items-center">
        {/* User Card */}
        <Card
          className="w-48 border-2 border-primary/50 bg-primary/5 transition-all duration-200 hover:shadow-lg cursor-pointer"
          onClick={() => onUserClick?.(rootUser)}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <Avatar className="h-16 w-16 mb-3">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
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
            {/* Connector Line */}
            <div className="w-1 h-6 bg-border mt-4 mb-4" />

            {/* Horizontal Line */}
            <div className="flex items-center mb-4">
              <div className="h-1 flex-grow bg-border" style={{ minWidth: "24px" }} />
              <div className="w-1 h-4 bg-border mx-0" />
              <div className="h-1 flex-grow bg-border" style={{ minWidth: "24px" }} />
            </div>

            {/* Grid of Direct Reports */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-2">
              {directReports.map((report) => {
                const hasSubReports = users.some((u) => u.managerId === report.id);

                return (
                  <div
                    key={report.id}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => {
                      onUserSelect?.(report.id);
                    }}
                  >
                    {/* Connector Line */}
                    <div className="w-1 h-4 bg-border mb-2 group-hover:bg-primary transition-colors" />

                    {/* Report Card */}
                    <Card
                      className={cn(
                        "w-40 transition-all duration-200 hover:shadow-lg hover:border-primary/50",
                        "hover:bg-primary/5",
                        hasSubReports && "border-border"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserClick?.(report);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex flex-col items-center">
                          {/* Avatar */}
                          <div className="relative mb-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                                {getInitials(report.firstName, report.lastName)}
                              </AvatarFallback>
                            </Avatar>

                            {/* Badge for sub-reports */}
                            {hasSubReports && (
                              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
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
                              className="mt-1 h-7 w-full text-xs gap-1 group-hover:bg-primary/20"
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

            {/* Back Button */}
            {selectedUserId && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentUser = users.find((u) => u.id === selectedUserId);
                    if (currentUser?.managerId) {
                      onUserSelect?.(currentUser.managerId);
                    }
                  }}
                  className="gap-2"
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
