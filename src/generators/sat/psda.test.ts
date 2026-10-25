import { describe, expect, it } from 'vitest';
import { satClaims, satInference, satOneVar, satPercent, satProbability, satRatios, satTwoVar } from './psda';
import { answerValue, forAll, near } from '../testutil';

const N = 150;
type M = Record<string, number>;

describe('SAT problem solving & data analysis — answers verified independently', () => {
  it('rates and ratios', () => {
    forAll(satRatios, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string };
      const v = answerValue(q);
      if (m.kind === 'rate') {
        // simulate minute by minute
        let bottles = 0;
        for (let t = m.mins; t <= 60 * m.h; t += m.mins) bottles += m.per;
        expect(v).toBe(bottles);
      }
      if (m.kind === 'ratio') {
        expect(v + (m.total - v)).toBe(m.total);
        expect((m.total - v) * m.b).toBe(v * m.a);
      }
      if (m.kind === 'direct') expect(near(v / m.x2, m.k)).toBe(true);
      if (m.kind === 'units') expect(near((m.fps * 3600) / 5280, v)).toBe(true);
      if (m.kind === 'ratio-change') {
        const red = (v / m.b) * m.a;
        expect(red * m.b).toBe(v * m.a);
        expect(Number.isInteger(red)).toBe(true);
      }
    });
  });

  it('percentages', () => {
    forAll(satPercent, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string };
      const v = answerValue(q);
      if (m.kind === 'change') expect(near((Math.abs(m.nw - m.old) / m.old) * 100, v)).toBe(true);
      if (m.kind === 'of') expect(near((m.p / 100) * m.base, v)).toBe(true);
      if (m.kind === 'successive') {
        const price = 100 * (1 + m.p / 100) * (1 - m.q / 100);
        expect(near(price, v)).toBe(true);
      }
      if (m.kind === 'reverse') expect(near(v * (1 - m.p / 100), m.sale)).toBe(true);
      if (m.kind === 'percent-of-percent') {
        // simulate on the N people
        const riders = m.N * (m.q / 100) * (m.p / 100);
        expect(near((riders / m.N) * 100, v)).toBe(true);
      }
    });
  });

  it('one-variable data: recompute statistics from raw data', () => {
    forAll(satOneVar, N, (q) => {
      const m = q.meta as Record<string, unknown> & { kind: string };
      if (m.kind === 'compare') {
        const sd = (xs: number[]) => {
          const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
          return Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / xs.length);
        };
        expect(sd(m.X as number[]) > sd(m.Y as number[]) ? 'A' : 'B').toBe(m.larger);
        return;
      }
      if (q.format !== 'spr') return;
      const v = answerValue(q);
      let data: number[] = [];
      if (m.kind === 'freq-mean' || m.kind === 'freq-median') {
        const vals = m.vals as number[];
        const freqs = m.freqs as number[];
        data = vals.flatMap((x, i) => Array(freqs[i]).fill(x));
      }
      if (m.kind === 'median') data = m.xs as number[];
      const sorted = [...data].sort((a, b) => a - b);
      const med = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
      if (m.kind === 'freq-mean') expect(near(v, data.reduce((a, b) => a + b, 0) / data.length)).toBe(true);
      if (m.kind === 'freq-median' || m.kind === 'median') expect(v).toBe(med);
      if (m.kind === 'added-value') {
        const n = m.n as number;
        expect(near((n * (m.m1 as number) + v) / (n + 1), m.mean2 as number)).toBe(true);
      }
    });
  });

  it('two-variable data: prediction from the line', () => {
    forAll(satTwoVar, N, (q) => {
      const m = q.meta as M & { kind: string; lin: boolean; ys: number[] };
      if (m.kind === 'predict' && q.format === 'spr') expect(near(answerValue(q), m.slope * m.x0 + m.b)).toBe(true);
      if (m.kind === 'model-type') {
        const diffs = m.ys.slice(1).map((y, i) => y - m.ys[i]);
        expect(diffs.every((x) => x === diffs[0])).toBe(m.lin);
      }
    });
  });

  it('two-way tables: probability by counting', () => {
    forAll(satProbability, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as { kind: string; cells: number[][]; i: number; j: number };
      // enumerate every individual and count
      let fav = 0;
      let den = 0;
      m.cells.forEach((row, i) =>
        row.forEach((c, j) => {
          const inGiven = m.kind === 'row' ? i === m.i : m.kind === 'col' ? j === m.j : true;
          if (inGiven) {
            den += c;
            if (i === m.i && j === m.j) fav += c;
          }
        }),
      );
      expect(near(answerValue(q), fav / den)).toBe(true);
    });
  });

  it('inference estimates', () => {
    forAll(satInference, N, (q) => {
      const m = q.meta as M & { kind: string };
      if (m.kind === 'estimate' && q.format === 'spr') expect(near(answerValue(q), (m.yes / m.n) * m.N)).toBe(true);
      if (m.kind === 'sample-size') expect(m.n2).toBeGreaterThan(m.n1);
    });
  });

  it('statistical claims follow the design rules', () => {
    forAll(satClaims, N, (q) => {
      const m = q.meta as { randomSample: boolean; randomAssign: boolean; key: string };
      expect(m.key[0]).toBe(m.randomAssign ? 'c' : 'a');
      expect(m.key[1]).toBe(m.randomSample ? 'c' : 'o');
      if (q.answer.kind === 'mcq') {
        const text = q.answer.choices[q.answer.correct].text;
        expect(text.includes('causes')).toBe(m.randomAssign);
      }
    });
  });
});
