import { describe, expect, it } from 'vitest';
import { compile } from '../../lib/expr';
import { derivCalcul, derivConvexite, derivTangente, derivVariations } from './derivation';
import { forAll, near } from '../testutil';

const N = 150;
const numDeriv = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);

describe('dérivation — vérification numérique', () => {
  it("f' matches the numeric derivative of f", () => {
    forAll(derivCalcul, N, (q) => {
      const { f, d, domain } = q.meta as { f: string; d: string; domain: [number, number] };
      const F = compile(f);
      const D = compile(d);
      for (let i = 0; i < 6; i++) {
        const x = domain[0] + ((domain[1] - domain[0]) * (i + 0.5)) / 6;
        const nd = numDeriv((t) => F.evaluate({ x: t }), x);
        const v = D.evaluate({ x });
        expect(Math.abs(nd - v), `${f} at ${x}: ${nd} vs ${v}`).toBeLessThan(1e-4 * Math.max(1, Math.abs(v)));
      }
    });
  });

  it('tangent line touches the curve with the right slope', () => {
    forAll(derivTangente, N, (q) => {
      const { f, a, slope, p } = q.meta as { f: string; a: number; slope: number; p: number };
      const F = compile(f);
      const fx = (x: number) => F.evaluate({ x });
      expect(near(fx(a), slope * a + p, 1e-9)).toBe(true);
      expect(Math.abs(numDeriv(fx, a) - slope)).toBeLessThan(1e-5);
    });
  });

  it('inflection point: second derivative changes sign there', () => {
    forAll(derivConvexite, N, (q) => {
      const m = q.meta as { kind: string; a: number; b: number; c: number; e: number; xi: number; f?: string };
      const fx = m.f ? (x: number) => compile(m.f!).evaluate({ x }) : (x: number) => m.a * x ** 3 + m.b * x ** 2 + m.c * x + m.e;
      const d2 = (x: number) => (fx(x + 1e-3) - 2 * fx(x) + fx(x - 1e-3)) / 1e-6;
      expect(Math.sign(d2(m.xi - 0.3))).toBe(-Math.sign(d2(m.xi + 0.3)));
      if (m.kind === 'cubic-interval') expect(d2(m.xi + 1) > 0).toBe(m.a > 0);
    });
  });

  it('local extremum found by scanning', () => {
    forAll(derivVariations, N, (q) => {
      const m = q.meta as { a: number; b2: number; b1: number; e: number; askMax: boolean; askValue: boolean; xAns: number; ans: number };
      const f = (x: number) => m.a * x ** 3 + m.b2 * x ** 2 + m.b1 * x + m.e;
      // local extremum: neighbours on both sides are lower (max) or higher (min)
      const h = 0.01;
      if (m.askMax) expect(f(m.xAns) > f(m.xAns - h) && f(m.xAns) > f(m.xAns + h)).toBe(true);
      else expect(f(m.xAns) < f(m.xAns - h) && f(m.xAns) < f(m.xAns + h)).toBe(true);
      expect(Number.isInteger(m.b2)).toBe(true);
      if (m.askValue) expect(m.ans).toBe(f(m.xAns));
    });
  });
});
