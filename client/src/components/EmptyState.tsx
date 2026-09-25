import { type LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Icona mostrata sopra al titolo. Default: Inbox. */
  icon?: LucideIcon;
  title: string;
  /** Testo descrittivo opzionale sotto al titolo. */
  description?: string;
  /** Azione primaria opzionale (es. "Crea il primo obiettivo"). */
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Stato vuoto riusabile: da usare quando una lista/tabella non ha dati,
 * al posto di card vuote che fanno sembrare la pagina rotta.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}
      data-testid="empty-state"
    >
      <div className="rounded-full bg-muted p-3 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
