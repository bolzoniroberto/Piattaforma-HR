import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AssessQuestion } from '@/lib/assessQuestions';
import AssessInputLikert from './AssessInputLikert';
import AssessInputChoice from './AssessInputChoice';
import AssessInputMulti from './AssessInputMulti';
import AssessInputText from './AssessInputText';

interface Props {
  question: AssessQuestion;
  answer: unknown;
  hintVisible: boolean;
  onAnswer: (value: unknown) => void;
  onToggleHint: () => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  likert: 'Autovalutazione',
  scenario: 'Scenario',
  knowledge: 'Conoscenza',
  multi: 'Selezione multipla',
  text: 'Risposta aperta',
  choice: 'Scelta singola',
};

export default function AssessQuestionCard({
  question,
  answer,
  hintVisible,
  onAnswer,
  onToggleHint,
  onNext,
  onPrev,
  isFirst,
  isLast,
}: Props) {
  function renderInput() {
    switch (question.type) {
      case 'likert':
        return <AssessInputLikert value={answer as number | null} onChange={onAnswer} />;
      case 'scenario':
      case 'knowledge':
      case 'choice':
        return <AssessInputChoice question={question} value={answer as number | null} onChange={onAnswer} />;
      case 'multi':
        return <AssessInputMulti question={question} value={answer as number[] | null} onChange={onAnswer} />;
      case 'text':
        return <AssessInputText value={answer as string | null} onChange={onAnswer} rubric={question.rubric} />;
      default:
        return null;
    }
  }

  const isAnswered = answer !== undefined && answer !== null && answer !== '';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="secondary" className="text-xs shrink-0">{TYPE_LABEL[question.type] ?? question.type}</Badge>
          {question.hint && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={onToggleHint}>
              <HelpCircle className="h-4 w-4 mr-1" />
              Suggerimento
            </Button>
          )}
        </div>
        <p className="text-base font-medium leading-snug mt-2">{question.text}</p>
        {hintVisible && question.hint && (
          <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 mt-2 italic">
            {question.hint}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {renderInput()}
        <div className="flex justify-between pt-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={isFirst}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Indietro
          </Button>
          <Button size="sm" onClick={onNext} disabled={!isAnswered}>
            {isLast ? 'Completa' : 'Avanti'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
