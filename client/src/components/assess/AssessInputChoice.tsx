import type { AssessQuestion } from '@/lib/assessQuestions';

interface Props {
  question: AssessQuestion;
  value: number | null;
  onChange: (value: number) => void;
}

export default function AssessInputChoice({ question, value, onChange }: Props) {
  if (!question.options) return null;

  return (
    <div className="space-y-2">
      {question.options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => onChange(idx)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${value === idx ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
        >
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs ${value === idx ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              {String.fromCharCode(65 + idx)}
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
