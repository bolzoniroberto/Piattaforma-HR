import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { TEST_MODES } from '@/lib/assessQuestions';
import type { AssessMeta } from '@/hooks/useAssessment';
import { BrainCircuit, Clock, ChevronRight } from 'lucide-react';

interface Props {
  onStart: (meta: AssessMeta) => void;
}

export default function AssessIntro({ onStart }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [area, setArea] = useState('');
  const [selfSkill, setSelfSkill] = useState<number>(50);
  const [testModeId, setTestModeId] = useState('complete');

  const selectedMode = TEST_MODES.find(m => m.id === testModeId) ?? TEST_MODES[0];

  function handleStart() {
    onStart({ name, role, area, selfSkill, testModeId });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Valutazione competenze GenAI</CardTitle>
              <CardDescription>Misura il tuo livello su Literacy, Fluency e Mindset</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="assess-name">Nome (opzionale)</Label>
              <Input id="assess-name" value={name} onChange={e => setName(e.target.value)} placeholder="Mario Rossi" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="assess-role">Ruolo (opzionale)</Label>
              <Input id="assess-role" value={role} onChange={e => setRole(e.target.value)} placeholder="Es. Manager, Analista…" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="assess-area">Area / team (opzionale)</Label>
            <Input id="assess-area" value={area} onChange={e => setArea(e.target.value)} placeholder="Es. Operations, HR, IT…" />
          </div>
          <div className="space-y-2">
            <Label>Quanto ti senti competente sull'AI? (autovalutazione)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[selfSkill]}
                onValueChange={v => setSelfSkill(v[0])}
                min={0} max={100} step={5}
                className="flex-1"
              />
              <span className="w-10 text-right font-mono text-sm">{selfSkill}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Principiante</span>
              <span>Esperto</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scegli la modalità</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {TEST_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setTestModeId(mode.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${testModeId === mode.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={testModeId === mode.id ? 'default' : 'secondary'} className="text-xs">
                      {mode.shortLabel}
                    </Badge>
                    <span className="text-sm font-medium">{mode.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{mode.questionLimit} domande</span>
                  </div>
                </div>
                {testModeId === mode.id && (
                  <p className="mt-1.5 text-xs text-muted-foreground">{mode.description}</p>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleStart} size="lg" className="w-full">
        Avvia valutazione
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
