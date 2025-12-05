import { Link, useLocation } from "wouter";
import { X } from "lucide-react";
import { railNavigation } from "@/lib/navigationConfig";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-[280px] bg-sidebar rounded-2xl p-4 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col"
          style={{ boxShadow: 'var(--shadow-2)' }}
        >
          <div className="flex items-center justify-between mb-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm text-sidebar-foreground">{activeSectionConfig.title}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-sidebar-accent"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
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
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
