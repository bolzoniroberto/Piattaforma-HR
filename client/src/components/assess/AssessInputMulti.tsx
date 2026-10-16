import { Checkbox } from '@/components/ui/checkbox';
import type { AssessQuestion } from '@/lib/assessQuestions';

interface Props {
  question: AssessQuestion;
  value: number[] | null;
  onChange: (value: number[]) => void;
}

export default function AssessInputMulti({ question, value, onChange }: Props) {
  if (!question.options) return null;
  const selected = value ?? [];

  function toggle(idx: number) {
    const next = selected.includes(idx) ? selected.filter(i => i !== idx) : [...selected, idx];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Seleziona tutte le opzioni applicabili</p>
      {question.options.map((opt, idx) => {
        const isSelected = selected.includes(idx);
        return (
          <button
            key={idx}
            onClick={() => toggle(idx)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
          >
            <div className="flex items-start gap-3">
              <Checkbox checked={isSelected} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium leading-snug">{opt.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.text}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
