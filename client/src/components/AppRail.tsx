import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { railNavigation } from "@/lib/navigationConfig";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <aside
      className="w-[220px] bg-sidebar rounded-2xl p-4 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col"
      style={{ boxShadow: 'var(--shadow-2)' }}
    >
      <div className="mb-4 pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="text-primary font-bold text-sm">HR</span>
          </div>
          <div>
            <div className="font-semibold text-sm text-sidebar-foreground">Piattaforma HR</div>
            <div className="text-[10px] text-muted-foreground">MBO System</div>
          </div>
        </div>
      </div>

      <nav className="space-y-0.5 overflow-y-auto flex-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.url
            ? location === item.url
            : activeSection === item.id;

          return (
            <div key={item.id}>
              {item.url ? (
                <Link href={item.url}>
                  <a
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "text-sm text-sidebar-foreground",
                      "hover:bg-sidebar-accent transition-all duration-200",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.children && (
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        activeSection === item.id && "rotate-90"
                      )} />
                    )}
                  </a>
                </Link>
              ) : (
                <button
                  onClick={() => onSectionClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-sm text-sidebar-foreground",
                    "hover:bg-sidebar-accent transition-all duration-200",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.children && (
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      activeSection === item.id && "rotate-90"
                    )} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
