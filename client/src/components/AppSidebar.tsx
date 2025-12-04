import { useState, useEffect } from "react";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRail } from "@/contexts/RailContext";
import AppRail from "./AppRail";
import AppPanel from "./AppPanel";
import { railNavigation } from "@/lib/navigationConfig";

export default function AppSidebar() {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const { user } = useAuth();
  const { isRailOpen, setIsRailOpen } = useRail();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Auto-detect active section based on current route
  useEffect(() => {
    const currentPath = location;

    for (const railItem of railNavigation) {
      if (railItem.children) {
        const matchingChild = railItem.children.find(
          (child) => child.url === currentPath
        );
        if (matchingChild) {
          setActiveSection(railItem.id);
          return;
        }
      }
    }

    // If no match found, close panel
    setActiveSection(null);
  }, [location]);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const handleClosePanel = () => {
    setActiveSection(null);
    setIsRailOpen(false);
  };

  // Mobile: Single expanded sidebar with all menus open
  if (isMobile) {
    return (
      <Sidebar collapsible="offcanvas" className="w-[280px]">
        <SidebarContent>
          {/* Render all sections expanded */}
          {railNavigation
            .filter((item) => !item.adminOnly || user?.role === "admin")
            .map((section) => (
              <SidebarGroup key={section.id}>
                <SidebarGroupLabel className="flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </SidebarGroupLabel>
                {section.children && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.children.map((child) => (
                        <SidebarMenuItem key={child.id}>
                          <SidebarMenuButton asChild>
                            <Link href={child.url || "#"}>
                              <child.icon className="h-4 w-4" />
                              <span>{child.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            ))}
        </SidebarContent>
      </Sidebar>
    );
  }

  // Desktop: Rail + Panel
  return (
    <>
      <AppRail
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        isOpen={isRailOpen}
      />
      <AppPanel
        activeSection={activeSection}
        isOpen={activeSection !== null}
        onClose={handleClosePanel}
      />
    </>
  );
}
