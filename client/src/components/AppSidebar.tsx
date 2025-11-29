import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Target,
  Users,
  FileText,
  Settings,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const dashboardItem = {
  title: "Dashboard",
  url: "/admin",
  icon: LayoutDashboard,
};

const impostazioniStruttureItems = [
  {
    title: "Gestione Utenti",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Impostazioni Strutture",
    url: "/admin/settings",
    icon: Settings,
  },
];

const goalSettingItems = [
  {
    title: "Database Obiettivi",
    url: "/admin/objectives",
    icon: Target,
  },
  {
    title: "Assegnazione Obiettivi",
    url: "/admin/assignments-bulk",
    icon: FileText,
  },
  {
    title: "Cancella Obiettivi",
    url: "/admin/clear-assignments",
    icon: Trash2,
  },
];

const rendicontazioneItems = [
  {
    title: "Rendicontazione",
    url: "/admin/reporting",
    icon: CheckCircle,
  },
];

export default function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const renderMenuGroup = (items: Array<{ title: string; url: string; icon: any }>) => (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = location === item.url;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={item.url} data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  const isAdmin = user?.role === "admin";

  return (
    <Sidebar>
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/" data-testid="link-sidebar-miei-obiettivi">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Miei Obiettivi</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - only if user is admin */}
        {isAdmin && (
          <>
            {/* 1. Impostazioni Strutture */}
            <SidebarGroup>
              <SidebarGroupLabel>Impostazioni Strutture</SidebarGroupLabel>
              <SidebarGroupContent>
                {renderMenuGroup(impostazioniStruttureItems)}
              </SidebarGroupContent>
            </SidebarGroup>

            {/* 2. Goal Setting */}
            <SidebarGroup>
              <SidebarGroupLabel>Goal Setting</SidebarGroupLabel>
              <SidebarGroupContent>
                {renderMenuGroup(goalSettingItems)}
              </SidebarGroupContent>
            </SidebarGroup>

            {/* 3. Rendicontazione */}
            <SidebarGroup>
              <SidebarGroupLabel>Rendicontazione</SidebarGroupLabel>
              <SidebarGroupContent>
                {renderMenuGroup(rendicontazioneItems)}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
