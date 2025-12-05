import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { railNavigation } from "@/lib/navigationConfig";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
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
      className="w-[240px] border-r border-border"
      style={{ "--sidebar-width": "240px" } as React.CSSProperties}
    >
      <SidebarHeader className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="text-primary font-bold text-sm">S24</span>
          </div>
          <span className="md3-title-medium text-foreground">MBO Platform</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
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
                      isActive={isActive}
                      className={cn(
                        "w-full h-11 px-4 flex items-center gap-3 rounded-lg",
                        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        "transition-all duration-200",
                        "md3-label-large",
                        isActive && "bg-sidebar-accent border-l-2 border-primary font-semibold"
                      )}
                    >
                      {item.url ? (
                        <Link href={item.url} className="flex items-center gap-3 flex-1">
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 text-left">{item.title}</span>
                          {item.children && (
                            <ChevronRight className={cn(
                              "h-4 w-4 transition-transform",
                              activeSection === item.id && "rotate-90"
                            )} />
                          )}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 flex-1 cursor-pointer">
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 text-left">{item.title}</span>
                          {item.children && (
                            <ChevronRight className={cn(
                              "h-4 w-4 transition-transform",
                              activeSection === item.id && "rotate-90"
                            )} />
                          )}
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
