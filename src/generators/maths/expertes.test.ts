import { describe, expect, it } from 'vitest';
import { bezoutGen, complexeCalcul, complexeEquation, complexeModuleArg, congruenceGen, grapheChemins, markov, matriceInverse, matriceProduit, pgcdGen } from './expertes';
import { forAll, near } from '../testutil';
import { checkQuestion } from '../check';

const N = 120;
type Mat = number[][];

/** naive triple loop, written independently from the generator */
function mul(A: Mat, B: Mat): Mat {
  const C: Mat = [];
  for (let i = 0; i < A.length; i++) {
    C.push([]);
    for (let j = 0; j < B[0].length; j++) {
      let s = 0;
      for (let k = 0; k < B.length; k++) s += A[i][k] * B[k][j];
      C[i].push(s);
    }
  }
  return C;
}

describe('matrices et graphes', () => {
  it('products and powers', () => {
    forAll(matriceProduit, N, (q) => {
      const m = q.meta as { kind: string; A: Mat; B: Mat; C: Mat; R: Mat };
      if (m.kind === 'product') expect(m.C).toEqual(mul(m.A, m.B));
      else expect(m.R).toEqual(mul(mul(m.A, m.A), m.A));
    });
  });
  it('inverse: A × A⁻¹ = I', () => {
    forAll(matriceInverse, N, (q) => {
      const m = q.meta as { A: Mat; inv: Mat };
      const P = mul(m.A, m.inv);
      expect(near(P[0][0], 1) && near(P[1][1], 1) && Math.abs(P[0][1]) < 1e-12 && Math.abs(P[1][0]) < 1e-12).toBe(true);
    });
  });
  it('number of paths = brute-force enumeration of walks', () => {
    forAll(grapheChemins, N, (q) => {
      const m = q.meta as { kind: string; A: Mat; k: number; i: number; j: number; count: number };
      if (m.kind === 'adjacency') {
        for (let i = 0; i < m.A.length; i++) expect(m.A[i][i]).toBe(0);
        return;
      }
      const walks = (v: number, len: number): number => (len === 0 ? (v === m.j ? 1 : 0) : m.A[v].reduce((s, e, w) => s + (e ? walks(w, len - 1) : 0), 0));
      expect(walks(m.i, m.k)).toBe(m.count);
    });
  });
});

describe('chaînes de Markov', () => {
  it('distributions by simulation of the transition, stationary state fixed', () => {
    forAll(markov, N, (q) => {
      const m = q.meta as { kind: string; P: Mat; start: number[]; n: number; dist: number[]; a: number; b: number };
      for (const row of m.P) expect(near(row[0] + row[1], 1)).toBe(true);
      if (m.kind === 'stationary') {
        const pi = mul([[m.a, m.b]], m.P)[0];
        expect(near(pi[0], m.a) && near(pi[1], m.b) && near(m.a + m.b, 1)).toBe(true);
      } else {
        let d = [m.start];
        for (let i = 0; i < m.n; i++) d = mul(d, m.P);
        expect(near(d[0][0], m.dist[0]) && near(d[0][1], m.dist[1])).toBe(true);
      }
    });
  });
});

describe('arithmétique — force brute', () => {
  it('PGCD', () => {
    forAll(pgcdGen, N, (q) => {
      const m = q.meta as { a: number; b: number; g: number };
      let best = 1;
      for (let k = 1; k <= m.b; k++) if (m.a % k === 0 && m.b % k === 0) best = k;
      expect(best).toBe(m.g);
    });
  });
  it('Bézout: canonical answer satisfies the equation, wrong pairs rejected', () => {
    forAll(bezoutGen, N, (q) => {
      const m = q.meta as { a: number; b: number; c: number; canonical: string[] };
      const [x, y] = m.canonical.map(Number);
      expect(m.a * x + m.b * y).toBe(m.c);
      // another solution (x + b, y - a) is accepted too
      expect(checkQuestion(q, [`${x + m.b}`, `${y - m.a}`]).correct).toBe(true);
      expect(checkQuestion(q, [`${x + 1}`, `${y}`]).correct).toBe(false);
    });
  });
  it('congruences', () => {
    forAll(congruenceGen, N, (q) => {
      const m = q.meta as { kind: string; a: number; e: number; n: number; r: number; inv: number };
      if (m.kind === 'power') {
        // BigInt exact power
        expect(Number(BigInt(m.a) ** BigInt(m.e) % BigInt(m.n))).toBe(m.r);
      } else {
        expect((m.a * m.inv) % m.n).toBe(1);
        expect(checkQuestion(q, [`${m.inv + m.n}`]).correct).toBe(true);
        expect(checkQuestion(q, [`${m.inv + 1}`]).correct).toBe(false);
      }
    });
  });
});

describe('nombres complexes', () => {
  const cmul = (a: number[], b: number[]) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  it('algebraic form', () => {
    forAll(complexeCalcul, N, (q) => {
      const m = q.meta as Record<string, number> & { kind: string };
      if (m.kind === 'easy') expect([m.re, m.im]).toEqual([m.a - m.c, m.b - m.e]);
      if (m.kind === 'medium') expect([m.re, m.im]).toEqual(cmul([m.a, m.b], [m.c, m.e]));
      if (m.kind === 'hard') {
        // (re + i im)(c + i e) = a + i b
        const back = cmul([m.re, m.im], [m.c, m.e]);
        expect(near(back[0], m.a) && near(back[1], m.b)).toBe(true);
      }
    });
  });
  it('modulus and argument reconstruct z', () => {
    forAll(complexeModuleArg, N, (q) => {
      const m = q.meta as Record<string, number> & { kind: string };
      if (m.kind === 'module') expect(Math.hypot(m.re, m.im)).toBe(m.mod);
      else {
        expect(near(m.r * Math.cos(m.theta), m.reV, 1e-12) || Math.abs(m.r * Math.cos(m.theta) - m.reV) < 1e-12).toBe(true);
        expect(Math.abs(m.r * Math.sin(m.theta) - m.imV)).toBeLessThan(1e-12);
        // theta + 2π also accepted
        expect(checkQuestion(q, [`${m.r}`, `${m.theta + 2 * Math.PI}`]).correct).toBe(true);
      }
    });
  });
  it('second-degree equation: substitute the root', () => {
    forAll(complexeEquation, N, (q) => {
      const m = q.meta as Record<string, number>;
      const z = [m.re, m.im];
      const z2 = cmul(z, z);
      expect(Math.abs(z2[0] + m.b * z[0] + m.c)).toBeLessThan(1e-9);
      expect(Math.abs(z2[1] + m.b * z[1])).toBeLessThan(1e-9);
      expect(m.im).toBeGreaterThan(0);
    });
  });
});
