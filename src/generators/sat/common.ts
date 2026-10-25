import type { Rng } from '../../lib/rng';
import { F, type Frac, frac, toFrac } from '../../lib/fraction';
import type { ErrorType } from '../../types';
import { buildMcq, fr, m, numericMcq } from '../helpers';
import type { AnswerSpec, Format } from '../types';

export interface Distractor {
  v: Frac | number;
  e?: ErrorType;
}

const asNum = (x: Frac | number) => (typeof x === 'number' ? x : F.val(x));

/** TeX of a number that is (close to) a simple fraction */
export function texOf(x: number): string {
  if (Number.isInteger(x)) return `${x}`;
  const f = toFrac(x, 10000);
  if (Math.abs(F.val(f) - x) < 1e-9) return fr(f);
  return `${Math.round(x * 1000) / 1000}`;
}

/**
 * Numeric SAT answer: SPR (exact value) or 4-choice MCQ whose distractors
 * come from common mistakes.
 */
export function numAnswer(
  rng: Rng,
  format: Format,
  value: Frac | number,
  distractors: Distractor[],
  fmt: (x: number) => string = (x) => m(texOf(x)),
): { answer: AnswerSpec; answerDisplay: string } {
  const v = asNum(value);
  const display = fmt(v);
  if (format === 'spr') {
    return { answer: { kind: 'spr', values: [typeof value === 'number' ? (Number.isInteger(value) ? frac(value) : value) : value] }, answerDisplay: display };
  }
  return {
    answer: numericMcq(
      rng,
      v,
      distractors.map((d) => ({ v: asNum(d.v), e: d.e })),
      fmt,
      { integer: Number.isInteger(v) },
    ),
    answerDisplay: display,
  };
}

/** Symbolic MCQ (choices are TeX/Markdown strings). */
export function textMcq(
  rng: Rng,
  correct: string,
  distractors: { t: string; e?: ErrorType }[],
  extra: () => string = () => {
    throw new Error('textMcq: not enough distractors');
  },
): { answer: AnswerSpec; answerDisplay: string } {
  return {
    answer: buildMcq(
      rng,
      { text: correct, key: correct },
      distractors.map((d) => ({ text: d.t, key: d.t, errorType: d.e })),
      () => {
        const t = extra();
        return { text: t, key: t, errorType: 'methode' };
      },
    ),
    answerDisplay: correct,
  };
}

export const dollars = (x: number) => `\\$${Number.isInteger(x) ? x : x.toFixed(2)}`;
