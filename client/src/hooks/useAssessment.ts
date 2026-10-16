import { useReducer, useCallback } from 'react';
import {
  buildQuestionForm,
  selectQuestionsForMode,
  shuffleArray,
  FORM_IDS,
  TEST_MODES,
  type AssessQuestion,
  type FormId,
  type TestMode,
} from '@/lib/assessQuestions';
import { calculateResults, type AssessReport } from '@/lib/assessScoring';

export type AssessPhase = 'intro' | 'running' | 'complete';

export interface AssessMeta {
  name: string;
  role: string;
  area: string;
  selfSkill: number | null;
  testModeId: string;
}

export interface AssessState {
  phase: AssessPhase;
  currentIndex: number;
  answers: Record<string, unknown>;
  hintsVisible: Record<string, boolean>;
  meta: AssessMeta;
  formId: FormId;
  questions: AssessQuestion[];
  report: AssessReport | null;
}

type AssessAction =
  | { type: 'START'; meta: AssessMeta; formId: FormId; questions: AssessQuestion[] }
  | { type: 'ANSWER'; questionId: string; value: unknown }
  | { type: 'TOGGLE_HINT'; questionId: string }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'COMPLETE'; report: AssessReport }
  | { type: 'RESET' };

const DEFAULT_META: AssessMeta = {
  name: '',
  role: '',
  area: '',
  selfSkill: null,
  testModeId: 'complete',
};

const INITIAL_STATE: AssessState = {
  phase: 'intro',
  currentIndex: 0,
  answers: {},
  hintsVisible: {},
  meta: DEFAULT_META,
  formId: 'A',
  questions: [],
  report: null,
};

function assessReducer(state: AssessState, action: AssessAction): AssessState {
  switch (action.type) {
    case 'START':
      return {
        ...INITIAL_STATE,
        phase: 'running',
        meta: action.meta,
        formId: action.formId,
        questions: action.questions,
      };
    case 'ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
      };
    case 'TOGGLE_HINT':
      return {
        ...state,
        hintsVisible: {
          ...state.hintsVisible,
          [action.questionId]: !state.hintsVisible[action.questionId],
        },
      };
    case 'NEXT':
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
      };
    case 'PREV':
      return {
        ...state,
        currentIndex: Math.max(state.currentIndex - 1, 0),
      };
    case 'COMPLETE':
      return {
        ...state,
        phase: 'complete',
        report: action.report,
      };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

function selectNextFormId(): FormId {
  const stored = localStorage.getItem('assess_form_cycle');
  let remaining: FormId[] = [];
  let last: FormId | null = null;
  try {
    const parsed = stored ? JSON.parse(stored) : {};
    remaining = Array.isArray(parsed.remaining) ? parsed.remaining.filter((id: string) => FORM_IDS.includes(id as FormId)) : [];
    last = FORM_IDS.includes(parsed.last) ? parsed.last : null;
  } catch { /* noop */ }

  if (!remaining.length) {
    remaining = shuffleArray([...FORM_IDS]);
    if (last && remaining[0] === last) {
      const alt = remaining.findIndex(id => id !== last);
      if (alt > 0) [remaining[0], remaining[alt]] = [remaining[alt], remaining[0]];
    }
  }

  const selected = remaining.shift() ?? 'A';
  try {
    localStorage.setItem('assess_form_cycle', JSON.stringify({ remaining, last: selected }));
  } catch { /* noop */ }
  return selected as FormId;
}

export function useAssessment() {
  const [state, dispatch] = useReducer(assessReducer, INITIAL_STATE);

  const startAssessment = useCallback((meta: AssessMeta) => {
    const mode: TestMode = TEST_MODES.find(m => m.id === meta.testModeId) ?? TEST_MODES[0];
    const formId = selectNextFormId();
    const allQuestions = buildQuestionForm(formId);
    const questions = selectQuestionsForMode(allQuestions, mode);
    dispatch({ type: 'START', meta, formId, questions });
  }, []);

  const answer = useCallback((questionId: string, value: unknown) => {
    dispatch({ type: 'ANSWER', questionId, value });
  }, []);

  const toggleHint = useCallback((questionId: string) => {
    dispatch({ type: 'TOGGLE_HINT', questionId });
  }, []);

  const goNext = useCallback(() => {
    const { currentIndex, questions, answers, meta } = state;
    if (currentIndex < questions.length - 1) {
      dispatch({ type: 'NEXT' });
    } else {
      // Complete
      const mode = TEST_MODES.find(m => m.id === meta.testModeId) ?? TEST_MODES[0];
      const isCompleteMode = mode.id === 'complete';
      const report = calculateResults(
        questions,
        answers,
        {
          name: meta.name,
          role: meta.role,
          area: meta.area,
          selfSkill: meta.selfSkill,
          testMode: meta.testModeId,
          completedAt: new Date().toISOString(),
          formId: state.formId,
          language: 'it',
        },
        isCompleteMode,
      );
      dispatch({ type: 'COMPLETE', report });
    }
  }, [state]);

  const goPrev = useCallback(() => {
    dispatch({ type: 'PREV' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const currentQuestion = state.questions[state.currentIndex] ?? null;
  const currentAnswer = currentQuestion ? state.answers[currentQuestion.id] : undefined;
  const isHintVisible = currentQuestion ? !!state.hintsVisible[currentQuestion.id] : false;
  const isAnswered = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
  const answeredCount = state.questions.filter(q => {
    const a = state.answers[q.id];
    return a !== undefined && a !== null && a !== '';
  }).length;
  const progress = state.questions.length > 0 ? answeredCount / state.questions.length : 0;

  return {
    state,
    currentQuestion,
    currentAnswer,
    isHintVisible,
    isAnswered,
    answeredCount,
    progress,
    startAssessment,
    answer,
    toggleHint,
    goNext,
    goPrev,
    reset,
  };
}
