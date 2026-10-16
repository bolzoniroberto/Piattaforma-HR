import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, RotateCcw, Trophy, Target, Brain } from 'lucide-react';
import type { AssessReport } from '@/lib/assessScoring';
import { buildCsvExport } from '@/lib/assessScoring';

interface Props {
  report: AssessReport;
  onReset: () => void;
}

const PROFILE_COLORS: Record<string, string> = {
  Champion: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
  Expert: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  Curious: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
  Beginner: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
  'Profilo tematico': 'bg-primary/10 text-primary border-primary/30',
};

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

export default function AssessResults({ report, onReset }: Props) {
  const { score, profile, mindsetLens, calibration, recommendations } = report;

  function downloadJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assess-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    const blob = new Blob([buildCsvExport(report)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assess-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-lg font-bold ${PROFILE_COLORS[profile] ?? PROFILE_COLORS['Profilo tematico']}`}>
              <Trophy className="h-5 w-5" />
              {profile}
            </div>
            {score.overall !== null && (
              <div>
                <p className="text-4xl font-bold">{score.overall}<span className="text-xl text-muted-foreground">/100</span></p>
                <p className="text-sm text-muted-foreground">AI Skill Index</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dimension scores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Punteggi per dimensione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScoreBar label="Literacy" value={score.literacy} />
          <ScoreBar label="Fluency" value={score.fluency} />
          {score.delegation !== null && <ScoreBar label="↳ Delegation" value={score.delegation} />}
          {score.description !== null && <ScoreBar label="↳ Description" value={score.description} />}
          {score.discernment !== null && <ScoreBar label="↳ Discernment" value={score.discernment} />}
          {score.diligence !== null && <ScoreBar label="↳ Diligence" value={score.diligence} />}
          <ScoreBar label="Mindset" value={score.mindset} />
          {score.agents !== null && <ScoreBar label="AI Agents" value={score.agents} />}
          {score.technical !== null && <ScoreBar label="Fondamenti tecnici" value={score.technical} />}
        </CardContent>
      </Card>

      {/* Mindset lens */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Lente Mindset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="mb-2">{mindsetLens.label}</Badge>
          <p className="text-sm text-muted-foreground">{mindsetLens.text}</p>
        </CardContent>
      </Card>

      {/* Calibration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Calibrazione</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="mb-2">{calibration.label}</Badge>
          <p className="text-sm text-muted-foreground">{calibration.text}</p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.weakest.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aree da sviluppare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.weakest.map(item => (
              <div key={item.area} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.area}</span>
                  <Badge variant="secondary">{item.score}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Profile actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Azioni raccomandate</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {recommendations.profile.map((action, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={downloadJson} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          JSON
        </Button>
        <Button variant="outline" onClick={downloadCsv} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          CSV
        </Button>
        <Button variant="outline" onClick={onReset} className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          Nuovo test
        </Button>
      </div>
    </div>
  );
}
