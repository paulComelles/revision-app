/**
 * Generic checks run on EVERY generator, many seeds, every difficulty/format:
 * deterministic output, the computed answer passes the checker, MCQ options are
 * 4 distinct values with exactly one correct, no NaN/undefined leaks in text.
 * Each generator family also has its own test file that verifies the maths
 * independently (substitution, numeric derivatives, brute force…).
 */
import { describe, expect, it } from 'vitest';
import { GENERATORS } from './index';
import { canonicalInputs, checkQuestion } from './check';
import type { Question } from './types';

const SEEDS = Number((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.GEN_SEEDS ?? 120);

function textOf(q: Question): string {
  const parts = [q.prompt, q.answerDisplay, ...q.hints, ...q.solution];
  if (q.answer.kind === 'mcq') parts.push(...q.answer.choices.map((c) => c.text));
  if (q.figure?.kind === 'table') parts.push(...q.figure.headers, ...q.figure.rows.flat());
  return parts.join('\n');
}

describe('all generators', () => {
  it('ids are unique', () => {
    const ids = GENERATORS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const g of GENERATORS) {
    describe(g.id, () => {
      for (const d of g.difficulties) {
        for (const f of g.formats) {
          it(`${d}/${f}: ${SEEDS} seeds are valid and self-consistent`, () => {
            for (let seed = 1; seed <= SEEDS; seed++) {
              const q = g.generate(seed, d, f);
              const ctx = `${g.id} seed=${seed} ${d}/${f}`;
              expect(q.format, ctx).toBe(f);
              const text = textOf(q);
              expect(text, ctx).not.toMatch(/NaN|undefined|Infinity|\[object/);
              expect(q.prompt.length, ctx).toBeGreaterThan(10);
              expect(q.hints).toHaveLength(2);
              expect(q.solution.length, ctx).toBeGreaterThan(0);
              // determinism
              expect(JSON.stringify(g.generate(seed, d, f)), ctx).toBe(JSON.stringify(q));
              // the computed answer is accepted
              const r = checkQuestion(q, canonicalInputs(q));
              expect(r.valid && r.correct, `${ctx} canonical answer ${JSON.stringify(canonicalInputs(q))} rejected: ${r.message ?? ''}`).toBe(true);
              if (q.answer.kind === 'mcq') {
                const a = q.answer;
                expect(a.choices, ctx).toHaveLength(4);
                expect(new Set(a.choices.map((c) => c.text)).size, `${ctx} duplicate choices ${a.choices.map((c) => c.text).join(' | ')}`).toBe(4);
                for (let i = 0; i < 4; i++) if (i !== a.correct) expect(checkQuestion(q, [String(i)]).correct, ctx).toBe(false);
              }
              if (q.answer.kind === 'spr') {
                expect(canonicalInputs(q)[0].length, ctx).toBeGreaterThan(0);
              }
              // the concept hint must never state the final answer ("= answer")
              if (q.answer.kind === 'spr' && typeof q.answer.values[0] !== 'number' && q.answer.values[0].n !== 0) {
                const v = q.answer.values[0];
                const re = new RegExp(`=\\s*${v.n < 0 ? '-' : ''}${Math.abs(v.n)}${v.d === 1 ? '' : `/${v.d}`}(?![0-9./])`);
                expect(re.test(q.hints[0]), `${ctx} answer stated in hint 1: ${q.hints[0]}`).toBe(false);
              }
            }
          });
        }
      }
    });
  }
});
