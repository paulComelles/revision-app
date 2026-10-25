/** SAT Algebra generators (College Board Question Bank skills). */
import { F, frac, type Frac } from '../../lib/fraction';
import type { Rng } from '../../lib/rng';
import { defineGenerator } from '../define';
import { fr, lin, m, NAMES_EN, paren, signed } from '../helpers';
import { dollars, numAnswer, textMcq, texOf } from './common';

const pickNZ = (rng: Rng, lo: number, hi: number, not: number[] = []) => {
  for (;;) {
    const v = rng.nonZero(lo, hi);
    if (!not.includes(v)) return v;
  }
};

// ---------------------------------------------------------------- linear equations in one variable
export const satLinearOne = defineGenerator({
  id: 'sat-lin1',
  subject: 'sat',
  skill: 'alg-linear-one',
  title: 'Solve a linear equation',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 75,
  build(rng, d, f) {
    if (d === 'medium') {
      // a(x + b) = cx + e
      const x0 = rng.int(-12, 12);
      const a = pickNZ(rng, -7, 7, [1, -1]);
      const b = rng.nonZero(-9, 9);
      const c = pickNZ(rng, -9, 9, [a]);
      const e = a * (x0 + b) - c * x0;
      const noDistrib = F.div(frac(e - b), frac(a - c)); // a x + b = c x + e
      const signErr = F.div(frac(e + a * b), frac(a - c)); // −ab instead of +ab moved wrong way
      return {
        prompt: `${m(`${a}(x${signed(b)}) = ${lin([[c, 'x']], e)}`)}\n\nWhat value of ${m('x')} is the solution to the given equation?`,
        ...numAnswer(rng, f, frac(x0), [
          { v: noDistrib, e: 'calcul' },
          { v: signErr, e: 'calcul' },
          { v: -x0, e: 'etourderie' },
        ]),
        hints: ['Distribute, then collect the $x$-terms on one side and the constants on the other.', `Distribute: ${m(`${a}x ${a * b < 0 ? '-' : '+'} ${Math.abs(a * b)}`)} on the left side.`],
        solution: [
          `Distribute: ${m(`${lin([[a, 'x']], a * b)} = ${lin([[c, 'x']], e)}`)}.`,
          `Collect terms: ${m(`${lin([[a - c, 'x']])} = ${e - a * b}`)}.`,
          `Divide: ${m(`x = ${x0}`)}.`,
        ],
        meta: { type: 'distribute', a, b, c, e, x: x0 },
      };
    }
    const kind = rng.pick(['fraction', 'nosolution', 'expression'] as const);
    if (kind === 'fraction') {
      // (x + a)/p = (x - b)/q  ->  x = (p b + q a)/(p - q)
      const p = rng.int(2, 9);
      let q = rng.int(2, 9);
      while (q === p) q = rng.int(2, 9);
      const a = rng.nonZero(-9, 9);
      const b = rng.nonZero(-9, 9);
      const x = F.div(frac(p * b + q * a), frac(p - q));
      return {
        prompt: `${m(`\\frac{x${signed(a)}}{${p}} = \\frac{x${signed(-b)}}{${q}}`)}\n\nWhat value of ${m('x')} satisfies the equation?`,
        ...numAnswer(rng, f, x, [
          { v: F.div(frac(p * b - q * a), frac(p - q)), e: 'calcul' },
          { v: F.div(frac(p * b + q * a), frac(q - p)), e: 'calcul' },
          { v: F.div(frac(b + a), frac(p - q)), e: 'methode' },
        ]),
        hints: ['Clear the denominators by cross-multiplying.', `Cross-multiply: ${m(`${q}(x${signed(a)}) = ${p}(x${signed(-b)})`)}.`],
        solution: [
          `Cross-multiply: ${m(`${q}(x${signed(a)}) = ${p}(x${signed(-b)})`)}.`,
          `Distribute: ${m(`${lin([[q, 'x']], q * a)} = ${lin([[p, 'x']], -p * b)}`)}.`,
          `So ${m(`${lin([[q - p, 'x']])} = ${-p * b - q * a}`)}, hence ${m(`x = ${fr(x)}`)}.`,
        ],
        meta: { type: 'fraction', p, q, a, b, x },
      };
    }
    if (kind === 'nosolution') {
      // k(x - a) + bx = cx + e has no solution iff k + b = c and -k a != e
      const a = rng.nonZero(-6, 6);
      const b = rng.nonZero(-6, 6);
      const k = pickNZ(rng, -8, 8, [1, -b]);
      const c = k + b;
      let e = rng.int(-15, 15);
      if (e === -k * a) e += 1;
      return {
        prompt: `${m(`k(x${signed(-a)}) ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x = ${lin([[c, 'x']], e)}`)}\n\nIn the given equation, ${m('k')} is a constant. The equation has no solution. What is the value of ${m('k')}?`,
        ...numAnswer(rng, f, frac(k), [
          { v: c + b, e: 'calcul' },
          { v: c, e: 'methode' },
          { v: -k, e: 'calcul' },
        ]),
        hints: ['A linear equation has no solution when the $x$-coefficients are equal on both sides but the constants are different.', `Expand the left side: the coefficient of ${m('x')} is ${m(`k ${b < 0 ? '-' : '+'} ${Math.abs(b)}`)}.`],
        solution: [
          `Left side: ${m(`(k ${b < 0 ? '-' : '+'} ${Math.abs(b)})x - ${paren(a)}k`)}.`,
          `No solution ⇔ same coefficient of ${m('x')}, different constants: ${m(`k ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${c}`)}.`,
          `So ${m(`k = ${k}`)} (and then the constants ${m(`${-k * a}`)} and ${m(`${e}`)} differ).`,
        ],
        meta: { type: 'nosolution', a, b, c, e, k },
      };
    }
    // If px + q = r, what is the value of (np)x + nq ... with a twist
    const x = F.div(frac(rng.nonZero(-20, 20)), frac(rng.int(2, 5)));
    const p = rng.int(2, 9);
    const q = rng.nonZero(-12, 12);
    const r = F.add(F.mul(frac(p), x), frac(q));
    const n = rng.int(2, 5);
    const s = rng.nonZero(-9, 9);
    // ask value of n p x + s  = n (r - q) + s
    const ans = F.add(F.mul(frac(n), F.sub(r, frac(q))), frac(s));
    return {
      prompt: `If ${m(`${p}x${signed(q)} = ${fr(r)}`)}, what is the value of ${m(`${n * p}x${signed(s)}`)}?`,
      ...numAnswer(rng, f, ans, [
        { v: F.add(F.mul(frac(n), r), frac(s)), e: 'methode' },
        { v: x, e: 'lecture' },
        { v: F.mul(frac(n), F.sub(r, frac(q))), e: 'etourderie' },
      ]),
      hints: [`You don't need to find ${m('x')}: look at how ${m(`${n * p}x`)} relates to ${m(`${p}x`)}.`, `From the equation, ${m(`${p}x = ${fr(F.sub(r, frac(q)))}`)}.`],
      solution: [
        `${m(`${p}x = ${fr(r)} - ${paren(q)} = ${fr(F.sub(r, frac(q)))}`)}.`,
        `${m(`${n * p}x = ${n} \\times ${p}x = ${fr(F.mul(frac(n), F.sub(r, frac(q))))}`)}.`,
        `So ${m(`${n * p}x${signed(s)} = ${fr(ans)}`)}.`,
      ],
      meta: { type: 'expression', p, q, r, n, s, x, ans },
    };
  },
});

// ---------------------------------------------------------------- linear functions
export const satLinearFunctions = defineGenerator({
  id: 'sat-linfn',
  subject: 'sat',
  skill: 'alg-linear-functions',
  title: 'Linear functions',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 80,
  build(rng, d, f) {
    const kind = d === 'medium' ? rng.pick(['two-values', 'context'] as const) : rng.pick(['composition', 'intercept'] as const);
    if (kind === 'two-values') {
      const mm = rng.nonZero(-6, 6);
      const b = rng.int(-15, 15);
      const x1 = rng.int(-5, 3);
      const x2 = x1 + rng.int(1, 5);
      const x3 = rng.int(-6, 10);
      const y = (x: number) => mm * x + b;
      return {
        prompt: `For the linear function ${m('f')}, ${m(`f(${x1}) = ${y(x1)}`)} and ${m(`f(${x2}) = ${y(x2)}`)}. What is the value of ${m(`f(${x3})`)}?`,
        ...numAnswer(rng, f, frac(y(x3)), [
          { v: mm * x3, e: 'methode' },
          { v: -mm * x3 + b, e: 'calcul' },
          { v: (y(x2) - y(x1)) * x3, e: 'methode' },
        ]),
        hints: ['A linear function has a constant slope: find it from the two given values.', `Slope: ${m(`\\frac{${y(x2)} - ${paren(y(x1))}}{${x2} - ${paren(x1)}}`)}.`],
        solution: [
          `Slope ${m(`m = \\frac{${y(x2) - y(x1)}}{${x2 - x1}} = ${mm}`)}.`,
          `${m(`f(x) = ${lin([[mm, 'x']], b)}`)} (using ${m(`f(${x1}) = ${y(x1)}`)} to find the intercept).`,
          `${m(`f(${x3}) = ${y(x3)}`)}.`,
        ],
        meta: { type: 'two-values', m: mm, b, x3, ans: y(x3) },
      };
    }
    if (kind === 'context') {
      const name = rng.pick(NAMES_EN);
      const start = rng.int(8, 30) * 10;
      const rate = rng.int(3, 15);
      const t = rng.int(4, Math.floor(start / rate) - 1);
      const remaining = start - rate * t;
      if (f === 'mcq') {
        return {
          prompt: `${name}'s water tank holds ${m(`${start}`)} liters. Water drains at a constant rate of ${m(`${rate}`)} liters per minute. Which function ${m('V')} gives the volume of water, in liters, remaining in the tank ${m('t')} minutes after it starts draining?`,
          ...textMcq(rng, m(`V(t) = ${start} - ${rate}t`), [
            { t: m(`V(t) = ${rate} - ${start}t`), e: 'lecture' },
            { t: m(`V(t) = ${start} + ${rate}t`), e: 'methode' },
            { t: m(`V(t) = ${start}t - ${rate}`), e: 'methode' },
          ]),
          hints: ['The starting amount is the value when $t = 0$; the rate is the change per minute.', 'Each minute the volume goes down, so the slope is negative.'],
          solution: [`At ${m('t = 0')}, ${m(`V = ${start}`)}.`, `Each minute ${m(`${rate}`)} liters leave: slope ${m(`-${rate}`)}.`, `${m(`V(t) = ${start} - ${rate}t`)}.`],
          meta: { type: 'context', start, rate },
        };
      }
      return {
        prompt: `${name}'s water tank holds ${m(`${start}`)} liters. Water drains at a constant rate of ${m(`${rate}`)} liters per minute. How many liters of water remain in the tank ${m(`${t}`)} minutes after it starts draining?`,
        ...numAnswer(rng, f, frac(remaining), []),
        hints: ['Write the volume as a linear function of time.', `${m(`V(t) = ${start} - ${rate}t`)}.`],
        solution: [`${m(`V(t) = ${start} - ${rate}t`)}.`, `${m(`V(${t}) = ${start} - ${rate * t} = ${remaining}`)}.`],
        meta: { type: 'context', start, rate, t, ans: remaining },
      };
    }
    if (kind === 'composition') {
      // f(x) = a x + b ; g(x) = f(p x + q) ; ask g(k)
      const a = rng.nonZero(-5, 5);
      const b = rng.int(-10, 10);
      const p = pickNZ(rng, -4, 4, [1]);
      const q = rng.nonZero(-6, 6);
      const k = rng.int(-5, 5);
      const ans = a * (p * k + q) + b;
      return {
        prompt: `The function ${m('f')} is defined by ${m(`f(x) = ${lin([[a, 'x']], b)}`)}. The function ${m('g')} is defined by ${m(`g(x) = f(${lin([[p, 'x']], q)})`)}. What is the value of ${m(`g(${k})`)}?`,
        ...numAnswer(rng, f, frac(ans), [
          { v: p * (a * k + b) + q, e: 'methode' },
          { v: a * k + b, e: 'lecture' },
          { v: a * (p * k - q) + b, e: 'calcul' },
        ]),
        hints: [`To evaluate ${m(`g(${k})`)}, first compute the input that is fed to ${m('f')}.`, `${m(`g(${k}) = f(${p * k + q})`)}.`],
        solution: [`${m(`${lin([[p, 'x']], q)}`)} at ${m(`x = ${k}`)} equals ${m(`${p * k + q}`)}.`, `${m(`g(${k}) = f(${p * k + q}) = ${a}\\times ${paren(p * k + q)}${signed(b)}`)}.`, `${m(`g(${k}) = ${ans}`)}.`],
        meta: { type: 'composition', a, b, p, q, k, ans },
      };
    }
    // x-intercept of the line through two points
    const x1 = rng.int(-6, 2);
    const x2 = x1 + rng.int(1, 6);
    const y1 = rng.int(-9, 12);
    let y2 = rng.int(-9, 12);
    if (y2 === y1) y2 += rng.pick([-3, 4]);
    const slope = frac(y2 - y1, x2 - x1);
    // x-intercept: x1 - y1 / slope
    const xint = F.sub(frac(x1), F.div(frac(y1), slope));
    return {
      prompt: `In the ${m('xy')}-plane, the graph of the linear function ${m('f')} passes through the points ${m(`(${x1}, ${y1})`)} and ${m(`(${x2}, ${y2})`)}. What is the ${m('x')}-coordinate of the ${m('x')}-intercept of the graph of ${m('y = f(x)')}?`,
      ...numAnswer(rng, f, xint, [
        { v: F.add(frac(x1), F.div(frac(y1), slope)), e: 'calcul' },
        { v: F.sub(frac(y1), F.mul(slope, frac(x1))), e: 'lecture' },
        { v: F.sub(frac(x1), F.mul(frac(y1), slope)), e: 'methode' },
      ]),
      hints: ['Find the slope, then set $y = 0$ in the equation of the line.', `Slope: ${m(`\\frac{${y2} - ${paren(y1)}}{${x2} - ${paren(x1)}} = ${fr(slope)}`)}.`],
      solution: [
        `Slope ${m(`= ${fr(slope)}`)}; the line is ${m(`y - ${paren(y1)} = ${fr(slope)}(x - ${paren(x1)})`)}.`,
        `Set ${m('y = 0')}: ${m(`x = ${x1} - \\frac{${y1}}{${fr(slope)}}`)}.`,
        `${m(`x = ${fr(xint)}`)}.`,
      ],
      meta: { type: 'intercept', x1, y1, x2, y2, xint },
    };
  },
});

// ---------------------------------------------------------------- linear equations in two variables
export const satLinearTwo = defineGenerator({
  id: 'sat-lin2',
  subject: 'sat',
  skill: 'alg-linear-two',
  title: 'Lines in the xy-plane',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 85,
  build(rng, d, f) {
    const kind = d === 'medium' ? rng.pick(['standard-slope', 'point-on-line', 'context'] as const) : rng.pick(['perpendicular', 'parallel'] as const);
    if (kind === 'standard-slope') {
      const a = rng.nonZero(-9, 9);
      const b = pickNZ(rng, -9, 9, [a, -a]);
      const c = rng.int(-20, 20);
      const slope = frac(-a, b);
      return {
        prompt: `What is the slope of the graph of ${m(`${lin([[a, 'x'], [b, 'y']])} = ${c}`)} in the ${m('xy')}-plane?`,
        ...numAnswer(rng, f, slope, [
          { v: frac(a, b), e: 'calcul' },
          { v: frac(-b, a), e: 'methode' },
          { v: frac(c, b), e: 'lecture' },
        ]),
        hints: ['Rewrite the equation in slope-intercept form $y = mx + b$.', `Isolate ${m('y')}: ${m(`${lin([[b, 'y']])} = ${lin([[-a, 'x']], c)}`)}.`],
        solution: [`${m(`${lin([[b, 'y']])} = ${lin([[-a, 'x']], c)}`)}.`, `${m(`y = ${fr(slope)}x + ${fr(frac(c, b))}`)}.`, `Slope: ${m(fr(slope))}.`],
        meta: { type: 'standard-slope', a, b, c, slope },
      };
    }
    if (kind === 'point-on-line') {
      const a = rng.nonZero(-7, 7);
      const b = pickNZ(rng, -7, 7);
      const x0 = rng.int(-6, 6);
      const y0 = rng.int(-8, 8);
      const c = a * x0 + b * y0;
      return {
        prompt: `The point ${m(`(${x0}, k)`)} lies on the line with equation ${m(`${lin([[a, 'x'], [b, 'y']])} = ${c}`)}. What is the value of ${m('k')}?`,
        ...numAnswer(rng, f, frac(y0), [
          { v: frac(c + a * x0, b), e: 'calcul' },
          { v: frac(c - b * x0, a), e: 'lecture' },
          { v: -y0, e: 'calcul' },
        ]),
        hints: ['A point lies on a line when its coordinates satisfy the equation.', `Substitute ${m(`x = ${x0}`)} and ${m('y = k')}.`],
        solution: [`${m(`${a}\\times ${paren(x0)} + ${b}k = ${c}`)}.`, `${m(`${b}k = ${c - a * x0}`)}.`, `${m(`k = ${y0}`)}.`],
        meta: { type: 'point-on-line', a, b, c, x0, y0 },
      };
    }
    if (kind === 'context') {
      const p1 = rng.int(3, 9);
      const p2 = rng.int(10, 18);
      const n1 = rng.int(4, 20);
      const n2 = rng.int(3, 15);
      const total = p1 * n1 + p2 * n2;
      // ask n2 given n1
      return {
        prompt: `A school club sells pens for ${m(dollars(p1))} each and notebooks for ${m(dollars(p2))} each. The equation ${m(`${p1}p + ${p2}n = ${total}`)} represents the number of pens, ${m('p')}, and notebooks, ${m('n')}, sold for a total of ${m(dollars(total))}. If the club sold ${m(`${n1}`)} pens, how many notebooks did it sell?`,
        ...numAnswer(rng, f, frac(n2), [
          { v: frac(total - p2 * n1, p1), e: 'lecture' },
          { v: frac(total, p2), e: 'methode' },
          { v: n2 + 1, e: 'calcul' },
        ]),
        hints: ['Substitute the known quantity into the equation.', `Replace ${m('p')} by ${m(`${n1}`)}.`],
        solution: [`${m(`${p1}\\times ${n1} + ${p2}n = ${total}`)}.`, `${m(`${p2}n = ${total - p1 * n1}`)}.`, `${m(`n = ${n2}`)}.`],
        meta: { type: 'context', p1, p2, n1, n2, total },
      };
    }
    // perpendicular or parallel line through a point; ask y-intercept
    const a = rng.nonZero(-6, 6);
    const b = pickNZ(rng, -6, 6, [a, -a]);
    const c = rng.int(-12, 12);
    const x0 = rng.int(-5, 5);
    const y0 = rng.int(-6, 6);
    const base = frac(-a, b);
    const slope = kind === 'parallel' ? base : F.div(frac(-1), base);
    const yint = F.sub(frac(y0), F.mul(slope, frac(x0)));
    const wrongSlope = kind === 'parallel' ? F.div(frac(-1), base) : base;
    return {
      prompt: `Line ${m('\\ell')} is ${kind} to the line ${m(`${lin([[a, 'x'], [b, 'y']])} = ${c}`)} and passes through the point ${m(`(${x0}, ${y0})`)}. What is the ${m('y')}-coordinate of the ${m('y')}-intercept of line ${m('\\ell')}?`,
      ...numAnswer(rng, f, yint, [
        { v: F.sub(frac(y0), F.mul(wrongSlope, frac(x0))), e: 'cours' },
        { v: F.add(frac(y0), F.mul(slope, frac(x0))), e: 'calcul' },
        { v: frac(c, b), e: 'lecture' },
      ]),
      hints: [
        kind === 'parallel' ? 'Parallel lines have equal slopes.' : 'Perpendicular lines have slopes whose product is $-1$ (negative reciprocals).',
        `The given line has slope ${m(fr(base))}.`,
      ],
      solution: [
        `Given line: ${m(`y = ${fr(base)}x + ${fr(frac(c, b))}`)}, slope ${m(fr(base))}.`,
        `Slope of ${m('\\ell')}: ${m(fr(slope))}.`,
        `${m(`b = ${y0} - ${paren(fr(slope))} \\times ${paren(x0)} = ${fr(yint)}`)}.`,
      ],
      meta: { type: kind, a, b, x0, y0, slope, yint },
    };
  },
});

// ---------------------------------------------------------------- systems of two linear equations
function systemTex(a: number, b: number, c: number, d: number, e: number, g: number) {
  return `$$\\begin{aligned} ${lin([[a, 'x'], [b, 'y']])} &= ${c} \\\\ ${lin([[d, 'x'], [e, 'y']])} &= ${g} \\end{aligned}$$`;
}

export const satSystems = defineGenerator({
  id: 'sat-systems',
  subject: 'sat',
  skill: 'alg-systems',
  title: 'Solve a system of linear equations',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 100,
  build(rng, d, f) {
    if (d === 'medium' && rng.bool(0.35)) {
      // word problem: tickets
      const pa = rng.int(8, 20);
      let pc = rng.int(3, 12);
      if (pc >= pa) pc = pa - rng.int(1, 4);
      const na = rng.int(10, 80);
      const nc = rng.int(10, 80);
      const N = na + nc;
      const R = pa * na + pc * nc;
      return {
        prompt: `A theater sold ${m(`${N}`)} tickets for one show. Adult tickets cost ${m(dollars(pa))} each and child tickets cost ${m(dollars(pc))} each. The total revenue from these tickets was ${m(dollars(R))}. How many adult tickets were sold?`,
        ...numAnswer(rng, f, frac(na), [
          { v: nc, e: 'lecture' },
          { v: frac(R, pa), e: 'methode' },
          { v: Math.round(N / 2), e: 'methode' },
        ]),
        hints: ['Write one equation for the number of tickets and one for the revenue.', `Let ${m('a')} and ${m('c')} be the numbers of adult and child tickets: ${m(`a + c = ${N}`)}.`],
        solution: [
          `${m(`a + c = ${N}`)} and ${m(`${pa}a + ${pc}c = ${R}`)}.`,
          `Substitute ${m(`c = ${N} - a`)}: ${m(`${pa}a + ${pc}(${N} - a) = ${R}`)}, so ${m(`${pa - pc}a = ${R - pc * N}`)}.`,
          `${m(`a = ${na}`)}.`,
        ],
        meta: { type: 'tickets', pa, pc, na, nc, N, R },
      };
    }
    // build a system with known solution (x0, y0), possibly fractional for hard
    let a: number, b: number, dd: number, e: number;
    do {
      a = rng.nonZero(-7, 7);
      b = rng.nonZero(-7, 7);
      dd = rng.nonZero(-7, 7);
      e = rng.nonZero(-7, 7);
    } while (a * e - b * dd === 0);
    let x0: Frac;
    let y0: Frac;
    let c: number;
    let g: number;
    if (d === 'hard') {
      // integer constants, solution possibly fractional (Cramer)
      c = rng.int(-20, 20);
      g = rng.int(-20, 20);
      const det = a * e - b * dd;
      x0 = frac(c * e - b * g, det);
      y0 = frac(a * g - c * dd, det);
    } else {
      x0 = frac(rng.int(-9, 9));
      y0 = frac(rng.int(-9, 9));
      c = a * x0.n + b * y0.n;
      g = dd * x0.n + e * y0.n;
    }
    const ask = rng.pick(d === 'hard' ? (['combo'] as const) : (['x', 'y', 'x+y', 'x-y'] as const));
    if (ask === 'combo') {
      // ask p x + q y where (p, q) = eq1 + s*eq2 for s in {1,-1} : solvable without solving
      const s = rng.pick([1, -1, 2]);
      const p = a + s * dd;
      const q = b + s * e;
      // p = q = 0 is impossible: it would make the determinant 0
      const ans = F.add(F.mul(frac(p), x0), F.mul(frac(q), y0));
      return {
        prompt: `${systemTex(a, b, c, dd, e, g)}\nIf ${m('(x, y)')} is the solution to the system of equations above, what is the value of ${m(lin([[p, 'x'], [q, 'y']]))}?`,
        ...numAnswer(rng, f, ans, [
          { v: c - s * g, e: 'calcul' },
          { v: F.add(x0, y0), e: 'lecture' },
          { v: F.add(F.mul(frac(p), y0), F.mul(frac(q), x0)), e: 'etourderie' },
        ]),
        hints: [
          'Before solving for $x$ and $y$, check whether the requested expression is a combination of the two equations.',
          s === 1 ? 'Try adding the two equations.' : s === -1 ? 'Try subtracting the second equation from the first.' : 'Try adding the first equation to twice the second.',
        ],
        solution: [
          s === 1 ? 'Add the equations:' : s === -1 ? 'Subtract the second equation from the first:' : 'Add the first equation and twice the second:',
          `${m(`${lin([[p, 'x'], [q, 'y']])} = ${c} ${s < 0 ? '-' : '+'} ${s === 2 ? '2 \\times ' : ''}${paren(g)}`)}.`,
          `${m(`${lin([[p, 'x'], [q, 'y']])} = ${fr(ans)}`)}.`,
        ],
        meta: { type: 'combo', a, b, c, d: dd, e, g, x: x0, y: y0, p, q, ans },
      };
    }
    const value = ask === 'x' ? x0 : ask === 'y' ? y0 : ask === 'x+y' ? F.add(x0, y0) : F.sub(x0, y0);
    const label = ask === 'x' ? 'x' : ask === 'y' ? 'y' : ask === 'x+y' ? 'x + y' : 'x - y';
    return {
      prompt: `${systemTex(a, b, c, dd, e, g)}\nThe solution to the given system of equations is ${m('(x, y)')}. What is the value of ${m(label)}?`,
      ...numAnswer(rng, f, value, [
        { v: ask === 'x' ? y0 : x0, e: 'lecture' },
        { v: F.neg(value), e: 'calcul' },
        { v: ask === 'x+y' ? F.sub(x0, y0) : F.add(x0, y0), e: 'lecture' },
      ]),
      hints: ['Use elimination: multiply the equations so one variable has opposite coefficients, then add.', `Multiply the first equation by ${m(`${dd}`)} and the second by ${m(`${a}`)} to match the ${m('x')}-coefficients.`],
      solution: [
        `${m(`${dd}(${lin([[a, 'x'], [b, 'y']])}) - ${paren(a)}(${lin([[dd, 'x'], [e, 'y']])}) = ${dd}\\times${paren(c)} - ${paren(a)}\\times ${paren(g)}`)}`,
        `${m(`${dd * b - a * e}y = ${dd * c - a * g}`)}, so ${m(`y = ${fr(y0)}`)}; then ${m(`x = ${fr(x0)}`)}.`,
        `${m(`${label} = ${fr(value)}`)}.`,
      ],
      meta: { type: 'solve', a, b, c, d: dd, e, g, x: x0, y: y0, ask, value },
    };
  },
});

export const satSystemsCount = defineGenerator({
  id: 'sat-systems-count',
  subject: 'sat',
  skill: 'alg-systems',
  title: 'Systems with zero, one or infinitely many solutions',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 90,
  build(rng, d, f) {
    // base equation a x + b y = c ; second = t * (a, b) with constant t*c (infinite) or other (none)
    const a = rng.nonZero(-6, 6);
    const b = rng.nonZero(-6, 6);
    const c = rng.nonZero(-12, 12);
    const t = rng.pick([2, 3, -2, 4, -3, 5]);
    if (f === 'mcq' && d === 'medium') {
      const type = rng.pick(['none', 'infinite', 'one'] as const);
      let dd = t * a;
      let e = t * b;
      let g = t * c;
      if (type === 'none') g += rng.pick([-3, 1, 2, 5]);
      if (type === 'one') e += rng.pick([1, -1, 2]);
      if (type === 'one' && dd * b === a * e) dd += 1;
      const correct = { none: 'Zero', infinite: 'Infinitely many', one: 'Exactly one' }[type];
      return {
        prompt: `${systemTex(a, b, c, dd, e, g)}\nHow many solutions does the given system of equations have?`,
        ...textMcq(
          rng,
          correct,
          ['Zero', 'Exactly one', 'Exactly two', 'Infinitely many']
            .filter((x) => x !== correct)
            .map((x) => ({ t: x, e: x === 'Exactly two' ? ('cours' as const) : ('methode' as const) })),
        ),
        hints: ['Compare the ratios of the coefficients: are the lines parallel, identical, or intersecting?', `Is the second equation's left side a multiple of ${m(lin([[a, 'x'], [b, 'y']]))}?`],
        solution: [
          `Ratios: ${m(`\\frac{${dd}}{${a}}`)}, ${m(`\\frac{${e}}{${b}}`)}, ${m(`\\frac{${g}}{${c}}`)}.`,
          type === 'one'
            ? 'The x and y ratios differ: the lines have different slopes and intersect once.'
            : type === 'infinite'
              ? 'All three ratios are equal: the equations describe the same line.'
              : 'The x and y ratios are equal but the constant ratio is different: the lines are parallel and distinct.',
          `Answer: ${correct.toLowerCase()}.`,
        ],
        meta: { type: 'count', a, b, c, d: dd, e, g, answer: type },
      };
    }
    // parameter: find k
    const want = d === 'hard' ? rng.pick(['infinite-r', 'none-k']) : 'none-k';
    if (want === 'none-k') {
      // a x + b y = c ; k x + (t b) y = r, no solution => k = t a, r != t c
      let r = rng.int(-20, 20);
      if (r === t * c) r += 2;
      const k = t * a;
      return {
        prompt: `$$\\begin{aligned} ${lin([[a, 'x'], [b, 'y']])} &= ${c} \\\\ kx ${t * b < 0 ? '-' : '+'} ${Math.abs(t * b)}y &= ${r} \\end{aligned}$$\nIn the given system of equations, ${m('k')} is a constant. If the system has no solution, what is the value of ${m('k')}?`,
        ...numAnswer(rng, f, frac(k), [
          { v: frac(a * b, t * b), e: 'methode' },
          { v: -k, e: 'calcul' },
          { v: frac(t * b * a, c), e: 'methode' },
        ]),
        hints: ['No solution means parallel distinct lines: the $x$- and $y$-coefficients are proportional, the constants are not.', `The ${m('y')}-coefficients give the ratio ${m(`\\frac{${t * b}}{${b}} = ${t}`)}.`],
        solution: [
          `For parallel lines: ${m(`\\frac{k}{${a}} = \\frac{${t * b}}{${b}} = ${t}`)}.`,
          `So ${m(`k = ${t} \\times ${paren(a)} = ${k}`)}; the constants ${m(`${t * c}`)} and ${m(`${r}`)} differ, so the lines are distinct.`,
          `${m(`k = ${k}`)}.`,
        ],
        meta: { type: 'none-k', a, b, c, t, r, k },
      };
    }
    // infinitely many: a x + b y = c ; (t a) x + k y = r -> k = t b, r = t c ; ask k + r? ask r
    const k = t * b;
    const r = t * c;
    const askSum = rng.bool();
    const value = askSum ? k + r : r;
    return {
      prompt: `$$\\begin{aligned} ${lin([[a, 'x'], [b, 'y']])} &= ${c} \\\\ ${lin([[t * a, 'x']])} + ky &= r \\end{aligned}$$\nIn the given system of equations, ${m('k')} and ${m('r')} are constants. The system has infinitely many solutions. What is the value of ${m(askSum ? 'k + r' : 'r')}?`,
      ...numAnswer(rng, f, frac(value), [
        { v: askSum ? b + c : c, e: 'methode' },
        { v: askSum ? k - r : -r, e: 'calcul' },
        { v: askSum ? t * (a + c) : t * a, e: 'lecture' },
      ]),
      hints: ['Infinitely many solutions means the two equations describe the same line: the second is a multiple of the first.', `Compare the ${m('x')}-coefficients: ${m(`\\frac{${t * a}}{${a}} = ${t}`)}.`],
      solution: [`The second equation is ${m(`${t}`)} times the first.`, `${m(`k = ${t}\\times ${paren(b)} = ${k}`)} and ${m(`r = ${t} \\times ${paren(c)} = ${r}`)}.`, `${m(`${askSum ? 'k + r' : 'r'} = ${value}`)}.`],
      meta: { type: 'infinite', a, b, c, t, k, r, value },
    };
  },
});

// ---------------------------------------------------------------- inequalities
export const satInequalities = defineGenerator({
  id: 'sat-ineq',
  subject: 'sat',
  skill: 'alg-inequalities',
  title: 'Linear inequalities',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 80,
  build(rng, d, f) {
    const kind = f === 'mcq' && rng.bool(0.5) ? 'point' : d === 'hard' ? 'greatest' : 'budget';
    if (kind === 'point') {
      // y > m1 x + b1 and y < m2 x + b2 ; choose 4 points, exactly one satisfies
      const m1 = rng.int(-3, 3);
      const b1 = rng.int(-5, 3);
      const m2 = rng.int(-3, 3);
      const b2 = b1 + rng.int(3, 9);
      const ok = (x: number, y: number) => y > m1 * x + b1 && y < m2 * x + b2;
      // a satisfying point (the band is at least 3 wide at x = 0)
      let gx = rng.int(-4, 4);
      while (m2 * gx + b2 - (m1 * gx + b1) < 2) gx = Math.trunc(gx / 2);
      const good: [number, number] = [gx, m1 * gx + b1 + 1];
      const pts: [number, number][] = [];
      while (pts.length < 3) {
        const x = rng.int(-6, 6);
        const y = rng.int(-15, 15);
        if (!ok(x, y) && !pts.some((p) => p[0] === x && p[1] === y)) pts.push([x, y]);
      }
      const fmt = (p: [number, number]) => m(`(${p[0]}, ${p[1]})`);
      return {
        prompt: `$$\\begin{aligned} y &> ${lin([[m1, 'x']], b1)} \\\\ y &< ${lin([[m2, 'x']], b2)} \\end{aligned}$$\nFor which of the following ordered pairs ${m('(x, y)')} is the system of inequalities above satisfied?`,
        ...textMcq(rng, fmt(good), pts.map((p) => ({ t: fmt(p), e: 'calcul' as const }))),
        hints: ['Test each ordered pair in BOTH inequalities.', `For a pair ${m('(x, y)')}, compute ${m(lin([[m1, 'x']], b1))} and ${m(lin([[m2, 'x']], b2))} and compare with ${m('y')}.`],
        solution: [
          `For ${fmt(good)}: ${m(`${lin([[m1, 'x']], b1)} = ${m1 * good[0] + b1}`)} and ${m(`${lin([[m2, 'x']], b2)} = ${m2 * good[0] + b2}`)}.`,
          `${m(`${m1 * good[0] + b1} < ${good[1]} < ${m2 * good[0] + b2}`)}: both inequalities hold. Each other pair fails at least one.`,
          `Answer: ${fmt(good)}.`,
        ],
        meta: { type: 'point', m1, b1, m2, b2, good, others: pts },
      };
    }
    if (kind === 'budget') {
      const fee = rng.int(10, 40);
      const rate = rng.int(3, 12);
      const budget = fee + rate * rng.int(5, 20) + rng.int(1, rate - 1);
      const ans = Math.floor((budget - fee) / rate);
      return {
        prompt: `A bike rental costs ${m(dollars(fee))} plus ${m(dollars(rate))} per hour. Mia wants to spend at most ${m(dollars(budget))} on the rental. What is the maximum number of whole hours she can rent the bike?`,
        ...numAnswer(rng, f, frac(ans), [
          { v: ans + 1, e: 'methode' },
          { v: Math.floor(budget / rate), e: 'lecture' },
          { v: Math.floor((budget + fee) / rate), e: 'calcul' },
        ]),
        hints: ['Write an inequality for the total cost.', `${m(`${fee} + ${rate}h \\le ${budget}`)}.`],
        solution: [`${m(`${fee} + ${rate}h \\le ${budget}`)}.`, `${m(`h \\le \\frac{${budget - fee}}{${rate}} \\approx ${Math.round(((budget - fee) / rate) * 100) / 100}`)}.`, `The greatest whole number of hours is ${m(`${ans}`)}.`],
        meta: { type: 'budget', fee, rate, budget, ans },
      };
    }
    // greatest integer solution of a x + b < c x + e with a < c (division by negative flips)
    const a = rng.int(-6, 6);
    let c = rng.int(-6, 6);
    while (c <= a) c = rng.int(-6, 9);
    const b = rng.int(-15, 15);
    const e = rng.int(-15, 15);
    // a x + b < c x + e  <=>  (a - c) x < e - b  <=> x > (e - b)/(a - c)   (a - c < 0)
    // ask least integer solution
    const bound = (e - b) / (a - c);
    const least = Math.floor(bound) + 1;
    return {
      prompt: `${m(`${lin([[a, 'x']], b)} < ${lin([[c, 'x']], e)}`)}\n\nWhat is the least integer value of ${m('x')} that satisfies the inequality above?`,
      ...numAnswer(rng, f, frac(least), [
        { v: Math.ceil(bound) - 1 === least ? least - 2 : Math.ceil(bound) - 1, e: 'methode' },
        { v: -least, e: 'calcul' },
        { v: least - 1, e: 'cours' },
      ]),
      hints: ['Collect the $x$-terms on one side. When you divide by a negative number, flip the inequality sign.', `${m(`${lin([[a - c, 'x']])} < ${e - b}`)}.`],
      solution: [
        `${m(`${lin([[a - c, 'x']])} < ${e - b}`)}.`,
        `Divide by ${m(`${a - c}`)} (negative) and flip: ${m(`x > ${texOf(bound)}`)}.`,
        `The least integer greater than ${m(texOf(bound))} is ${m(`${least}`)}.`,
      ],
      meta: { type: 'greatest', a, b, c, e, least },
    };
  },
});

export const ALGEBRA_GENERATORS = [satLinearOne, satLinearFunctions, satLinearTwo, satSystems, satSystemsCount, satInequalities];
