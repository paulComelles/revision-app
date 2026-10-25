import { describe, expect, it } from 'vitest';
import { indice100, partsEtPoints, phraseSES, tauxVariation } from './calculs';
import { forAll } from '../testutil';
import { checkQuestion } from '../check';

const N = 150;

describe('SES — calculs recomputed from the data', () => {
  it('taux de variation / coefficient multiplicateur', () => {
    forAll(tauxVariation, N, (q) => {
      const m = q.meta as { kind: string; v1: number; v2: number; value: number };
      const exp = m.kind === 'cm' ? m.v2 / m.v1 : (100 * (m.v2 - m.v1)) / m.v1;
      expect(Math.abs(exp - m.value)).toBeLessThan(1e-9);
      if (q.format === 'input') {
        // a correctly rounded answer typed with a French comma is accepted
        const typed = (m.kind === 'cm' ? exp.toFixed(2) : exp.toFixed(1)).replace('.', ',');
        expect(checkQuestion(q, [typed]).correct).toBe(true);
      }
    });
  });
  it('indices', () => {
    forAll(indice100, N, (q) => {
      const m = q.meta as { kind: string; vRef: number; vTgt: number; i1: number; i2: number; value: number };
      if (m.kind === 'index') expect(Math.abs((m.vTgt * 100) / m.vRef - m.value)).toBeLessThan(1e-9);
      else expect(Math.abs((100 * (m.i2 - m.i1)) / m.i1 - m.value)).toBeLessThan(1e-9);
    });
  });
  it('parts, points, TVAM', () => {
    forAll(partsEtPoints, N, (q) => {
      const m = q.meta as Record<string, number> & { kind: string };
      if (m.kind === 'part') expect(Math.abs((100 * m.part) / m.total - m.value)).toBeLessThan(1e-9);
      if (m.kind === 'points') expect(Math.abs(m.r2 - m.r1 - m.value)).toBeLessThan(1e-9);
      if (m.kind === 'tvam') {
        // applying the average rate n times gives back the final value
        let v = m.v1;
        for (let i = 0; i < m.n; i++) v *= 1 + m.value / 100;
        expect(Math.abs(v - m.v2)).toBeLessThan(1e-6);
      }
    });
  });
  it('sentences: exactly one correct option, mentioning the source', () => {
    forAll(phraseSES, N, (q) => {
      if (q.answer.kind !== 'mcq') throw new Error();
      expect(q.answer.choices[q.answer.correct].text).toContain('données fictives');
    });
  });
});
