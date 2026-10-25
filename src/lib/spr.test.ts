import { describe, expect, it } from 'vitest';
import { checkSpr, parseSpr, sprAcceptedForms } from './spr';
import { frac } from './fraction';

describe('parseSpr', () => {
  it('parses integers, decimals and fractions', () => {
    expect(parseSpr('12')).toMatchObject({ ok: true, kind: 'integer' });
    expect(parseSpr('.75')).toMatchObject({ ok: true, kind: 'decimal' });
    expect(parseSpr('-3/4')).toMatchObject({ ok: true, kind: 'fraction' });
  });
  it('rejects invalid entries with a message', () => {
    for (const bad of ['', '3 1/2', '0,75', '50%', '$3', '+3', '1/0', '1.5/2', 'abc', '123456', '-1234567', '1..2', '/3', '-']) {
      const p = parseSpr(bad);
      expect(p.ok, bad).toBe(false);
    }
  });
  it('enforces the 5 / 6 character limits', () => {
    expect(parseSpr('12345').ok).toBe(true);
    expect(parseSpr('123456').ok).toBe(false);
    expect(parseSpr('-12345').ok).toBe(true);
    expect(parseSpr('-123456').ok).toBe(false);
  });
});

describe('checkSpr (official examples)', () => {
  it('3/4 accepts 3/4, .75, 0.75, 6/8', () => {
    for (const s of ['3/4', '.75', '0.75', '6/8', '0.750']) expect(checkSpr(s, frac(3, 4)).correct, s).toBe(true);
    expect(checkSpr('0.7', frac(3, 4)).correct).toBe(false);
  });
  it('2/3: .6666 .6667 0.666 0.667 accepted, 0.66 .66 0.67 .67 rejected', () => {
    const c = frac(2, 3);
    for (const s of ['2/3', '.6666', '.6667', '0.666', '0.667', '4/6']) expect(checkSpr(s, c).correct, s).toBe(true);
    for (const s of ['0.66', '.66', '0.67', '.67', '.6668', '0.665']) expect(checkSpr(s, c).correct, s).toBe(false);
  });
  it('-1/3: -1/3, -.3333, -0.333 accepted; -.33 rejected', () => {
    const c = frac(-1, 3);
    for (const s of ['-1/3', '-.3333', '-0.333']) expect(checkSpr(s, c).correct, s).toBe(true);
    for (const s of ['-.33', '-0.33', '.3333']) expect(checkSpr(s, c).correct, s).toBe(false);
  });
  it('3 1/2 must be entered as 7/2 or 3.5', () => {
    expect(checkSpr('7/2', frac(7, 2)).correct).toBe(true);
    expect(checkSpr('3.5', frac(7, 2)).correct).toBe(true);
    expect(checkSpr('3 1/2', frac(7, 2)).valid).toBe(false);
  });
  it('accepts any of several correct answers', () => {
    expect(checkSpr('-2', [frac(3), frac(-2)]).correct).toBe(true);
    expect(checkSpr('3', [frac(3), frac(-2)]).correct).toBe(true);
    expect(checkSpr('2', [frac(3), frac(-2)]).correct).toBe(false);
  });
  it('rounds/truncates larger numbers at full width', () => {
    const c = frac(1000, 7); // 142.857142...
    expect(checkSpr('142.8', c).correct).toBe(true);
    expect(checkSpr('142.9', c).correct).toBe(true);
    expect(checkSpr('143', c).correct).toBe(false);
  });
  it('handles irrational (float) answers', () => {
    expect(checkSpr('1.414', Math.SQRT2).correct).toBe(true);
    expect(checkSpr('1.41', Math.SQRT2).correct).toBe(false);
  });
});

describe('sprAcceptedForms', () => {
  it('lists valid forms only', () => {
    for (const c of [frac(2, 3), frac(-1, 3), frac(7, 2), frac(12), frac(1000, 7), frac(-5, 4)]) {
      const forms = sprAcceptedForms(c);
      expect(forms.length).toBeGreaterThan(0);
      for (const f of forms) expect(checkSpr(f, c).correct, `${f}`).toBe(true);
    }
    expect(sprAcceptedForms(frac(2, 3))).toEqual(expect.arrayContaining(['2/3', '0.666', '0.667', '.6666', '.6667']));
  });
});
