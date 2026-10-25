import { describe, expect, it } from 'vitest';
import { compile } from '../../lib/expr';
import { buildProof, proofLines, REC_SECTIONS } from './recurrence';

describe('récurrence builder', () => {
  it('every generated property is true for many n, and blanks match the truth', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) {
      for (let seed = 1; seed <= 80; seed++) {
        const p = buildProof(seed, d);
        for (let n = p.n0; n <= p.n0 + 25; n++) expect(p.holds(n), `${p.template} n=${n}`).toBe(true);
        for (const b of p.blanks) {
          const e = compile(b.expected);
          for (let n = p.n0; n <= p.n0 + 10; n++) expect(Math.abs(e.evaluate({ n }) - b.truth(n)), `${p.template} blank ${b.id} n=${n}`).toBeLessThan(1e-9);
        }
        // the 4 sections, in Paul's order
        expect(p.sections.map((s) => s.title)).toEqual(REC_SECTIONS);
        // each blank appears exactly once in the text
        const text = proofLines(p).map((l) => l.text).join(' ');
        for (const b of p.blanks) expect(text.split(`[[${b.id}]]`).length - 1).toBe(1);
      }
    }
  });
});
