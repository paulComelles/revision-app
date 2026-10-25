/** Mastery estimates from attempts (time-decayed Beta posterior). */
import type { Attempt } from '../types';

const DAY = 86_400_000;
export const HALF_LIFE_DAYS = 21;

export interface SkillStat {
  key: string;
  attempts: number;
  correct: number;
  /** time-decayed accuracy with a weak prior, 0..1 */
  mastery: number;
  /** total decayed weight (how much evidence) */
  weight: number;
  avgTimeMs: number;
  lastAt: number;
}

export function masteryFrom(list: Attempt[], now: number, prior = 0.4, priorWeight = 2): SkillStat {
  let w = 0;
  let wc = 0;
  let correct = 0;
  let time = 0;
  let lastAt = 0;
  for (const a of list) {
    const age = Math.max(0, (now - a.at) / DAY);
    const k = 0.5 ** (age / HALF_LIFE_DAYS);
    // hints reduce the credit of a correct answer
    const credit = a.correct ? (a.hintsUsed > 0 ? 0.5 : 1) : 0;
    w += k;
    wc += k * credit;
    if (a.correct) correct++;
    time += a.timeMs;
    lastAt = Math.max(lastAt, a.at);
  }
  return {
    key: '',
    attempts: list.length,
    correct,
    mastery: (wc + prior * priorWeight) / (w + priorWeight),
    weight: w,
    avgTimeMs: list.length ? time / list.length : 0,
    lastAt,
  };
}

export function groupStats(attempts: Attempt[], keyOf: (a: Attempt) => string, now: number): Map<string, SkillStat> {
  const groups = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const k = keyOf(a);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(a);
  }
  const out = new Map<string, SkillStat>();
  for (const [k, list] of groups) out.set(k, { ...masteryFrom(list, now), key: k });
  return out;
}

const RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];

/**
 * Sequential single-hue ramp: low mastery recedes toward the surface, high
 * mastery is the strongest step (reversed on a dark surface). No data = neutral.
 */
export function masteryColor(m: number | undefined, dark = false): string {
  if (m === undefined) return 'rgba(148,163,184,0.18)';
  const i = Math.round(Math.max(0, Math.min(1, m)) * (RAMP.length - 1));
  return dark ? RAMP[RAMP.length - 1 - i] : RAMP[i];
}

export const MASTERY_RAMP = RAMP;
