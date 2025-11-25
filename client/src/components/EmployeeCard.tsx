import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ProgressBar from "./ProgressBar";

export interface EmployeeData {
  id: string;
  name: string;
  role: string;
  department: string;
  totalObjectives: number;
  completedObjectives: number;
  clusters: {
    name: string;
    progress: number;
  }[];
}

interface EmployeeCardProps {
  employee: EmployeeData;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const overallProgress = Math.round(
    (employee.completedObjectives / employee.totalObjectives) * 100
  );

  return (
    <Card data-testid={`card-employee-${employee.id}`}>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-2xl font-semibold">{employee.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{employee.role}</p>
          <Badge variant="secondary" className="text-xs">
            {employee.department}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Obiettivi Totali</p>
            <p className="text-2xl font-semibold" data-testid="text-total-objectives">
              {employee.totalObjectives}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Completati</p>
            <p className="text-2xl font-semibold text-chart-2" data-testid="text-completed-objectives">
              {employee.completedObjectives}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Progresso Complessivo</h4>
            <span className="text-sm font-medium">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Progresso per Cluster</h4>
          {employee.clusters.map((cluster, index) => (
            <ProgressBar
              key={index}
              label={cluster.name}
              value={cluster.progress}
              showPercentage={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
