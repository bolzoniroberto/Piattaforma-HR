import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppActionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export default function AppActionsPanel({ isOpen, onClose, title, children }: AppActionsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="w-72 shrink-0 border-l bg-background flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        {title && <span className="text-sm font-semibold">{title}</span>}
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
