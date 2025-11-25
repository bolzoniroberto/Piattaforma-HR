import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Target, AlertCircle, HelpCircle } from "lucide-react";

export type ObjectiveStatus = "assegnato" | "in_corso" | "in_progress" | "completato" | "completed" | "da_approvare" | "pending_approval" | string;

interface StatusBadgeProps {
  status: ObjectiveStatus;
}

const statusConfig: Record<string, { label: string; icon: typeof Target; className: string }> = {
  assegnato: {
    label: "Assegnato",
    icon: Target,
    className: "bg-muted text-muted-foreground",
  },
  in_corso: {
    label: "In Corso",
    icon: Clock,
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
  in_progress: {
    label: "In Corso",
    icon: Clock,
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
  completato: {
    label: "Completato",
    icon: CheckCircle,
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  completed: {
    label: "Completato",
    icon: CheckCircle,
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  da_approvare: {
    label: "Da Approvare",
    icon: AlertCircle,
    className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  },
  pending_approval: {
    label: "Da Approvare",
    icon: AlertCircle,
    className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  },
};

const defaultConfig = {
  label: "Sconosciuto",
  icon: HelpCircle,
  className: "bg-muted text-muted-foreground",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || defaultConfig;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 ${config.className}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}
