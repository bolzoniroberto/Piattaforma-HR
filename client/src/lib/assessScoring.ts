import type { AssessQuestion, AssessOption, LikertOption } from './assessQuestions';
import { LIKERT_OPTIONS } from './assessQuestions';

export type ProfileLabel = 'Champion' | 'Expert' | 'Curious' | 'Beginner' | 'Profilo tematico';

export interface DimensionScores {
  literacy: number | null;
  fluency: number | null;
  mindset: number | null;
  delegation: number | null;
  description: number | null;
  discernment: number | null;
  diligence: number | null;
  overall: number | null;
  execution: number | null;
  technical: number | null;
  agents: number | null;
}

export interface MindsetLens {
  label: string;
  text: string;
}

export interface CalibrationResult {
  label: string;
  text: string;
}

export interface AnswerDetail {
  id: string;
  sourceId: string;
  formId: string | null;
  section: string;
  dimension: string;
  sub: string;
  type: string;
  question: string;
  answer: string;
  answerText: string;
  score: number;
  feedback: string;
}

export interface WeakArea {
  area: string;
  score: number;
  action: string;
}

export interface Recommendations {
  profile: string[];
  weakest: WeakArea[];
  strongest: WeakArea[];
}

export interface SelfComparisonItem {
  key: string;
  label: string;
  declared: number | null;
  measured: number | null;
  gap: number | null;
}

export interface AssessReport {
  meta: {
    name: string;
    role: string;
    area: string;
    selfSkill: number | null;
    testMode: string;
    completedAt: string;
    formId: string;
    language: string;
  };
  score: DimensionScores;
  profile: ProfileLabel;
  mindsetLens: MindsetLens;
  calibrationGap: number | null;
  calibration: CalibrationResult;
  answers: AnswerDetail[];
  recommendations: Recommendations;
  selfComparison: SelfComparisonItem[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pctFromValues(values: number[]): number {
  if (!values.length) return 0;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.round(((avg - 1) / 4) * 100);
}

function pctOrNull(values: number[]): number | null {
  if (!values.length) return null;
  return pctFromValues(values);
}

function averagePresent(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (!present.length) return null;
  return Math.round(present.reduce((s, v) => s + v, 0) / present.length);
}

export function scoreMultiAnswer(question: AssessQuestion, rawAnswer: unknown): number {
  if (!Array.isArray(rawAnswer) || !question.options) return 1;
  const options = question.options;
  const earned = rawAnswer.reduce((sum: number, idx: unknown) => {
    const opt = options[Number(idx)];
    return opt ? sum + Math.max(0, opt.score) : sum;
  }, 0);
  const maxPossible = options.reduce((sum: number, opt: AssessOption) => sum + Math.max(0, opt.score), 0);
  if (maxPossible === 0) return 1;
  return clamp(Math.round((earned / maxPossible) * 4 + 1), 1, 5);
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9àáâãäåæçèéêëìíîïðñòóôõöùúûüý\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function scoreTextAnswer(question: AssessQuestion, rawAnswer: unknown): number {
  if (!question.rubric || typeof rawAnswer !== 'string' || !rawAnswer.trim()) return 1;
  const text = normalizeText(rawAnswer);
  const { criteria, redFlags } = question.rubric;
  let earned = 0;
  let maxPoints = 0;
  for (const criterion of criteria) {
    maxPoints += criterion.points;
    if (criterion.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      earned += criterion.points;
    }
  }
  let penalty = 0;
  for (const flag of redFlags) {
    if (flag.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      penalty += flag.points;
    }
  }
  if (maxPoints === 0) return 1;
  const raw = Math.max(0, earned - penalty) / maxPoints;
  return clamp(Math.round(raw * 4 + 1), 1, 5);
}

export function answerScore(question: AssessQuestion, rawAnswer: unknown): number {
  if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '') return 1;
  if (question.type === 'likert') {
    const val = Number(rawAnswer);
    return Number.isFinite(val) ? clamp(val, 1, 5) : 1;
  }
  if (question.type === 'multi') return scoreMultiAnswer(question, rawAnswer);
  if (question.type === 'text') return scoreTextAnswer(question, rawAnswer);
  // scenario, knowledge, choice — option-indexed
  const idx = Number(rawAnswer);
  if (question.options && Number.isFinite(idx) && question.options[idx]) {
    return clamp(question.options[idx].score, 1, 5);
  }
  return 1;
}

export function getMindsetLens(score: number | null): MindsetLens {
  if (typeof score !== 'number') return { label: 'Non misurato', text: "Questa modalità non include abbastanza domande Mindset per produrre una lente dedicata." };
  if (score < 40) return { label: 'Cauto / resistente', text: "L'adozione richiede casi d'uso concreti, rischio basso e accompagnamento ravvicinato." };
  if (score < 60) return { label: 'Pragmatico ma incerto', text: "C'è apertura, ma servono obiettivi chiari, regole e risultati misurabili." };
  if (score < 80) return { label: 'Aperto e gestibile', text: "Buona predisposizione alla sperimentazione controllata e al miglioramento del workflow." };
  return { label: 'Propulsivo', text: "Forte propensione a sperimentare, condividere e guidare l'adozione se sostenuta da metodo e governance." };
}

export function getCalibration(gap: number | null): CalibrationResult {
  if (typeof gap !== 'number') return { label: 'Non disponibile', text: "La calibrazione richiede sia risposte dichiarative sia prove comportamentali nella stessa modalità." };
  if (gap >= 18) return { label: 'Autovalutazione alta rispetto alle prove', text: "Le risposte dichiarative sono più forti delle scelte comportamentali e delle prove pratiche. Conviene lavorare su esercizi guidati, rubriche e verifica degli output." };
  if (gap <= -18) return { label: 'Prove migliori dell\'autovalutazione', text: "La persona tende a sottostimarsi o è prudente nel dichiarare competenza. Conviene valorizzare esempi pratici già corretti e trasformarli in metodo." };
  return { label: 'Autovalutazione coerente', text: "Le risposte dichiarative, gli scenari e le prove pratiche sono abbastanza allineati." };
}

export function classifyProfile(literacy: number | null, fluency: number | null): ProfileLabel {
  if (literacy === null || fluency === null) return 'Profilo tematico';
  const highLiteracy = literacy >= 60;
  const highFluency = fluency >= 60;
  if (highLiteracy && highFluency) return 'Champion';
  if (highLiteracy && !highFluency) return 'Expert';
  if (!highLiteracy && highFluency) return 'Curious';
  return 'Beginner';
}

export function calculateResults(
  questions: AssessQuestion[],
  answers: Record<string, unknown>,
  meta: AssessReport['meta'],
  isCompleteMode: boolean,
): AssessReport {
  const buckets: Record<string, number[]> = {
    literacy: [], mindset: [], delegation: [], description: [], discernment: [], diligence: [],
  };
  const typeBuckets: Record<string, number[]> = { likert: [], scenario: [], practical: [], behavioral: [], technical: [] };
  const sectionBuckets: Record<string, number[]> = { agents: [] };
  const answeredDetails: AnswerDetail[] = [];
  const practicalTypes = ['multi', 'text', 'choice'];

  for (const q of questions) {
    const raw = answers[q.id];
    const score = answerScore(q, raw);
    const bucketKey = q.dimension === 'fluency' ? (q.sub ?? q.dimension) : q.dimension;
    if (buckets[bucketKey]) buckets[bucketKey].push(score);

    const typeKey = q.type === 'knowledge' ? 'technical' : (practicalTypes.includes(q.type) ? 'practical' : q.type);
    if (!typeBuckets[typeKey]) typeBuckets[typeKey] = [];
    typeBuckets[typeKey].push(score);
    if (q.section === 'AI Agents') sectionBuckets.agents.push(score);
    if (q.type !== 'likert' && q.type !== 'knowledge') typeBuckets.behavioral.push(score);

    let answer = '';
    let answerText = '';
    if (q.type === 'likert') {
      const selected = LIKERT_OPTIONS.find(opt => opt.value === Number(raw));
      answer = selected?.title ?? '';
      answerText = selected?.text ?? '';
    } else if (q.type === 'multi') {
      const selectedOptions = Array.isArray(raw) ? (raw as number[]).map(idx => q.options?.[idx]).filter(Boolean) as AssessOption[] : [];
      answer = selectedOptions.map(opt => opt.title).join(' | ');
      answerText = selectedOptions.map(opt => opt.text).join(' | ');
    } else if (q.type === 'text') {
      answer = 'Risposta testuale';
      answerText = String(raw ?? '').trim();
    } else {
      const selected = q.options?.[Number(raw)];
      answer = selected?.title ?? '';
      answerText = selected?.text ?? '';
    }

    answeredDetails.push({
      id: q.id,
      sourceId: q.sourceId ?? q.id,
      formId: q.formId ?? meta.formId ?? null,
      section: q.section,
      dimension: q.dimension,
      sub: q.sub ?? q.dimension,
      type: q.type,
      question: q.text,
      answer,
      answerText,
      score,
      feedback: q.feedback ?? '',
    });
  }

  const score: DimensionScores = {
    literacy: pctOrNull(buckets.literacy),
    mindset: pctOrNull(buckets.mindset),
    delegation: pctOrNull(buckets.delegation),
    description: pctOrNull(buckets.description),
    discernment: pctOrNull(buckets.discernment),
    diligence: pctOrNull(buckets.diligence),
    fluency: null,
    overall: null,
    execution: pctOrNull(typeBuckets.practical),
    technical: pctOrNull(typeBuckets.technical),
    agents: pctOrNull(sectionBuckets.agents),
  };

  score.fluency = averagePresent([score.delegation, score.description, score.discernment, score.diligence]);

  if (isCompleteMode) {
    const lit = score.literacy ?? 0;
    const flu = score.fluency ?? 0;
    const min = score.mindset ?? 0;
    score.overall = Math.round(lit * 0.35 + flu * 0.45 + min * 0.20);
  } else {
    score.overall = pctFromValues(answeredDetails.map(item => item.score));
  }

  const profile: ProfileLabel = isCompleteMode
    ? classifyProfile(score.literacy, score.fluency)
    : 'Profilo tematico';

  const mindsetLens = getMindsetLens(score.mindset);

  const likertPct = pctOrNull(typeBuckets.likert);
  const behavioralPct = pctOrNull(typeBuckets.behavioral);
  const calibrationGap = typeof likertPct === 'number' && typeof behavioralPct === 'number'
    ? Math.round(likertPct - behavioralPct)
    : null;
  const calibration = getCalibration(calibrationGap);

  const selfComparison: SelfComparisonItem[] = [];

  const dimActions: Record<string, string> = {
    literacy: 'Rafforzare fondamenti, limiti, fonti, dati, privacy e differenza tra output plausibile e verificato.',
    technical: 'Consolidare token, generazione autoregressiva, addestramento, inferenza, Transformer, allucinazioni, RAG ed embedding.',
    agents: 'Chiarire obiettivi, strumenti, permessi, approvazioni umane, log, memoria, criteri di stop e rollback.',
    delegation: 'Mappare quali parti del lavoro sono delegabili, quali richiedono controllo umano e quali non vanno delegate.',
    description: 'Usare brief strutturati con contesto, vincoli, esempi, formato atteso e criteri di qualità.',
    discernment: 'Introdurre checklist di valutazione, controllo fonti, confronto alternative e revisione proporzionata al rischio.',
    diligence: 'Chiarire dati ammessi, responsabilità finale, trasparenza d\'uso, compliance e tracciabilità.',
    mindset: 'Lavorare su sperimentazioni a basso rischio, fiducia calibrata e condivisione di pratiche utili.',
  };

  const profileActions: Record<ProfileLabel, string[]> = {
    Beginner: [
      'Iniziare con casi d\'uso pratici, a basso rischio e con risultati immediatamente verificabili.',
      'Introdurre concetti base: limiti, allucinazioni, dati, fonti, privacy e responsabilità finale.',
      'Usare template semplici e checklist di verifica per ridurre incertezza sullo strumento.',
    ],
    Curious: [
      'Rafforzare la Literacy: fonti, limiti del modello, RAG, privacy, controllo dati e citazioni.',
      'Trasformare l\'uso spontaneo in workflow documentati e ripetibili.',
      'Introdurre verifica sistematica degli output prima dell\'uso in contesti a impatto.',
    ],
    Expert: [
      'Sviluppare la Fluency: delegation, descrizione del brief, discernimento e diligence.',
      'Tradurre la comprensione teorica in pratiche operative con criteri, esempi e checklist.',
      'Sperimentare su casi reali, misurare i risultati e documentare cosa funziona.',
    ],
    Champion: [
      'Guidare l\'adozione nel team con casi d\'uso, policy e pratiche condivise.',
      'Estendere le competenze agli AI Agents: perimetro, strumenti, log, rollback e supervisione.',
      'Costruire processi di valutazione continua per mantenere la competenza aggiornata.',
    ],
    'Profilo tematico': [
      'Usare questo risultato come diagnosi mirata, non come profilo globale.',
      'Rivedere le risposte a punteggio basso e trasformarle in esempi o checklist operative.',
      'Completare il test completo quando serve una lettura comparabile su Literacy, Fluency e Mindset.',
    ],
  };

  const dimScores = [
    ['Literacy', score.literacy, dimActions.literacy],
    ['Fondamenti tecnici', score.technical, dimActions.technical],
    ['AI Agents', score.agents, dimActions.agents],
    ['Delegation', score.delegation, dimActions.delegation],
    ['Description', score.description, dimActions.description],
    ['Discernment', score.discernment, dimActions.discernment],
    ['Diligence', score.diligence, dimActions.diligence],
    ['Mindset', score.mindset, dimActions.mindset],
  ].filter(([, s]) => typeof s === 'number') as [string, number, string][];

  dimScores.sort((a, b) => a[1] - b[1]);

  const recommendations: Recommendations = {
    profile: profileActions[profile] ?? profileActions['Profilo tematico'],
    weakest: dimScores.slice(0, 2).map(([area, s, action]) => ({ area, score: s, action })),
    strongest: dimScores.slice(-2).reverse().map(([area, s]) => ({ area, score: s, action: 'Usare questa area come leva per sostenere il miglioramento delle aree più deboli.' })),
  };

  return {
    meta: { ...meta, completedAt: new Date().toISOString() },
    score,
    profile,
    mindsetLens,
    calibrationGap,
    calibration,
    answers: answeredDetails,
    recommendations,
    selfComparison,
  };
}

export function buildCsvExport(report: AssessReport): string {
  const rows = [['sourceId', 'section', 'dimension', 'type', 'question', 'answer', 'score', 'feedback']];
  for (const a of report.answers) {
    rows.push([a.sourceId, a.section, a.dimension, a.type, `"${a.question.replace(/"/g, '""')}"`, `"${a.answer.replace(/"/g, '""')}"`, String(a.score), `"${a.feedback.replace(/"/g, '""')}"`]);
  }
  return rows.map(r => r.join(',')).join('\n');
}
