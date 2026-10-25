import type { Frac } from '../lib/fraction';
import type { Generator, Question } from './types';

export const val = (x: unknown): number => {
  if (typeof x === 'number') return x;
  const f = x as Frac;
  return f.n / f.d;
};

/** The numeric value of the correct answer (SPR or numeric MCQ). */
export function answerValue(q: Question): number {
  if (q.answer.kind === 'spr') return val(q.answer.values[0]);
  if (q.answer.kind === 'number') return q.answer.value;
  throw new Error('answerValue: not numeric');
}

/** Run every (seed, difficulty, format) combination. */
export function forAll(g: Generator, n: number, fn: (q: Question) => void) {
  for (const d of g.difficulties)
    for (const f of g.formats)
      for (let seed = 1; seed <= n; seed++) fn(g.generate(seed, d, f));
}

export const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
