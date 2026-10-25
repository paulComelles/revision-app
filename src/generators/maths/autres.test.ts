import { describe, expect, it } from 'vitest';
import { binom, binomiale, denombrement, espace } from './autres';
import { forAll, near } from '../testutil';

const N = 120;

/** enumerate all 2^n outcomes of n Bernoulli(p) trials */
function bruteBinomial(n: number, p: number, pred: (succ: number) => boolean): number {
  let total = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let s = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s++;
    if (pred(s)) total += p ** s * (1 - p) ** (n - s);
  }
  return total;
}

function* combinations(n: number, k: number, start = 0, acc: number[] = []): Generator<number[]> {
  if (acc.length === k) {
    yield acc;
    return;
  }
  for (let i = start; i < n; i++) yield* combinations(n, k, i + 1, [...acc, i]);
}

describe('géométrie dans l’espace — substitution', () => {
  it('orthogonality, plane, intersection', () => {
    forAll(espace, N, (q) => {
      const m = q.meta as Record<string, number & number[]> & { kind: string };
      if (m.kind === 'ortho') expect(near(m.u[0] * m.m + m.u[1] * m.v2 + m.u[2] * m.v3, 0, 1e-12)).toBe(true);
      if (m.kind === 'plane') expect(m.n[0] * m.A[0] + m.n[1] * m.A[1] + m.n[2] * m.A[2] + m.d).toBe(0);
      if (m.kind === 'intersection') {
        // I is on the plane and on the line
        expect(m.nrm[0] * m.I[0] + m.nrm[1] * m.I[1] + m.nrm[2] * m.I[2] + m.d).toBe(0);
        for (let i = 0; i < 3; i++) expect(m.I[i]).toBe(m.P0[i] + m.t0 * m.dir[i]);
        // the line is not parallel to the plane (unique intersection)
        expect(m.nrm[0] * m.dir[0] + m.nrm[1] * m.dir[1] + m.nrm[2] * m.dir[2]).not.toBe(0);
      }
    });
  });
});

describe('loi binomiale — énumération exhaustive des issues', () => {
  it('probabilities, expectation and variance', () => {
    forAll(binomiale, N, (q) => {
      const m = q.meta as { kind: string; n: number; p: number; k: number; value: number };
      let exp: number;
      if (m.kind === 'eq') exp = bruteBinomial(m.n, m.p, (s) => s === m.k);
      else if (m.kind === 'le') exp = bruteBinomial(m.n, m.p, (s) => s <= m.k);
      else if (m.kind === 'ge') exp = bruteBinomial(m.n, m.p, (s) => s >= m.k);
      else if (m.kind === 'atleast1') exp = bruteBinomial(m.n, m.p, (s) => s >= 1);
      else {
        const mean = bruteBinomial(m.n, m.p, () => true) && Array.from({ length: m.n + 1 }, (_, s) => s * bruteBinomial(m.n, m.p, (x) => x === s)).reduce((a, b) => a + b, 0);
        if (m.kind === 'esp') exp = mean;
        else exp = Array.from({ length: m.n + 1 }, (_, s) => (s - mean) ** 2 * bruteBinomial(m.n, m.p, (x) => x === s)).reduce((a, b) => a + b, 0);
      }
      expect(Math.abs(exp - m.value)).toBeLessThan(1e-9);
    });
  });
});

describe('dénombrement — énumération', () => {
  it('counts match brute-force enumeration', () => {
    forAll(denombrement, N, (q) => {
      const m = q.meta as Record<string, number> & { kind: string };
      let count = 0;
      if (m.kind === 'uplets') count = m.n ** m.k; // product rule, checked below for small cases
      if (m.kind === 'perm' || m.kind === 'arr') {
        const k = m.kind === 'perm' ? m.n : m.k;
        const rec = (used: Set<number>, depth: number): number => (depth === k ? 1 : Array.from({ length: m.n }, (_, i) => i).filter((i) => !used.has(i)).reduce((s, i) => s + rec(new Set([...used, i]), depth + 1), 0));
        count = rec(new Set(), 0);
      }
      if (m.kind === 'comb') count = [...combinations(m.n, m.k)].length;
      if (m.kind === 'atleast') count = [...combinations(m.n, m.k)].filter((c) => c.some((i) => i < m.a)).length;
      if (m.kind === 'subsets') count = Array.from({ length: m.n + 1 }, (_, k) => [...combinations(m.n, k)].length).reduce((a, b) => a + b, 0);
      if (m.kind === 'uplets' && m.n ** m.k <= 50000) {
        let c = 0;
        const rec = (depth: number) => {
          if (depth === m.k) {
            c++;
            return;
          }
          for (let i = 0; i < m.n; i++) rec(depth + 1);
        };
        rec(0);
        count = c;
      }
      expect(count).toBe(m.v);
    });
  });
  it('binom helper', () => {
    expect(binom(5, 2)).toBe(10);
    expect(binom(12, 0)).toBe(1);
    expect(binom(3, 4)).toBe(0);
  });
});
