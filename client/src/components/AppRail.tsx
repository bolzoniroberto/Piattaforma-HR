import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { railNavigation } from "@/lib/navigationConfig";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface AppRailProps {
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
  isOpen: boolean;
}

export default function AppRail({ activeSection, onSectionClick, isOpen }: AppRailProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  // Filter rail items based on user role
  const visibleItems = railNavigation.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  // If rail is not open, don't render
  if (!isOpen) {
    return null;
  }

  return (
    <Sidebar
      collapsible="none"
      className="w-[60px] border-r"
      style={{ "--sidebar-width": "60px" } as React.CSSProperties}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.url
                  ? location === item.url
                  : activeSection === item.id;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild={!!item.url}
                      onClick={() => !item.url && onSectionClick(item.id)}
                      tooltip={item.title}
                      isActive={isActive}
                      className="w-full h-12 flex items-center justify-center"
                    >
                      {item.url ? (
                        <Link href={item.url}>
                          <Icon className="h-5 w-5" />
                        </Link>
                      ) : (
                        <div className="cursor-pointer">
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
