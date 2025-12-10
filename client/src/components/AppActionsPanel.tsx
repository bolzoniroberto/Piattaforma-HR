import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface AppActionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function AppActionsPanel({
  isOpen,
  onClose,
  title = "Azioni",
  children
}: AppActionsPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-[240px] h-[calc(100vh-7rem)] sticky top-6">
      <div
        className="bg-sidebar rounded-2xl p-4 h-full overflow-y-auto"
        style={{ boxShadow: 'var(--shadow-2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </aside>
  );
}
