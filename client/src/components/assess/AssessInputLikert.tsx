import { LIKERT_OPTIONS } from '@/lib/assessQuestions';

interface Props {
  value: number | null;
  onChange: (value: number) => void;
}

export default function AssessInputLikert({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      {LIKERT_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${value === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
        >
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${value === opt.value ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              {opt.value}
            </span>
            <div>
              <p className="text-sm font-medium leading-snug">{opt.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.text}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
