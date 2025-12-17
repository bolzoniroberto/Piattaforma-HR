import { Link, useLocation } from "wouter";
import { railNavigation } from "@/lib/navigationConfig";
import { cn } from "@/lib/utils";

interface AppPanelProps {
  activeSection: string | null;
  className?: string;
}

export default function AppPanel({ activeSection, className = "" }: AppPanelProps) {
  const [location] = useLocation();

  // Find active section config
  const activeSectionConfig = railNavigation.find(
    (item) => item.id === activeSection
  );

  // If no active section or section has no children, don't render panel
  if (!activeSectionConfig || !activeSectionConfig.children) {
    return null;
  }

  const Icon = activeSectionConfig.icon;

  return (
    <aside
      className={cn(
        "w-[240px] bg-sidebar rounded-2xl p-4 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col overflow-y-auto",
        className
      )}
      style={{ boxShadow: 'var(--shadow-2)' }}
    >
      <div className="flex items-center gap-2 mb-4 pb-3 shrink-0">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-medium text-sm text-sidebar-foreground">{activeSectionConfig.title}</span>
      </div>

      <div className="space-y-0.5 overflow-y-auto flex-1">
        {activeSectionConfig.children.map((child) => {
          const ChildIcon = child.icon;
          const isActive = location === child.url;

          return (
            <Link key={child.id} href={child.url || "#"}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg",
                  "text-sm text-sidebar-foreground",
                  "hover:bg-sidebar-accent transition-all duration-200",
                  isActive && "bg-primary/10 text-primary font-medium"
                )}
              >
                <ChildIcon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{child.title}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
