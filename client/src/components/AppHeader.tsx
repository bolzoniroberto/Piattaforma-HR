import { Bell, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import logoPath from "@assets/image_1764169863444.png";

interface AppHeaderProps {
  userName?: string;
  userRole?: string;
  notificationCount?: number;
  showSidebarTrigger?: boolean;
}

export default function AppHeader({ 
  userName = "Mario Rossi",
  userRole = "Dipendente",
  notificationCount = 0,
  showSidebarTrigger = false
}: AppHeaderProps) {
  const { user } = useAuth();
  
  const handleLogout = async () => {
    // Clear demo mode
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("demo_mode");
      sessionStorage.removeItem("demo_role");
    }
    
    // Redirect to logout or login
    if (user?.id?.startsWith("demo-")) {
      // Demo user - just redirect to login
      window.location.href = "/";
    } else {
      // Real user - call logout endpoint
      window.location.href = "/api/logout";
    }
  };
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {showSidebarTrigger && <SidebarTrigger data-testid="button-sidebar-toggle" />}
        <div className="flex items-center gap-3">
          <img src={logoPath} alt="Gruppo 24 Ore" className="h-8" />
          <h1 className="text-xl font-semibold text-foreground">Sistema MBO</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs text-muted-foreground">{userRole}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-profile">
              <User className="mr-2 h-4 w-4" />
              Profilo
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-settings">
              <Settings className="mr-2 h-4 w-4" />
              Impostazioni
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
              <LogOut className="mr-2 h-4 w-4" />
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
