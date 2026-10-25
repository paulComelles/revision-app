/** Domain types shared across the app. */

export type SubjectId = 'maths' | 'expertes' | 'ses' | 'philo' | 'hg' | 'sat';

export const SUBJECTS: Record<SubjectId, { label: string; short: string; lang: 'fr' | 'en'; color: string }> = {
  maths: { label: 'Maths spé', short: 'Maths', lang: 'fr', color: '#3987e5' },
  expertes: { label: 'Maths expertes', short: 'Expertes', lang: 'fr', color: '#d95926' },
  ses: { label: 'SES', short: 'SES', lang: 'fr', color: '#199e70' },
  philo: { label: 'Philosophie', short: 'Philo', lang: 'fr', color: '#c98500' },
  hg: { label: 'Histoire-Géo', short: 'HG', lang: 'fr', color: '#d55181' },
  sat: { label: 'SAT Math', short: 'SAT', lang: 'en', color: '#9085e9' },
};

export const SUBJECT_IDS = Object.keys(SUBJECTS) as SubjectId[];

export type ErrorType = 'calcul' | 'methode' | 'cours' | 'lecture' | 'temps' | 'etourderie';

export const ERROR_TYPES: Record<ErrorType, { fr: string; en: string }> = {
  calcul: { fr: 'Calcul', en: 'Calculation' },
  methode: { fr: 'Méthode', en: 'Method' },
  cours: { fr: 'Cours non su', en: "Didn't know the content" },
  lecture: { fr: "Lecture de l'énoncé", en: 'Misread the question' },
  temps: { fr: 'Temps', en: 'Time' },
  etourderie: { fr: 'Étourderie', en: 'Careless slip' },
};

export const ERROR_TYPE_IDS = Object.keys(ERROR_TYPES) as ErrorType[];

export type ChapterStatus = 'todo' | 'current' | 'done';

export interface Chapter {
  id: string;
  subject: SubjectId;
  title: string;
  order: number;
  status: ChapterStatus;
  /** SES only: is this chapter on the written bac exam? null = not set yet */
  onBac?: boolean | null;
  /** false = scaffolded from the official programme, "à vérifier" */
  verified: boolean;
}

/** Serialized FSRS card (dates as epoch ms so JSON export is lossless). */
export interface SrsState {
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: number;
}

export type SrsKind =
  | 'card'
  | 'exercise'
  | 'mistake'
  | 'philo-notion'
  | 'ses-plan'
  | 'checklist'
  | 'qb'
  | 'hg-event';

export interface SrsItem {
  id: string;
  kind: SrsKind;
  subject: SubjectId;
  chapterId?: string;
  /** what it points to: content id, generator id, mistake id, qb id... */
  refId: string;
  title: string;
  srs: SrsState;
  due: number;
  createdAt: number;
  suspended?: boolean;
}

export interface ReviewLogEntry {
  id?: number;
  itemId: string;
  at: number;
  rating: 1 | 2 | 3 | 4;
  subject: SubjectId;
}

export type AttemptSource = 'session' | 'practice' | 'trajet' | 'mock' | 'spr' | 'mistake' | 'review';

export interface Attempt {
  id?: number;
  at: number;
  subject: SubjectId;
  chapterId?: string;
  /** SAT skill id or bac chapter id */
  skill: string;
  generatorId: string;
  seed: number;
  difficulty: string;
  format: string;
  correct: boolean;
  timeMs: number;
  hintsUsed: number;
  source: AttemptSource;
  timed?: boolean;
}

export interface Mistake {
  id: string;
  createdAt: number;
  subject: SubjectId;
  chapterId?: string;
  skill?: string;
  origin: 'auto' | 'manual';
  /** generated question reference, for retry / similar question */
  generatorId?: string;
  seed?: number;
  difficulty?: string;
  format?: string;
  /** snapshot for display (Markdown + TeX) */
  prompt: string;
  userAnswer?: string;
  correctAnswer?: string;
  errorType: ErrorType;
  note?: string;
  photoId?: string;
  resolved: boolean;
  /** consecutive successful reviews */
  reviewStreak?: number;
  /** College Board Question Bank reference */
  qbId?: string;
}

export interface Photo {
  id: string;
  blob: Blob;
  createdAt: number;
}

export interface FocusSession {
  id?: number;
  subject: SubjectId;
  start: number;
  end: number;
  minutes: number;
  label?: string;
  kind: 'focus' | 'session' | 'trajet' | 'mock' | 'drill';
}

export interface ExamDate {
  id: string;
  label: string;
  /** YYYY-MM-DD */
  date: string;
  subjects: SubjectId[];
}

export type DayPreference = 'any' | 'weekend';

export interface Settings {
  id: 'settings';
  sessionMinutes: 15 | 30 | 45;
  dayPreference: Record<SubjectId, DayPreference>;
  /** base weight per subject (0 = ignore, 1 = normal, 2 = high) */
  subjectWeight: Record<SubjectId, number>;
  examDates: ExamDate[];
  theme: 'dark' | 'light' | 'system';
  desiredRetention: number;
  maxIntervalDays: number;
  focusMinutes: number;
  breakMinutes: number;
  dailyGoalMinutes: number;
  /** SAT difficulty mix: share of hard questions in practice (0..1) */
  satHardShare: number;
  lastBackupAt?: number;
}

export type QbResult = 'right' | 'wrong' | 'reviewed' | 'todo';

export interface QbEntry {
  id: string;
  /** College Board question ID (as printed in the PDF) */
  questionId: string;
  pdf: string;
  number?: number;
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
  result: QbResult;
  errorType?: ErrorType;
  note?: string;
  createdAt: number;
  history: { at: number; result: QbResult }[];
}

export interface MockResult {
  id?: number;
  at: number;
  module1Correct: number;
  module2Correct: number;
  module2Level: 'easier' | 'harder';
  total: number;
  bandLow: number;
  bandHigh: number;
  byDomain: Record<string, { correct: number; total: number }>;
}

export interface BlurtResult {
  id?: number;
  at: number;
  subject: SubjectId;
  chapterId: string;
  checklistId: string;
  text: string;
  recalled: string[];
  total: number;
  selfGrade: 1 | 2 | 3 | 4;
  minutes: number;
}

export interface DrillLog {
  id?: number;
  at: number;
  subject: SubjectId;
  kind: string;
  refId?: string;
  score?: number;
  max?: number;
  minutes?: number;
  notes?: string;
}

export interface AudioClip {
  id: string;
  createdAt: number;
  blob: Blob;
  label: string;
  durationSec: number;
}
