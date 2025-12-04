import { Link, useLocation } from "wouter";
import { X } from "lucide-react";
import { railNavigation } from "@/lib/navigationConfig";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface AppPanelProps {
  activeSection: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppPanel({ activeSection, isOpen, onClose }: AppPanelProps) {
  const [location] = useLocation();

  // Find active section config
  const activeSectionConfig = railNavigation.find(
    (item) => item.id === activeSection
  );

  // If no active section or section has no children, don't render panel
  if (!isOpen || !activeSectionConfig || !activeSectionConfig.children) {
    return null;
  }

  const Icon = activeSectionConfig.icon;

  return (
    <Sidebar
      collapsible="none"
      className="w-[240px] border-r"
      style={{ "--sidebar-width": "240px" } as React.CSSProperties}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{activeSectionConfig.title}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-accent"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeSectionConfig.children.map((child) => {
                const ChildIcon = child.icon;
                const isActive = location === child.url;

                return (
                  <SidebarMenuItem key={child.id}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={child.url || "#"}>
                        <ChildIcon className="h-4 w-4" />
                        <span>{child.title}</span>
                      </Link>
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
