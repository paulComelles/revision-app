import { describe, expect, it } from 'vitest';
import { satInequalities, satLinearFunctions, satLinearOne, satLinearTwo, satSystems, satSystemsCount } from './algebra';
import { answerValue, forAll, near, val } from '../testutil';
import type { Question } from '../types';

const N = 150;
/** For SPR questions, the stored answer is checked; MCQ shares the same builder. */
const sprOnly = (fn: (q: Question) => void) => (q: Question) => {
  if (q.format === 'spr') fn(q);
};

describe('SAT algebra — answers verified independently', () => {
  it('linear equations in one variable: substitution', () => {
    forAll(
      satLinearOne,
      N,
      sprOnly((q) => {
        const M = q.meta as Record<string, number & { n: number; d: number }>;
        const x = answerValue(q);
        if (M.type === ('distribute' as never)) expect(near(M.a * (x + M.b), M.c * x + M.e)).toBe(true);
        if (M.type === ('fraction' as never)) expect(near((x + M.a) / M.p, (x - M.b) / M.q)).toBe(true);
        if (M.type === ('nosolution' as never)) {
          // with this k the x-coefficients cancel and the constants differ -> no solution
          expect(near(x + M.b, M.c)).toBe(true);
          expect(near(-x * M.a, M.e)).toBe(false);
        }
        if (M.type === ('expression' as never)) {
          const xs = val(M.x);
          expect(near(M.p * xs + M.q, val(M.r))).toBe(true);
          expect(near(M.n * M.p * xs + M.s, x)).toBe(true);
        }
      }),
    );
  });

  it('linear functions', () => {
    forAll(
      satLinearFunctions,
      N,
      sprOnly((q) => {
        const M = q.meta as Record<string, number>;
        const v = answerValue(q);
        if (M.type === ('two-values' as never)) expect(v).toBe(M.m * M.x3 + M.b);
        if (M.type === ('context' as never)) expect(v).toBe(M.start - M.rate * M.t);
        if (M.type === ('composition' as never)) expect(v).toBe(M.a * (M.p * M.k + M.q) + M.b);
        if (M.type === ('intercept' as never)) {
          // the x-intercept is collinear with the two given points
          const cross = (M.x2 - M.x1) * (0 - M.y1) - (M.y2 - M.y1) * (v - M.x1);
          expect(near(cross, 0)).toBe(true);
        }
      }),
    );
  });

  it('lines in two variables', () => {
    forAll(
      satLinearTwo,
      N,
      sprOnly((q) => {
        const M = q.meta as Record<string, number>;
        const v = answerValue(q);
        if (M.type === ('standard-slope' as never)) {
          // two points on the line give this slope
          const y = (x: number) => (M.c - M.a * x) / M.b;
          expect(near(y(1) - y(0), v)).toBe(true);
        }
        if (M.type === ('point-on-line' as never)) expect(near(M.a * M.x0 + M.b * v, M.c)).toBe(true);
        if (M.type === ('context' as never)) expect(M.p1 * M.n1 + M.p2 * v).toBe(M.total);
        if (M.type === ('perpendicular' as never) || M.type === ('parallel' as never)) {
          const s = val(M.slope);
          expect(near(s * M.x0 + v, M.y0)).toBe(true);
          const base = -M.a / M.b;
          if (M.type === ('parallel' as never)) expect(near(s, base)).toBe(true);
          else expect(near(s * base, -1)).toBe(true);
        }
      }),
    );
  });

  it('systems: substitute the solution back', () => {
    forAll(satSystems, N, (q) => {
      const M = q.meta as Record<string, number>;
      if (M.type === ('tickets' as never)) {
        expect(M.na + M.nc).toBe(M.N);
        expect(M.pa * M.na + M.pc * M.nc).toBe(M.R);
        if (q.format === 'spr') expect(answerValue(q)).toBe(M.na);
        return;
      }
      const x = val(M.x);
      const y = val(M.y);
      expect(near(M.a * x + M.b * y, M.c)).toBe(true);
      expect(near(M.d * x + M.e * y, M.g)).toBe(true);
      if (q.format === 'spr') {
        const v = answerValue(q);
        if (M.type === ('combo' as never)) expect(near(v, M.p * x + M.q * y)).toBe(true);
        else {
          const ask = M.ask as unknown as string;
          const exp = ask === 'x' ? x : ask === 'y' ? y : ask === 'x+y' ? x + y : x - y;
          expect(near(v, exp)).toBe(true);
        }
      }
    });
  });

  it('systems with 0 / 1 / infinitely many solutions: determinant and consistency', () => {
    forAll(satSystemsCount, N, (q) => {
      const M = q.meta as Record<string, number>;
      if (M.type === ('count' as never)) {
        const det = M.a * M.e - M.b * M.d;
        const ans = M.answer as unknown as string;
        if (ans === 'one') expect(det).not.toBe(0);
        else {
          expect(det).toBe(0);
          // consistent iff the constants are in the same ratio
          const consistent = M.a * M.g === M.d * M.c && M.b * M.g === M.e * M.c;
          expect(consistent).toBe(ans === 'infinite');
        }
        return;
      }
      if (q.format !== 'spr') return;
      const v = answerValue(q);
      if (M.type === ('none-k' as never)) {
        // k x + t b y = r parallel to a x + b y = c, distinct
        expect(near(v * M.b, M.a * M.t * M.b)).toBe(true);
        expect(M.r).not.toBe(M.t * M.c);
      }
      if (M.type === ('infinite' as never)) {
        expect(M.k * M.a).toBe(M.t * M.a * M.b);
        expect(M.r * M.a).toBe(M.t * M.a * M.c);
        expect(v).toBe(M.value);
      }
    });
  });

  it('inequalities: brute force', () => {
    forAll(satInequalities, N, (q) => {
      const M = q.meta as Record<string, unknown>;
      if (M.type === 'point') {
        const { m1, b1, m2, b2 } = M as Record<string, number>;
        const ok = (p: [number, number]) => p[1] > m1 * p[0] + b1 && p[1] < m2 * p[0] + b2;
        expect(ok(M.good as [number, number])).toBe(true);
        for (const p of M.others as [number, number][]) expect(ok(p)).toBe(false);
        return;
      }
      if (q.format !== 'spr') return;
      const v = answerValue(q);
      if (M.type === 'budget') {
        const { fee, rate, budget } = M as Record<string, number>;
        expect(fee + rate * v).toBeLessThanOrEqual(budget);
        expect(fee + rate * (v + 1)).toBeGreaterThan(budget);
      }
      if (M.type === 'greatest') {
        const { a, b, c, e } = M as Record<string, number>;
        const sat = (x: number) => a * x + b < c * x + e;
        expect(sat(v)).toBe(true);
        expect(sat(v - 1)).toBe(false);
      }
    });
  });
});
