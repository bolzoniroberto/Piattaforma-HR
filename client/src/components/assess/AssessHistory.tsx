import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';

interface AssessmentResult {
  id: number;
  completedAt: string;
  profileLabel: string | null;
  literacyScore: number | null;
  fluencyScore: number | null;
  mindsetScore: number | null;
  overallScore: number | null;
  formId: string | null;
}

export default function AssessHistory() {
  const { data: results, isLoading } = useQuery<AssessmentResult[]>({
    queryKey: ['/api/assess/results'],
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground text-center py-4">Caricamento storico…</div>;
  }

  if (!results?.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Nessuna valutazione completata. I tuoi risultati appariranno qui.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Storico valutazioni
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {results.map(r => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {r.profileLabel && <Badge variant="secondary">{r.profileLabel}</Badge>}
                  {r.formId && <span className="text-xs text-muted-foreground">Form {r.formId}</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.completedAt).toLocaleDateString('it-IT', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right shrink-0">
                {r.overallScore !== null && (
                  <p className="text-lg font-bold">{r.overallScore}<span className="text-xs text-muted-foreground">/100</span></p>
                )}
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {r.literacyScore !== null && <span>L:{r.literacyScore}</span>}
                  {r.fluencyScore !== null && <span>F:{r.fluencyScore}</span>}
                  {r.mindsetScore !== null && <span>M:{r.mindsetScore}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
