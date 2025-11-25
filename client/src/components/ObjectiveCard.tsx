import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge, { type ObjectiveStatus } from "./StatusBadge";
import { MoreVertical, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Objective {
  id: string;
  title: string;
  description: string;
  cluster: string;
  status: ObjectiveStatus;
  deadline?: string;
  progress?: number;
}

interface ObjectiveCardProps {
  objective: Objective;
  onStatusChange?: (id: string, status: ObjectiveStatus) => void;
}

export default function ObjectiveCard({ objective, onStatusChange }: ObjectiveCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-objective-${objective.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base leading-tight">{objective.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{objective.cluster}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid={`button-objective-menu-${objective.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid="menu-edit">Modifica</DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-details">Dettagli</DropdownMenuItem>
            {onStatusChange && (
              <>
                <DropdownMenuItem onClick={() => onStatusChange(objective.id, "in_corso")}>
                  Segna in corso
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(objective.id, "completato")}>
                  Segna completato
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground leading-relaxed">{objective.description}</p>
        
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <StatusBadge status={objective.status} />
          {objective.deadline && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{objective.deadline}</span>
            </div>
          )}
        </div>

        {objective.progress !== undefined && (
          <div className="pt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{objective.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${objective.progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
