import { describe, expect, it } from 'vitest';
import { checkExpression, compile, evalConstant, parseNumberFr } from './expr';

const at = (s: string, x: number) => compile(s).evaluate({ x });

describe('expression parser', () => {
  it('handles precedence and implicit multiplication', () => {
    expect(at('2x^2', 3)).toBe(18);
    expect(at('-x^2', 3)).toBe(-9);
    expect(at('3(x+1)', 2)).toBe(9);
    expect(at('(x+1)(x-1)', 3)).toBe(8);
    expect(at('x e^x', 1)).toBeCloseTo(Math.E);
    expect(at('2^-1', 0)).toBe(0.5);
    expect(at('2^3^2', 0)).toBe(512);
    expect(at('1/2x', 4)).toBe(2);
    expect(at('e^(2x+1)', 0)).toBeCloseTo(Math.E);
    expect(at('e^2x', 1)).toBeCloseTo(Math.E ** 2); // e^2 * x
    expect(at('ln(x^2+1)', 0)).toBe(0);
    expect(at('ln x', Math.E)).toBeCloseTo(1);
    expect(at('√(x)', 9)).toBe(3);
    expect(at('x²+x³', 2)).toBe(12);
    expect(at('3×x−1', 2)).toBe(5);
    expect(at('xln(x)', Math.E)).toBeCloseTo(Math.E);
    expect(at('exp(-x)', 0)).toBe(1);
  });
  it('accepts French decimals', () => {
    expect(evalConstant('2,5')).toBe(2.5);
    expect(evalConstant('0,25*4')).toBe(1);
    expect(parseNumberFr('-3/4')).toBe(-0.75);
    expect(parseNumberFr(' 1 000 ')).toBe(1000);
    expect(parseNumberFr('abc+')).toBeNaN();
  });
  it('reports syntax errors', () => {
    expect(() => compile('(x+1')).toThrow();
    expect(() => compile('x+')).toThrow();
    expect(() => compile('')).toThrow();
    expect(() => compile('x#2')).toThrow();
  });
});

describe('checkExpression', () => {
  it('recognises equivalent forms', () => {
    expect(checkExpression('(x+1)^2', 'x^2+2x+1').correct).toBe(true);
    expect(checkExpression('2xe^(x^2)', '2*x*exp(x^2)').correct).toBe(true);
    expect(checkExpression('(1+x)e^x', 'e^x + x e^x').correct).toBe(true);
    expect(checkExpression('x^2+2x', 'x^2+2x+1').correct).toBe(false);
    expect(checkExpression('1/(x+1)', '1/(x+1)', { domain: [0, 5] }).correct).toBe(true);
    expect(checkExpression('ln(x^2)', '2ln(x)', { domain: [0.1, 5] }).correct).toBe(true);
  });
  it('rejects unexpected variables', () => {
    const r = checkExpression('2y', '2x');
    expect(r.valid).toBe(false);
  });
});
