import { describe, expect, it } from 'vitest';
import { compile } from '../../lib/expr';
import { equaDiff, expLnEquations, integrale, limiteFonction, lnDecomposition, primitives, suiteArithGeo, suiteLimite, tvi } from './analyse';
import { forAll, near } from '../testutil';

const N = 150;
const ev = (s: string, v: Record<string, number>) => compile(s).evaluate(v);

describe('analyse — vérifications indépendantes', () => {
  it('suite arithmético-géométrique: iterate the recurrence', () => {
    forAll(suiteArithGeo, N, (q) => {
      const m = q.meta as Record<string, number> & { kind: string; lim: number | string };
      const seq = [m.u0];
      for (let i = 0; i < 60; i++) seq.push(m.a * seq[i] + m.b);
      if (m.kind === 'term') expect(near(seq[3], m.ans, 1e-9)).toBe(true);
      if (m.kind === 'formula' && q.answer.kind === 'expr') {
        for (let n = 0; n <= 10; n++) expect(near(ev(q.answer.expected, { n }), seq[n], 1e-9)).toBe(true);
      }
      if (m.kind === 'limit') {
        const last = seq[60];
        if (typeof m.lim === 'number') expect(Math.abs(last - m.lim)).toBeLessThan(1e-3);
        else expect(m.lim === 'inf' ? last > 1e6 : last < -1e6).toBe(true);
      }
    });
  });

  it('limits of sequences: evaluate far away', () => {
    forAll(suiteLimite, N, (q) => {
      const m = q.meta as { num?: string; den?: string; lim: number | string; kind: string; q?: number; c?: number; k?: number };
      const val = (n: number) => (m.kind === 'geo' ? m.c! * m.q! ** n + m.k! : ev(m.num!, { n }) / ev(m.den!, { n }));
      const big = m.kind === 'exp-poly' ? 300 : m.kind === 'geo' ? 200 : 1e7;
      const v = val(big);
      if (typeof m.lim === 'number') expect(Math.abs(v - m.lim)).toBeLessThan(1e-3);
      else expect(m.lim === 'inf' ? v > 1e5 : v < -1e5).toBe(true);
    });
  });

  it('limits of functions: evaluate near the point / far away', () => {
    forAll(limiteFonction, N, (q) => {
      const m = q.meta as { f: string; at: number; lim: number | string };
      const v = ev(m.f, { x: m.at });
      if (typeof m.lim === 'number') expect(Math.abs(v - m.lim)).toBeLessThan(1e-3);
      // logarithmic divergence is slow: |v| > 20 at the probe point is enough evidence
      else expect(m.lim === 'inf' ? v > 20 : v < -20).toBe(true);
    });
  });

  it('TVI: bracket / approximation / number of roots by sign changes', () => {
    forAll(tvi, N, (q) => {
      const m = q.meta as Record<string, number> & { kind: string };
      if (m.kind === 'count') {
        const f = (x: number) => x ** 3 - 3 * m.a ** 2 * x + m.k;
        // count roots: sign changes on a fine grid + double roots at critical points
        // simple roots: sign changes on a fine grid away from a double root; double roots: f(c) = 0 at a critical point
        const doubles = [-m.a, m.a].filter((c) => f(c) === 0);
        let count = doubles.length;
        const step = 1e-3;
        for (let x = -20; x < 20; x += step) {
          if (doubles.some((c) => Math.abs(x - c) < 0.05)) continue;
          if (f(x) * f(x + step) < 0) count++;
        }
        expect(count).toBe(m.count);
      } else {
        const f = (x: number) => x ** 3 + m.p * x + m.q;
        expect(Math.abs(f(m.alpha))).toBeLessThan(1e-9);
        if (m.kind === 'bracket') expect(f(m.ans) < 0 && f(m.ans + 1) > 0).toBe(true);
      }
    });
  });

  it('exp / ln equations: substitute the solution', () => {
    forAll(expLnEquations, N, (q) => {
      const m = q.meta as Record<string, number> & { kind: string };
      const x = m.x;
      if (m.kind === 'exp-exp') expect(near(Math.exp(m.a * x + m.b), Math.exp(m.c))).toBe(true);
      if (m.kind === 'exp') expect(near(Math.exp(m.a * x + m.b), m.k, 1e-9)).toBe(true);
      if (m.kind === 'ln') expect(near(Math.log(m.a * x + m.b), m.k, 1e-9) || Math.abs(Math.log(m.a * x + m.b) - m.k) < 1e-9).toBe(true);
      if (m.kind === 'quadexp') {
        expect(Math.abs(Math.exp(2 * x) - (m.p + m.q) * Math.exp(x) + m.p * m.q)).toBeLessThan(1e-9);
        expect(x).toBeCloseTo(Math.log(Math.max(m.p, m.q)), 12);
      }
    });
  });

  it('ln decomposition: a ln2 + b ln3 equals the logarithm', () => {
    forAll(lnDecomposition, N, (q) => {
      const m = q.meta as { val: number; half: boolean; A: number; B: number };
      const lhs = m.half ? Math.log(Math.sqrt(m.val)) : Math.log(m.val);
      expect(near(lhs, m.A * Math.log(2) + m.B * Math.log(3), 1e-12)).toBe(true);
    });
  });

  it("primitives: F' = f numerically", () => {
    forAll(primitives, N, (q) => {
      const m = q.meta as { f: string; F: string; domain: [number, number] };
      for (let i = 0; i < 5; i++) {
        const x = m.domain[0] + ((m.domain[1] - m.domain[0]) * (i + 0.5)) / 5;
        const h = 1e-5;
        const d = (ev(m.F, { x: x + h }) - ev(m.F, { x: x - h })) / (2 * h);
        expect(Math.abs(d - ev(m.f, { x }))).toBeLessThan(1e-4 * Math.max(1, Math.abs(d)));
      }
    });
  });

  it('integrals: Simpson rule', () => {
    forAll(integrale, N, (q) => {
      const m = q.meta as { a: number; b: number; f: string; val: number };
      const f = compile(m.f);
      const fx = (x: number) => f.evaluate({ x });
      const n = 2000;
      const h = (m.b - m.a) / n;
      let s = fx(m.a) + fx(m.b);
      for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * fx(m.a + i * h);
      expect(Math.abs((s * h) / 3 - m.val)).toBeLessThan(1e-7);
    });
  });

  it("differential equations: f' - a f - b = 0 and f(0) = y0", () => {
    forAll(equaDiff, N, (q) => {
      const m = q.meta as Record<string, number>;
      if (q.answer.kind !== 'expr') throw new Error();
      const f = (x: number) => ev((q.answer as { expected: string }).expected, { x });
      expect(near(f(0), m.y0, 1e-12)).toBe(true);
      for (const x of [-0.7, 0.2, 0.9]) {
        const d = (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;
        expect(Math.abs(d - m.a * f(x) - m.b)).toBeLessThan(1e-4);
      }
    });
  });
});
