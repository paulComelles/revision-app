/** Formatting and construction helpers shared by all generators. */
import type { Rng } from '../lib/rng';
import { type Frac, fracToTex, toFrac } from '../lib/fraction';
import type { ErrorType } from '../types';
import type { AnswerSpec, Choice } from './types';

export type Lang = 'fr' | 'en';

/** Number to TeX (French decimal comma when lang = fr). */
export function num(x: number, lang: Lang = 'en', maxDecimals = 4): string {
  if (!Number.isFinite(x)) return x > 0 ? '+\\infty' : '-\\infty';
  const r = Math.round(x * 10 ** maxDecimals) / 10 ** maxDecimals;
  let s = Object.is(r, -0) ? '0' : String(r);
  if (s.includes('e')) s = r.toFixed(maxDecimals).replace(/\.?0+$/, '');
  if (Math.abs(r) >= 10000 && Number.isInteger(r)) s = groupThousands(s, lang);
  return lang === 'fr' ? s.replace('.', '{,}') : s;
}

function groupThousands(s: string, lang: Lang): string {
  const neg = s.startsWith('-');
  const digits = neg ? s.slice(1) : s;
  const g = digits.replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'fr' ? '\\,' : '{,}');
  return (neg ? '-' : '') + g;
}

/** Plain-text number (no TeX), e.g. for SPR display. */
export function plain(x: number, lang: Lang = 'en', maxDecimals = 4): string {
  const r = Math.round(x * 10 ** maxDecimals) / 10 ** maxDecimals;
  const s = Object.is(r, -0) ? '0' : String(r);
  return lang === 'fr' ? s.replace('.', ',') : s;
}

/** Fraction or integer as TeX, from a Frac or a number. */
export function fr(x: Frac | number): string {
  if (typeof x === 'number') return Number.isInteger(x) ? `${x}` : fracToTex(toFrac(x));
  return fracToTex(x);
}

/** Wrap negatives in parentheses: (−3) */
export function paren(x: number | string): string {
  const s = typeof x === 'number' ? num(x) : x;
  return s.startsWith('-') ? `(${s})` : s;
}

/** " + 3" / " - 3" for appending a constant term */
export function signed(x: number, lang: Lang = 'en'): string {
  if (x === 0) return '';
  return x < 0 ? ` - ${num(-x, lang)}` : ` + ${num(x, lang)}`;
}

/**
 * Linear combination as TeX: lin([[2,'x'],[-1,'y']], 5) -> "2x - y + 5".
 * Zero terms are skipped; coefficient 1 / -1 are elided.
 */
export function lin(terms: [number, string][], constant = 0, lang: Lang = 'en'): string {
  let out = '';
  for (const [c, v] of terms) {
    if (c === 0) continue;
    const abs = Math.abs(c);
    const coef = abs === 1 && v !== '' ? '' : num(abs, lang);
    if (out === '') out = (c < 0 ? '-' : '') + coef + v;
    else out += (c < 0 ? ' - ' : ' + ') + coef + v;
  }
  if (constant !== 0 || out === '') {
    if (out === '') out = num(constant, lang);
    else out += signed(constant, lang);
  }
  return out;
}

/** Polynomial from coefficients, highest degree first: poly([1,-3,2]) = "x^2 - 3x + 2" */
export function poly(coefs: number[], v = 'x', lang: Lang = 'en'): string {
  const deg = coefs.length - 1;
  const terms: [number, string][] = [];
  let constant = 0;
  coefs.forEach((c, i) => {
    const p = deg - i;
    if (p === 0) constant = c;
    else terms.push([c, p === 1 ? v : `${v}^{${p}}`]);
  });
  return lin(terms, constant, lang);
}

/** Plain-text (parser friendly) polynomial, e.g. for expected answers: "3*x^2-2*x+1" */
export function polyPlain(coefs: number[], v = 'x'): string {
  const deg = coefs.length - 1;
  return coefs
    .map((c, i) => `(${c})*${v}^${deg - i}`)
    .join('+');
}

export interface Option {
  text: string;
  /** uniqueness key (numeric value or normalised text) */
  key: string | number;
  errorType?: ErrorType;
}

function sameKey(a: string | number, b: string | number): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9;
  return a === b;
}

/**
 * Build a 4-option MCQ. Distractors that coincide with the correct answer or
 * with each other are dropped and replaced via `fallback`.
 */
export function buildMcq(
  rng: Rng,
  correct: Option,
  distractors: Option[],
  fallback: (attempt: number) => Option,
  opts: { sortNumeric?: boolean } = {},
): AnswerSpec & { kind: 'mcq' } {
  const chosen: Option[] = [];
  const isFresh = (o: Option) =>
    !sameKey(o.key, correct.key) && !chosen.some((c) => sameKey(c.key, o.key)) && o.text !== correct.text && !chosen.some((c) => c.text === o.text);
  for (const d of distractors) {
    if (chosen.length >= 3) break;
    if (isFresh(d)) chosen.push(d);
  }
  for (let attempt = 0; chosen.length < 3; attempt++) {
    if (attempt > 200) throw new Error('buildMcq: cannot find enough distinct distractors');
    const d = fallback(attempt);
    if (isFresh(d)) chosen.push(d);
  }
  let all: Option[] = [correct, ...chosen];
  if (opts.sortNumeric && all.every((o) => typeof o.key === 'number')) {
    all = all.slice().sort((a, b) => (a.key as number) - (b.key as number));
  } else {
    all = rng.shuffle(all);
  }
  const choices: Choice[] = all.map((o) => ({ text: o.text, errorType: o === correct ? undefined : o.errorType }));
  return { kind: 'mcq', choices, correct: all.indexOf(correct) };
}

/** Numeric MCQ convenience: options are $value$ formatted with `fmt`. */
export function numericMcq(
  rng: Rng,
  value: number,
  distractors: { v: number; e?: ErrorType }[],
  fmt: (v: number) => string,
  opts: { sortNumeric?: boolean; spread?: number; integer?: boolean } = {},
) {
  const spread = opts.spread ?? Math.max(2, Math.abs(value) * 0.25);
  return buildMcq(
    rng,
    { text: fmt(value), key: value },
    distractors.filter((d) => Number.isFinite(d.v)).map((d) => ({ text: fmt(d.v), key: d.v, errorType: d.e })),
    (i) => {
      let v = value + rng.sign() * (1 + rng.int(0, 3 + i)) * (opts.integer === false ? spread / 3 : Math.max(1, Math.round(spread / 3)));
      if (opts.integer !== false && Number.isInteger(value)) v = Math.round(v);
      return { text: fmt(v), key: v, errorType: 'calcul' };
    },
    { sortNumeric: opts.sortNumeric ?? true },
  );
}

/** Wrap TeX for inline display. */
export const m = (tex: string) => `$${tex}$`;
export const dm = (tex: string) => `$$${tex}$$`;

/** Pick a difficulty-dependent value. */
export function byDiff<T>(d: string, medium: T, hard: T, easy?: T): T {
  if (d === 'hard') return hard;
  if (d === 'easy' && easy !== undefined) return easy;
  return medium;
}

/** Fictional names for word problems (no real people). */
export const NAMES_EN = ['Ava', 'Ben', 'Carla', 'Dev', 'Elena', 'Femi', 'Grace', 'Hiro', 'Ines', 'Jamal', 'Kenji', 'Lena', 'Malik', 'Nora', 'Omar', 'Priya'];
