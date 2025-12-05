import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { railNavigation } from "@/lib/navigationConfig";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider delayDuration={200}>
      <aside
        className="w-[72px] bg-sidebar rounded-2xl p-3 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col z-40"
        style={{ boxShadow: 'var(--shadow-2)' }}
      >
        {/* Logo Icon */}
        <div className="mb-4 pb-3 shrink-0 flex justify-center border-b border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary/15 transition-colors">
                <span className="text-primary font-bold text-base">HR</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Piattaforma HR</p>
              <p className="text-xs text-muted-foreground">MBO System</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation Icons */}
        <nav className="space-y-2 overflow-y-auto flex-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.url
              ? location === item.url
              : activeSection === item.id;

            const iconButton = (
              <div
                className={cn(
                  "w-full h-12 flex items-center justify-center rounded-xl",
                  "text-sidebar-foreground cursor-pointer",
                  "hover:bg-sidebar-accent transition-all duration-200",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            );

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  {item.url ? (
                    <Link href={item.url}>
                      <a>{iconButton}</a>
                    </Link>
                  ) : (
                    <button
                      onClick={() => onSectionClick(item.id)}
                      className="w-full"
                    >
                      {iconButton}
                    </button>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
