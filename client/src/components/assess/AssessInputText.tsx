import { Textarea } from '@/components/ui/textarea';
import type { AssessRubric } from '@/lib/assessQuestions';

interface Props {
  value: string | null;
  onChange: (value: string) => void;
  rubric?: AssessRubric;
}

export default function AssessInputText({ value, onChange, rubric }: Props) {
  return (
    <div className="space-y-3">
      <Textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Scrivi qui la tua risposta…"
        rows={5}
        className="resize-none"
      />
      {rubric && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Criteri di valutazione:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {rubric.criteria.map((c, i) => (
              <li key={i}>{c.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
