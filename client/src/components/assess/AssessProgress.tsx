import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Props {
  current: number;
  total: number;
  answered: number;
  section: string;
}

export default function AssessProgress({ current, total, answered, section }: Props) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <Badge variant="outline">{section}</Badge>
        <span className="text-muted-foreground">
          {current + 1} / {total}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <p className="text-xs text-muted-foreground text-right">{answered} risposte date</p>
    </div>
  );
}
