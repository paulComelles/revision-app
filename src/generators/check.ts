/** Answer checking for every AnswerSpec kind. */
import { checkSpr, sprAcceptedForms } from '../lib/spr';
import { checkExpression, close, compile, equivalentFn, parseNumberFr, tryCompile } from '../lib/expr';
import type { AnswerSpec, FieldSpec, Question } from './types';

export interface CheckResult {
  /** false = the input could not be read (show message, don't count as wrong) */
  valid: boolean;
  correct: boolean;
  message?: string;
  /** for MCQ: error type attached to the chosen distractor */
  distractorError?: string;
}

const INF_RE = /^\+?(inf|infini|∞|\+∞|infinity)$/i;
const MINF_RE = /^-(inf|infini|∞|infinity)$/i;

function numberWithin(input: string, value: number, tol: number): CheckResult {
  const v = parseNumberFr(input);
  if (Number.isNaN(v)) return { valid: false, correct: false, message: 'Nombre non reconnu (ex. 2,5 ou 5/2 ou ln(3)).' };
  return { valid: true, correct: Math.abs(v - value) <= tol + 1e-12 };
}

function checkField(f: FieldSpec, input: string): CheckResult {
  if (input.trim() === '') return { valid: false, correct: false, message: `Champ « ${f.label} » vide.` };
  switch (f.kind) {
    case 'number':
      return numberWithin(input, f.value, f.tolerance);
    case 'expr':
      return checkExpression(input, f.expected, { variable: f.variable, domain: f.domain, integer: f.integer });
    case 'mod': {
      const v = parseNumberFr(input);
      if (!Number.isInteger(v)) return { valid: false, correct: false, message: 'Entier attendu.' };
      const md = (a: number) => ((a % f.modulus) + f.modulus) % f.modulus;
      return { valid: true, correct: md(v) === md(f.value) };
    }
  }
}

/** Antiderivative check: derivative of the input must equal f (any constant). */
function checkAntiderivative(input: string, expected: string, variable: string, domain: [number, number]): CheckResult {
  const c = tryCompile(input);
  if (!c.ok) return { valid: false, correct: false, message: c.message };
  const extra = c.expr.vars.filter((v) => v !== variable);
  if (extra.length) return { valid: false, correct: false, message: `Variable inattendue : ${extra.join(', ')}` };
  const F = (x: number) => c.expr.evaluate({ [variable]: x });
  const ref = compile(expected);
  const Fref = (x: number) => ref.evaluate({ [variable]: x });
  // F - Fref must be constant on the domain: compare differences
  const x0 = domain[0] + (domain[1] - domain[0]) * 0.37;
  const k = F(x0) - Fref(x0);
  return { valid: true, correct: Number.isFinite(k) && equivalentFn((x) => F(x) - k, Fref, { domain }) };
}

export function checkAnswer(spec: AnswerSpec, inputs: string[]): CheckResult {
  switch (spec.kind) {
    case 'mcq': {
      const idx = Number(inputs[0]);
      if (!Number.isInteger(idx) || idx < 0 || idx >= spec.choices.length)
        return { valid: false, correct: false, message: 'Choose an option.' };
      return { valid: true, correct: idx === spec.correct, distractorError: spec.choices[idx].errorType };
    }
    case 'spr':
      return checkSpr(inputs[0] ?? '', spec.values);
    case 'number':
      return numberWithin(inputs[0] ?? '', spec.value, spec.tolerance);
    case 'expr':
      if (spec.mode === 'antiderivative') return checkAntiderivative(inputs[0] ?? '', spec.expected, spec.variable, spec.domain);
      return checkExpression(inputs[0] ?? '', spec.expected, { variable: spec.variable, domain: spec.domain, integer: spec.integer });
    case 'limit': {
      const s = (inputs[0] ?? '').trim().replace(/\s/g, '').replace(/[−–]/g, '-');
      if (s === '') return { valid: false, correct: false, message: 'Réponse vide.' };
      if (INF_RE.test(s)) return { valid: true, correct: spec.value === 'inf' };
      if (MINF_RE.test(s)) return { valid: true, correct: spec.value === '-inf' };
      const v = parseNumberFr(s);
      if (Number.isNaN(v)) return { valid: false, correct: false, message: 'Écris un nombre, +inf ou -inf.' };
      return { valid: true, correct: typeof spec.value === 'number' && close(v, spec.value, 1e-6, 1e-9) };
    }
    case 'fields': {
      let all = true;
      for (let i = 0; i < spec.fields.length; i++) {
        const r = checkField(spec.fields[i], inputs[i] ?? '');
        if (!r.valid) return r;
        if (!r.correct) all = false;
      }
      return { valid: true, correct: all };
    }
    case 'custom': {
      if (inputs.length < spec.fields.length || inputs.some((s) => s.trim() === ''))
        return { valid: false, correct: false, message: 'Remplis tous les champs.' };
      try {
        return { valid: true, correct: spec.checker(inputs) };
      } catch (e) {
        return { valid: false, correct: false, message: e instanceof Error ? e.message : 'Réponse illisible.' };
      }
    }
  }
}

export function checkQuestion(q: Question, inputs: string[]): CheckResult {
  return checkAnswer(q.answer, inputs);
}

/** Number as a perfect student would type it (never in exponent notation). */
function plainNumber(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(12).replace(/\.?0+$/, '');
}

/** Inputs that a perfect student would type (used by tests to prove each question is solvable). */
export function canonicalInputs(q: Question): string[] {
  const a = q.answer;
  switch (a.kind) {
    case 'mcq':
      return [String(a.correct)];
    case 'spr':
      return [sprAcceptedForms(a.values[0])[0] ?? ''];
    case 'number':
      return [plainNumber(a.value)];
    case 'expr':
      return [a.expected];
    case 'limit':
      return [a.value === 'inf' ? '+inf' : a.value === '-inf' ? '-inf' : String(a.value)];
    case 'fields':
      return a.fields.map((f) => (f.kind === 'expr' ? f.expected : plainNumber(f.value)));
    case 'custom':
      return (q.meta.canonical as string[]) ?? [];
  }
}
