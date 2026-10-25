/**
 * SAT student-produced response (SPR) entry rules, in one tested place.
 *
 * Official directions (digital SAT):
 *  - Enter only one answer, even if several are correct.
 *  - Up to 5 characters for a positive answer, up to 6 (including the minus sign)
 *    for a negative answer.
 *  - A fraction that doesn't fit must be entered as a decimal.
 *  - A decimal that doesn't fit must be truncated or rounded at the fourth digit
 *    (i.e. it must fill the available space: 2/3 -> .6666, .6667, 0.666, 0.667;
 *    0.66 or .67 are NOT accepted).
 *  - Mixed numbers (3 1/2) must be entered as 7/2 or 3.5.
 *  - No symbols such as %, comma or $.
 */
import { type Frac, frac, F } from './fraction';

export type SprCorrect = Frac | number;

export type SprParse =
  | { ok: true; kind: 'integer' | 'decimal' | 'fraction'; value: Frac; text: string }
  | { ok: false; message: string };

export const SPR_MAX_POSITIVE = 5;
export const SPR_MAX_NEGATIVE = 6;

export function parseSpr(raw: string): SprParse {
  const text = raw.trim();
  if (text === '') return { ok: false, message: 'Enter an answer.' };
  if (/\s/.test(text))
    return { ok: false, message: 'No spaces. Enter a mixed number like 3 1/2 as 7/2 or 3.5.' };
  if (text.includes(',')) return { ok: false, message: 'No commas: use a period for decimals (e.g. 0.75).' };
  if (/[%$]/.test(text)) return { ok: false, message: "Don't enter symbols such as % or $." };
  if (text.startsWith('+')) return { ok: false, message: 'Don\'t enter a "+" sign.' };
  if (!/^-?[0-9./]+$/.test(text)) return { ok: false, message: 'Only digits, ".", "/" and a leading "-" are allowed.' };
  const negative = text.startsWith('-');
  const max = negative ? SPR_MAX_NEGATIVE : SPR_MAX_POSITIVE;
  if (text.length > max)
    return {
      ok: false,
      message: negative
        ? `Too long: at most ${SPR_MAX_NEGATIVE} characters for a negative answer (including "-").`
        : `Too long: at most ${SPR_MAX_POSITIVE} characters for a positive answer.`,
    };
  const body = negative ? text.slice(1) : text;
  const sgn = negative ? -1 : 1;
  if (body.includes('/')) {
    const m = /^(\d+)\/(\d+)$/.exec(body);
    if (!m) return { ok: false, message: 'A fraction must be written as integer/integer (e.g. 7/2).' };
    const den = parseInt(m[2], 10);
    if (den === 0) return { ok: false, message: 'The denominator cannot be 0.' };
    return { ok: true, kind: 'fraction', value: frac(sgn * parseInt(m[1], 10), den), text };
  }
  if (body.includes('.')) {
    const m = /^(\d*)\.(\d+)$/.exec(body);
    if (!m) return { ok: false, message: 'Invalid decimal.' };
    const decimals = m[2].length;
    const intPart = m[1] === '' ? 0 : parseInt(m[1], 10);
    const num = intPart * 10 ** decimals + parseInt(m[2], 10);
    return { ok: true, kind: 'decimal', value: frac(sgn * num, 10 ** decimals), text };
  }
  if (!/^\d+$/.test(body)) return { ok: false, message: 'Invalid number.' };
  return { ok: true, kind: 'integer', value: frac(sgn * parseInt(body, 10), 1), text };
}

function eqValue(a: Frac, b: SprCorrect): boolean {
  if (typeof b === 'number') return Math.abs(F.val(a) - b) < 1e-9;
  return F.eq(a, b);
}

/** truncated and rounded values of v with `d` decimals */
function truncRound(v: SprCorrect, d: number): [number, number] {
  const p = 10 ** d;
  let x: number;
  if (typeof v === 'number') x = v;
  else x = v.n / v.d;
  const sgn = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  // exact integer arithmetic when possible
  let t: number;
  let r: number;
  if (typeof v !== 'number') {
    const an = Math.abs(v.n) * p;
    t = Math.floor(an / v.d);
    const rem2 = 2 * (an - t * v.d);
    r = rem2 >= v.d ? t + 1 : t;
  } else {
    t = Math.floor(ax * p + 1e-9);
    r = Math.round(ax * p);
  }
  return [(sgn * t) / p, (sgn * r) / p];
}

export interface SprResult {
  valid: boolean;
  correct: boolean;
  message?: string;
}

/** Check a typed SPR answer against one or more correct values. */
export function checkSpr(raw: string, correct: SprCorrect | SprCorrect[]): SprResult {
  const parsed = parseSpr(raw);
  if (!parsed.ok) return { valid: false, correct: false, message: parsed.message };
  const list = Array.isArray(correct) ? correct : [correct];
  for (const c of list) {
    if (eqValue(parsed.value, c)) return { valid: true, correct: true };
    if (parsed.kind === 'decimal') {
      const negative = parsed.text.startsWith('-');
      const full = parsed.text.length === (negative ? SPR_MAX_NEGATIVE : SPR_MAX_POSITIVE);
      if (full) {
        const d = parsed.text.split('.')[1].length;
        const [t, r] = truncRound(c, d);
        const v = F.val(parsed.value);
        if (Math.abs(v - t) < 1e-9 || Math.abs(v - r) < 1e-9) return { valid: true, correct: true };
      }
    }
  }
  return { valid: true, correct: false };
}

/** Human-readable accepted entries for the solution display. */
export function sprAcceptedForms(c: SprCorrect): string[] {
  const out: string[] = [];
  const x = typeof c === 'number' ? c : c.n / c.d;
  const neg = x < 0;
  const max = neg ? SPR_MAX_NEGATIVE : SPR_MAX_POSITIVE;
  if (typeof c !== 'number') {
    const s = c.d === 1 ? `${c.n}` : `${c.n}/${c.d}`;
    if (s.length <= max) out.push(s);
  }
  // exact or full-width decimals
  const ax = Math.abs(x);
  const intDigits = Math.floor(ax).toString();
  const lead = intDigits === '0' ? ['0', ''] : [intDigits];
  for (const l of lead) {
    const room = max - (neg ? 1 : 0) - l.length - 1;
    if (room < 1) continue;
    const [t, r] = truncRound(c, room);
    for (const v of new Set([t, r])) {
      let s = Math.abs(v).toFixed(room);
      if (l === '') s = s.replace(/^0/, '');
      // drop trailing zeros only if the value is exact
      if (eqValue(frac(Math.round(v * 10 ** room), 10 ** room), c)) s = s.replace(/\.?0+$/, '') || '0';
      const full = (neg ? '-' : '') + s;
      if (!out.includes(full) && checkSpr(full, c).correct) out.push(full);
    }
  }
  return out;
}
