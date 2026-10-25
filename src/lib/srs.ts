/**
 * Spaced repetition: one FSRS engine for every kind of item (cards, exercise
 * skills, mistakes, philo notions, SES plans...). Pure functions; persistence
 * lives in db/repo.ts.
 */
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs';
import type { SrsState } from '../types';

export type Grade4 = 1 | 2 | 3 | 4;

export const GRADE_LABELS: Record<Grade4, string> = { 1: 'À revoir', 2: 'Difficile', 3: 'Bien', 4: 'Facile' };

export interface SrsParams {
  desiredRetention: number;
  maxIntervalDays: number;
}

function toCard(s: SrsState): Card {
  return {
    ...s,
    due: new Date(s.due),
    last_review: s.last_review !== undefined ? new Date(s.last_review) : undefined,
  } as Card;
}

function fromCard(c: Card): SrsState {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? c.last_review.getTime() : undefined,
  };
}

export function newSrsState(now: number = Date.now()): SrsState {
  return fromCard(createEmptyCard(new Date(now)));
}

function scheduler(p: SrsParams) {
  return fsrs(
    generatorParameters({
      request_retention: p.desiredRetention,
      // cap so early chapters keep coming back before June
      maximum_interval: p.maxIntervalDays,
      enable_fuzz: false,
    }),
  );
}

export function review(state: SrsState, grade: Grade4, now: number, p: SrsParams): SrsState {
  const f = scheduler(p);
  const rating = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy][grade - 1] as Grade;
  const next = fromCard(f.next(toCard(state), new Date(now), rating).card);
  const maxMs = p.maxIntervalDays * 86_400_000;
  if (next.due - now > maxMs) {
    next.due = now + maxMs;
    next.scheduled_days = p.maxIntervalDays;
  }
  return next;
}

/** Probability of recall right now (1 for new items: nothing to forget yet). */
export function retrievability(state: SrsState, now: number, p: SrsParams): number {
  if (state.reps === 0) return 1;
  return scheduler(p).get_retrievability(toCard(state), new Date(now), false);
}

/** Days until each grade would schedule the item (for button labels). */
export function previewIntervals(state: SrsState, now: number, p: SrsParams): Record<Grade4, number> {
  const out = {} as Record<Grade4, number>;
  for (const g of [1, 2, 3, 4] as Grade4[]) {
    const next = review(state, g, now, p);
    out[g] = (next.due - now) / 86_400_000;
  }
  return out;
}

/**
 * Map an exercise outcome to a grade.
 * wrong or solution seen -> Again; hints -> Hard; correct -> Good; correct and
 * well under the target time without hints -> Easy.
 */
export function gradeFromOutcome(o: {
  correct: boolean;
  hintsUsed: number;
  sawSolution?: boolean;
  timeMs: number;
  targetMs?: number;
}): Grade4 {
  if (!o.correct || o.sawSolution) return 1;
  if (o.hintsUsed > 0) return 2;
  if (o.targetMs && o.timeMs > o.targetMs * 1.5) return 2;
  if (o.targetMs && o.timeMs < o.targetMs * 0.4) return 4;
  return 3;
}

export function formatInterval(days: number): string {
  if (days < 1 / 24) return `${Math.max(1, Math.round(days * 1440))} min`;
  if (days < 1) return `${Math.round(days * 24)} h`;
  if (days < 30) return `${Math.round(days)} j`;
  return `${Math.round(days / 30)} mois`;
}
