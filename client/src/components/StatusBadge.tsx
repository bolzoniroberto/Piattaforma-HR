import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Target, AlertCircle } from "lucide-react";

export type ObjectiveStatus = "assegnato" | "in_corso" | "completato" | "da_approvare";

interface StatusBadgeProps {
  status: ObjectiveStatus;
}

const statusConfig = {
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
  completato: {
    label: "Completato",
    icon: CheckCircle,
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  da_approvare: {
    label: "Da Approvare",
    icon: AlertCircle,
    className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
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
