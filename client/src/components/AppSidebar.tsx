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
} from "lucide-react";
import logo24ore from "@assets/logo-24ore.svg";

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
];

const rendicontazioneItems = [
  {
    title: "Rendicontazione",
    url: "/admin/reporting",
    icon: CheckCircle,
  },
  {
    title: "Impostazioni",
    url: "/admin/settings",
    icon: Settings,
  },
];

export default function AppSidebar() {
  const [location] = useLocation();

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

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <img src={logo24ore} alt="Gruppo 24 Ore" className="h-8" />
          <div>
            <h2 className="font-semibold text-sm">Sistema MBO</h2>
            <p className="text-xs text-muted-foreground">Gruppo 24 Ore</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === dashboardItem.url}>
                  <Link href={dashboardItem.url} data-testid="link-sidebar-dashboard">
                    <dashboardItem.icon className="h-4 w-4" />
                    <span>{dashboardItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
      </SidebarContent>
    </Sidebar>
  );
}
