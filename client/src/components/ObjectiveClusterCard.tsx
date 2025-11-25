import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target } from "lucide-react";
import ProgressBar from "./ProgressBar";

export interface ObjectiveCluster {
  id: string;
  name: string;
  description: string;
  totalObjectives: number;
  completedObjectives: number;
  color?: string;
}

interface ObjectiveClusterCardProps {
  cluster: ObjectiveCluster;
  onClick?: () => void;
}

export default function ObjectiveClusterCard({ cluster, onClick }: ObjectiveClusterCardProps) {
  const progress = Math.round((cluster.completedObjectives / cluster.totalObjectives) * 100);

  return (
    <Card
      className="hover-elevate cursor-pointer"
      onClick={onClick}
      data-testid={`card-cluster-${cluster.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex-1 space-y-1">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {cluster.name}
          </CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {cluster.description}
        </p>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {cluster.completedObjectives}/{cluster.totalObjectives} obiettivi
          </Badge>
        </div>

        <ProgressBar value={progress} showPercentage={true} />
      </CardContent>
    </Card>
  );
}
