import type { SubjectId } from './types';

/** Tools shown on each subject page. */
export interface SubjectTool {
  subject: SubjectId;
  to: string;
  label: string;
  desc: string;
  icon: string;
}

export const SUBJECT_TOOLS: SubjectTool[] = [
  { subject: 'sat', to: '/sat', icon: '🧭', label: 'SAT dashboard', desc: 'Skills from the College Board Question Bank' },
  { subject: 'sat', to: '/sat/practice', icon: '🎯', label: 'Adaptive practice', desc: 'Weighted to your weak skills' },
  { subject: 'sat', to: '/sat/spr', icon: '⌨️', label: 'SPR trainer', desc: 'Typed answers only' },
  { subject: 'sat', to: '/sat/mock', icon: '⏱️', label: 'Mock test', desc: '2 adaptive modules' },
  { subject: 'sat', to: '/sat/qb', icon: '📄', label: 'Question Bank tracker', desc: 'Your PDF questions' },
  { subject: 'maths', to: '/maths/recurrence', icon: '🪜', label: 'Récurrence', desc: 'Remettre dans l’ordre, compléter, rédiger' },
];
