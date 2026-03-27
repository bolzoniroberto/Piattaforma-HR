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
}

export default function AppRail({ activeSection, onSectionClick }: AppRailProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  // Filter rail items based on user role
  const visibleItems = railNavigation.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className="w-[72px] shrink-0 bg-sidebar rounded-2xl p-3 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col z-40"
        style={{ boxShadow: 'var(--shadow-2)' }}
      >
        {/* Logo Icon */}
        <div className="mb-4 pb-3 shrink-0 flex justify-center border-b border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105">
                <span className="text-primary-foreground font-bold text-sm tracking-wider">TLNT</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Piattaforma Talent</p>
              <p className="text-xs text-muted-foreground">Talent System</p>
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
                  "text-muted-foreground cursor-pointer",
                  "hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200",
                  isActive && "bg-sidebar-accent text-sidebar-foreground font-semibold"
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
