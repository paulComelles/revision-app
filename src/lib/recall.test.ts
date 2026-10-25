import { describe, expect, it } from 'vitest';
import { coverage, gradeFromShare, suggestRecalled } from './recall';

describe('blurting suggestions', () => {
  it('detects points whose keywords appear, ignoring accents/case/plurals', () => {
    const text = 'La dérivée seconde permet d’étudier la CONVEXITÉ ; point d’inflexion quand elle change de signe.';
    const pts = ['Convexité et signe de la dérivée seconde', 'Point d’inflexion', 'Inégalité des accroissements finis'];
    expect(suggestRecalled(pts, text)).toEqual([true, true, false]);
    expect(coverage('', text)).toBe(0);
  });
  it('maps the recalled share to a grade', () => {
    expect(gradeFromShare(1)).toBe(4);
    expect(gradeFromShare(0.7)).toBe(3);
    expect(gradeFromShare(0.4)).toBe(2);
    expect(gradeFromShare(0.1)).toBe(1);
  });
});
