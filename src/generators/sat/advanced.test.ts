import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/rng';
import {
  literalTemplates,
  satDiscriminant,
  satExpand,
  satExponential,
  satExponents,
  satQuadRoots,
  satQuadVertex,
  satRadical,
  satTransform,
} from './advanced';
import { answerValue, forAll, near, val } from '../testutil';

const N = 150;
type M = Record<string, number>;

/** brute-force extremum of a function on a fine grid */
function extremum(fn: (x: number) => number, max: boolean) {
  let best = max ? -Infinity : Infinity;
  let bx = 0;
  for (let x = -40; x <= 40; x += 0.001) {
    const y = fn(x);
    if (max ? y > best : y < best) {
      best = y;
      bx = x;
    }
  }
  return { x: bx, y: best };
}

describe('SAT advanced math — answers verified independently', () => {
  it('quadratic vertex: numeric minimum/maximum search', () => {
    forAll(satQuadVertex, 40, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { form: string };
      const fn =
        m.form === 'vertex'
          ? (x: number) => m.a * (x - m.h) ** 2 + m.k
          : m.form === 'factored'
            ? (x: number) => m.a * (x - m.p) * (x - m.q)
            : (x: number) => m.a * x * x + m.b * x + m.c;
      const e = extremum(fn, m.a < 0);
      const v = answerValue(q);
      expect(near(v, e.y, 1e-4) || Math.abs(v - e.x) < 1e-2).toBe(true);
    });
  });

  it('exponential models', () => {
    forAll(satExponential, N, (q) => {
      const m = q.meta as M & { kind: string; up: boolean };
      if (q.format !== 'spr') return;
      const v = answerValue(q);
      if (m.kind === 'doubling') {
        // simulate period by period
        let mass = m.P0;
        for (let t = 1; t <= m.n * m.k; t++) if (t % m.k === 0) mass = m.up ? mass * 2 : mass / 2;
        expect(near(v, mass)).toBe(true);
      }
      if (m.kind === 'two-points') expect(v).toBe(m.a * m.b ** m.x3);
    });
  });

  it('transformations: evaluate g from the table', () => {
    forAll(satTransform, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string; cols: number[]; vals: number[] };
      const fval = (x: number) => {
        const i = m.cols.indexOf(x);
        if (i < 0) throw new Error('outside table');
        return m.vals[i];
      };
      const g = (x: number) => m.c * fval(x - m.h) + m.k;
      const v = answerValue(q);
      if (m.kind === 'evaluate') expect(v).toBe(g(m.x0));
      else {
        expect(g(v)).toBe(m.target);
        // unique: no other table input gives the same value
        const hits = m.cols.map((x) => x + m.h).filter((x) => g(x) === m.target);
        expect(hits).toEqual([v]);
      }
    });
  });

  it('discriminant: count real roots numerically', () => {
    forAll(satDiscriminant, N, (q) => {
      const m = q.meta as M & { kind: string; correct: string };
      if (m.kind === 'count') {
        const disc = m.b * m.b - 4 * m.a * m.c;
        const expected = disc > 0 ? 'Exactly two' : disc === 0 ? 'Exactly one' : 'Zero';
        expect(m.correct).toBe(expected);
        return;
      }
      if (q.format !== 'spr') return;
      const v = answerValue(q);
      if (m.kind === 'one-c') expect(m.b * m.b - 4 * v).toBe(0);
      if (m.kind === 'one-k') expect(near(m.b * m.b - 4 * v * m.c, 0)).toBe(true);
    });
  });

  it('quadratic roots and systems: substitution', () => {
    forAll(satQuadRoots, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string };
      const v = answerValue(q);
      if (m.kind === 'positive-root') {
        expect(m.a * v * v + m.b * v + m.c).toBe(0);
        expect(v).toBeGreaterThan(0);
      }
      if (m.kind === 'sum') {
        const disc = m.b * m.b - 4 * m.a * m.c;
        const r1 = (-m.b + Math.sqrt(disc)) / (2 * m.a);
        const r2 = (-m.b - Math.sqrt(disc)) / (2 * m.a);
        expect(near(v, r1 + r2)).toBe(true);
      }
      if (m.kind === 'system') {
        const x = Math.max(m.x1, m.x2);
        expect(x * x + m.p * x + m.q).toBe(m.m * x + m.n);
        expect(v).toBe(m.m * x + m.n);
      }
      if (m.kind === 'system-k') {
        const b = m.c0 - m.m;
        expect(near(b * b - 4 * v, 0)).toBe(true);
      }
    });
  });

  it('radical / rational equations: substitution and extraneous root', () => {
    forAll(satRadical, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string };
      const x = answerValue(q);
      if (m.kind === 'radical') {
        expect(near(Math.sqrt(x + m.a), x - m.b)).toBe(true);
        // the other root of the squared equation is extraneous
        expect(m.s + m.a).toBeGreaterThanOrEqual(0);
        expect(near(Math.sqrt(m.s + m.a), m.s - m.b)).toBe(false);
      } else {
        expect(near(m.a / (x + m.b), m.c / (x + m.e))).toBe(true);
      }
    });
  });

  it('expand / equivalent expressions: numeric identity', () => {
    forAll(satExpand, N, (q) => {
      const m = q.meta as M & { kind: string };
      for (const x of [-2.3, 0.7, 3.1]) {
        if (m.kind === 'expand' || m.kind === 'expand-mcq') expect(near((m.a * x + m.b) * (m.c * x + m.e), m.A * x * x + m.B * x + m.C)).toBe(true);
        if (m.kind === 'diff-squares') expect(near((m.a * x + m.b) ** 2 - (m.a * x - m.b) ** 2, m.k * x)).toBe(true);
        if (m.kind === 'rational') expect(near(m.r / (x + m.p) + 1 / (x + m.q), (m.A * x + m.B) / ((x + m.p) * (x + m.q)))).toBe(true);
      }
      if (q.format === 'spr' && m.kind !== 'rational') expect(answerValue(q)).toBe(m.kind === 'diff-squares' ? m.k : m.B);
      if (q.format === 'spr' && m.kind === 'rational') expect(answerValue(q)).toBe(m.B);
    });
  });

  it('literal equations: correct form satisfies the equation, distractors do not', () => {
    for (let s = 1; s <= 50; s++) {
      const rng = createRng(s);
      for (const t of literalTemplates(rng)) {
        for (let trial = 0; trial < 5; trial++) {
          const env: Record<string, number> = {};
          for (const o of t.others) env[o] = 1 + rng.next() * 9;
          if (t.eq.startsWith('\\frac{1}{f}')) env.p = env.f + 1 + rng.next() * 5; // keep q positive
          const [good, ...bad] = t.fns.map((fn) => fn(env));
          expect(near(t.residual({ ...env, [t.target]: good }), 0, 1e-7), t.eq).toBe(true);
          for (const b of bad) expect(Math.abs(t.residual({ ...env, [t.target]: b })) > 1e-6, `${t.eq} distractor`).toBe(true);
        }
      }
    }
  });

  it('exponent rules', () => {
    forAll(satExponents, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string };
      const x = 1.7;
      const k = answerValue(q);
      if (m.kind === 'powers') expect(near(x ** k, (x ** m.a * x ** m.b) / x ** m.c)).toBe(true);
      else expect(near(x ** k, (x ** m.p) ** (1 / m.r1) * Math.sqrt(x ** m.q))).toBe(true);
      expect(val(m.k)).toBe(k);
    });
  });
});
