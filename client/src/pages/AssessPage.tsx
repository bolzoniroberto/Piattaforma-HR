import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useAssessment } from '@/hooks/useAssessment';
import PageHeader from '@/components/PageHeader';
import AssessIntro from '@/components/assess/AssessIntro';
import AssessProgress from '@/components/assess/AssessProgress';
import AssessQuestionCard from '@/components/assess/AssessQuestionCard';
import AssessResults from '@/components/assess/AssessResults';
import AssessHistory from '@/components/assess/AssessHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AssessPage() {
  const {
    state,
    currentQuestion,
    currentAnswer,
    isHintVisible,
    isAnswered,
    answeredCount,
    startAssessment,
    answer,
    toggleHint,
    goNext,
    goPrev,
    reset,
  } = useAssessment();

  const saveResult = useMutation({
    mutationFn: async (payload: object) => {
      return apiRequest('POST', '/api/assess/results', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assess/results'] });
    },
  });

  useEffect(() => {
    if (state.phase === 'complete' && state.report && !saveResult.isPending && !saveResult.isSuccess) {
      const report = state.report;
      saveResult.mutate({
        completedAt: report.meta.completedAt,
        formId: report.meta.formId,
        language: report.meta.language,
        profileLabel: report.profile,
        literacyScore: report.score.literacy,
        fluencyScore: report.score.fluency,
        mindsetScore: report.score.mindset,
        overallScore: report.score.overall,
        rawPayload: JSON.stringify(report),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.report]);

  if (state.phase === 'running' && currentQuestion) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <PageHeader
          context="Assess"
          title="Valutazione in corso"
        />
        <AssessProgress
          current={state.currentIndex}
          total={state.questions.length}
          answered={answeredCount}
          section={currentQuestion.section}
        />
        <AssessQuestionCard
          question={currentQuestion}
          answer={currentAnswer}
          hintVisible={isHintVisible}
          onAnswer={v => answer(currentQuestion.id, v)}
          onToggleHint={() => toggleHint(currentQuestion.id)}
          onNext={goNext}
          onPrev={goPrev}
          isFirst={state.currentIndex === 0}
          isLast={state.currentIndex === state.questions.length - 1}
        />
      </div>
    );
  }

  if (state.phase === 'complete' && state.report) {
    return (
      <div className="space-y-4">
        <PageHeader
          context="Assess"
          title="Risultati"
          description={`Completato il ${new Date(state.report.meta.completedAt).toLocaleDateString('it-IT')}`}
        />
        <AssessResults report={state.report} onReset={reset} />
      </div>
    );
  }

  // Intro phase
  return (
    <div className="space-y-6">
      <PageHeader
        context="Assess"
        title="Competenze GenAI"
        description="Valuta il tuo livello di competenza sull'intelligenza artificiale generativa"
      />
      <Tabs defaultValue="start">
        <TabsList>
          <TabsTrigger value="start">Nuova valutazione</TabsTrigger>
          <TabsTrigger value="history">Storico</TabsTrigger>
        </TabsList>
        <TabsContent value="start" className="mt-4">
          <AssessIntro onStart={startAssessment} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <AssessHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
