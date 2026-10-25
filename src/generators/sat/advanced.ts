/** SAT Advanced Math generators. */
import { F, frac } from '../../lib/fraction';
import type { Rng } from '../../lib/rng';
import { defineGenerator, type Built } from '../define';
import { fr, lin, m, paren, poly, signed } from '../helpers';
import { numAnswer, textMcq } from './common';
import type { Figure } from '../types';

const sq = (x: number) => x * x;

// ---------------------------------------------------------------- quadratics: vertex
export const satQuadVertex = defineGenerator({
  id: 'sat-quad-vertex',
  subject: 'sat',
  skill: 'adv-nonlinear-functions',
  title: 'Quadratic functions: vertex, minimum and maximum',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 90,
  build(rng, d, f) {
    const form = d === 'medium' ? rng.pick(['vertex', 'standard'] as const) : rng.pick(['factored', 'standard-k'] as const);
    if (form === 'vertex') {
      const a = rng.pick([-3, -2, -1, 1, 2, 3, 4]);
      const h = rng.nonZero(-8, 8);
      const k = rng.int(-15, 15);
      const word = a > 0 ? 'minimum' : 'maximum';
      return {
        prompt: `${m(`f(x) = ${a === 1 ? '' : a === -1 ? '-' : a}(x${signed(-h)})^2${signed(k)}`)}\n\nThe function ${m('f')} is defined above. What is the ${word} value of ${m('f(x)')}?`,
        ...numAnswer(rng, f, frac(k), [
          { v: h, e: 'lecture' },
          { v: -h, e: 'cours' },
          { v: -k, e: 'calcul' },
        ]),
        hints: [`In vertex form ${m('a(x-h)^2 + k')}, the vertex is ${m('(h, k)')}.`, `The squared term is ${m('\\ge 0')}, so it is 0 when ${m(`x = ${h}`)}.`],
        solution: [`${m(`(x${signed(-h)})^2 \\ge 0`)} with equality at ${m(`x = ${h}`)}.`, `Since ${m(`a = ${a}`)} is ${a > 0 ? 'positive' : 'negative'}, ${m('f')} has a ${word} at the vertex ${m(`(${h}, ${k})`)}.`, `The ${word} value is ${m(`${k}`)}.`],
        meta: { form, a, h, k, ans: k },
      };
    }
    if (form === 'standard' || form === 'standard-k') {
      // f(x) = a x^2 + b x + c with integer vertex
      const a = rng.pick(d === 'hard' ? [-3, -2, 2, 3] : [-2, -1, 1, 2]);
      const h = rng.nonZero(-6, 6);
      const k = rng.int(-20, 20);
      const b = -2 * a * h;
      const c = a * h * h + k;
      const askX = form === 'standard' && rng.bool();
      const word = a > 0 ? 'minimum' : 'maximum';
      const ans = askX ? h : k;
      return {
        prompt: `${m(`f(x) = ${poly([a, b, c])}`)}\n\n${askX ? `For what value of ${m('x')} does ${m('f(x)')} reach its ${word} value?` : `What is the ${word} value of the function ${m('f')} defined above?`}`,
        ...numAnswer(rng, f, frac(ans), [
          { v: askX ? -h : h, e: askX ? 'calcul' : 'lecture' },
          { v: c, e: 'lecture' },
          { v: askX ? k : a * h * h - b * h + c, e: 'calcul' },
        ]),
        hints: [
          `The vertex of ${m('ax^2 + bx + c')} is at ${m('x = -\\frac{b}{2a}')}.`,
          askX ? `Here ${m(`a = ${a}`)} and ${m(`b = ${b}`)}.` : `The vertex is at ${m(`x = -\\frac{${b}}{2 \\times ${paren(a)}} = ${h}`)}; now evaluate ${m(`f(${h})`)}.`,
        ],
        solution: [
          `Vertex at ${m(`x = -\\frac{b}{2a} = ${h}`)}.`,
          `${m(`f(${h}) = ${a}\\times ${paren(h)}^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}\\times ${paren(h)}${signed(c)} = ${k}`)}.`,
          askX ? `The ${word} is reached at ${m(`x = ${h}`)}.` : `The ${word} value is ${m(`${k}`)}.`,
        ],
        meta: { form, a, b, c, h, k, ans },
      };
    }
    // factored: f(x) = a (x - p)(x - q): vertex at (p+q)/2
    const a = rng.pick([-2, -1, 1, 2, 3]);
    const p = rng.int(-9, 9);
    let q = rng.int(-9, 9);
    if (q === p) q += 2 * rng.sign();
    if ((p + q) % 2 !== 0) q += 1;
    if (q === p) q += 2;
    const h = (p + q) / 2;
    const k = a * (h - p) * (h - q);
    const askMinX = rng.bool();
    const word = a > 0 ? 'minimum' : 'maximum';
    const ans = askMinX ? h : k;
    return {
      prompt: `${m(`f(x) = ${a === 1 ? '' : a === -1 ? '-' : a}(x${signed(-p)})(x${signed(-q)})`)}\n\nThe graph of ${m('y = f(x)')} in the ${m('xy')}-plane is a parabola. ${askMinX ? `What is the ${m('x')}-coordinate of the vertex?` : `What is the ${word} value of ${m('f(x)')}?`}`,
      ...numAnswer(rng, f, frac(ans), [
        { v: askMinX ? -h : a * p * q, e: askMinX ? 'calcul' : 'lecture' },
        { v: askMinX ? p : k + 2 * a, e: 'methode' },
        { v: askMinX ? q : -k, e: 'calcul' },
      ]),
      hints: ['The vertex of a parabola is halfway between its two zeros.', `The zeros are ${m(`x = ${p}`)} and ${m(`x = ${q}`)}.`],
      solution: [`Zeros: ${m(`${p}`)} and ${m(`${q}`)}; vertex at ${m(`x = \\frac{${p} + ${paren(q)}}{2} = ${h}`)}.`, `${m(`f(${h}) = ${a}(${h}${signed(-p)})(${h}${signed(-q)}) = ${k}`)}.`, askMinX ? `${m(`x = ${h}`)}.` : `The ${word} value is ${m(`${k}`)}.`],
      meta: { form, a, p, q, h, k, ans },
    };
  },
});

// ---------------------------------------------------------------- exponential models
export const satExponential = defineGenerator({
  id: 'sat-exponential',
  subject: 'sat',
  skill: 'adv-nonlinear-functions',
  title: 'Exponential functions and models',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 85,
  build(rng, d, f) {
    if (f === 'mcq' && rng.bool(0.6)) {
      // which function models: P0 increases/decreases by r% every k years
      const P0 = rng.int(2, 90) * 100;
      const r = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25]);
      const up = rng.bool();
      const k = d === 'hard' ? rng.int(2, 6) : 1;
      const base = up ? 1 + r / 100 : 1 - r / 100;
      const bs = `${Math.round(base * 100) / 100}`;
      const wrong = up ? 1 - r / 100 : 1 + r / 100;
      const ws = `${Math.round(wrong * 100) / 100}`;
      const exp = k === 1 ? 't' : `\\frac{t}{${k}}`;
      const wexp = k === 1 ? `${r}t` : `${k}t`;
      return {
        prompt: `The population of a town was ${m(`${P0}`)} at the start of a study. The population ${up ? 'increased' : 'decreased'} by ${m(`${r}\\%`)} every ${k === 1 ? 'year' : `${k} years`} after that. Which equation gives the population ${m('P')}, ${m('t')} years after the start of the study?`,
        ...textMcq(rng, m(`P = ${P0}(${bs})^{${exp}}`), [
          { t: m(`P = ${P0}(${ws})^{${exp}}`), e: 'lecture' },
          { t: m(`P = ${P0}(${bs})^{${k === 1 ? `${k + 1}t` : `${k}t`}}`), e: 'methode' },
          { t: m(`P = ${P0}(${r / 100})^{${exp}}`), e: 'cours' },
          { t: m(`P = ${P0} ${up ? '+' : '-'} ${wexp}`), e: 'cours' },
        ]),
        hints: [`A change of ${m('r\\%')} per period multiplies the quantity by ${m('1 \\pm \\frac{r}{100}')} each period.`, `The number of periods after ${m('t')} years is ${m(exp)}.`],
        solution: [`Growth factor per period: ${m(`1 ${up ? '+' : '-'} ${r / 100} = ${bs}`)}.`, `Number of periods after ${m('t')} years: ${m(exp)}.`, `${m(`P = ${P0}(${bs})^{${exp}}`)}.`],
        meta: { kind: 'model', P0, r, up, k },
      };
    }
    if (d === 'medium') {
      // doubles / halves every k hours: value after n*k hours
      const up = rng.bool();
      const k = rng.int(2, 8);
      const n = rng.int(2, 5);
      const P0 = up ? rng.int(3, 60) * 10 : rng.int(1, 9) * 2 ** n * 10;
      const ans = up ? P0 * 2 ** n : P0 / 2 ** n;
      return {
        prompt: `A sample of a substance has a mass of ${m(`${P0}`)} grams. Its mass ${up ? 'doubles' : 'is halved'} every ${m(`${k}`)} hours. What is the mass of the sample, in grams, ${m(`${n * k}`)} hours later?`,
        ...numAnswer(rng, f, frac(ans), [
          { v: up ? P0 * 2 * n : P0 / (2 * n), e: 'methode' },
          { v: up ? P0 * 2 ** (n * k) : P0 / 2 ** (n - 1), e: 'calcul' },
          { v: up ? P0 + 2 * n * k : P0 - n * 10, e: 'cours' },
        ]),
        hints: ['Count how many doubling (or halving) periods fit in the elapsed time.', `${m(`${n * k} \\div ${k} = ${n}`)} periods.`],
        solution: [`${m(`${n}`)} periods of ${m(`${k}`)} hours.`, `Mass: ${m(`${P0} \\times ${up ? '2' : '\\left(\\frac{1}{2}\\right)'}^{${n}}`)}.`, `${m(`= ${ans}`)} grams.`],
        meta: { kind: 'doubling', P0, up, k, n, ans },
      };
    }
    // hard: f(x) = a b^x passes through (x1, y1), (x1 + 1, y2) -> f(x3)
    const a = rng.int(2, 9) * rng.pick([1, 1, -1]);
    const b = rng.pick([2, 3, 4, 5]);
    const x1 = rng.int(0, 2);
    let x3 = rng.int(x1 + 2, x1 + 4);
    // SPR answers must fit in 5 characters
    while (Math.abs(a) * b ** x3 > 9999) x3--;
    const y = (x: number) => a * b ** x;
    const ans = y(x3);
    return {
      prompt: `For the exponential function ${m('f')}, ${m(`f(${x1}) = ${y(x1)}`)} and ${m(`f(${x1 + 1}) = ${y(x1 + 1)}`)}. If ${m('f(x) = ab^x')}, where ${m('a')} and ${m('b')} are constants, what is the value of ${m(`f(${x3})`)}?`,
      ...numAnswer(rng, f, frac(ans), [
        { v: y(x1 + 1) + (y(x1 + 1) - y(x1)) * (x3 - x1 - 1), e: 'cours' },
        { v: a * b * x3, e: 'methode' },
        { v: y(x3 - 1), e: 'calcul' },
      ]),
      hints: ['Divide two consecutive values of an exponential function to find the base $b$.', `${m(`b = \\frac{f(${x1 + 1})}{f(${x1})}`)}.`],
      solution: [`${m(`b = \\frac{${y(x1 + 1)}}{${y(x1)}} = ${b}`)}, and ${m(`a = \\frac{${y(x1)}}{${b}^{${x1}}} = ${a}`)}.`, `${m(`f(x) = ${a}\\cdot ${b}^x`)}.`, `${m(`f(${x3}) = ${ans}`)}.`],
      meta: { kind: 'two-points', a, b, x1, x3, ans },
    };
  },
});

// ---------------------------------------------------------------- function transformations
export const satTransform = defineGenerator({
  id: 'sat-transform',
  subject: 'sat',
  skill: 'adv-nonlinear-functions',
  title: 'Function transformations',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 90,
  build(rng, d, f) {
    const xs = [-2, -1, 0, 1, 2, 3, 4, 5];
    const start = rng.int(0, 2);
    const cols = xs.slice(start, start + 6);
    // distinct f values
    const vals = rng.sample(Array.from({ length: 30 }, (_, i) => i - 12), cols.length);
    const fv = (x: number) => vals[cols.indexOf(x)];
    const h = rng.nonZero(-3, 3);
    const k = rng.nonZero(-9, 9);
    const c = rng.pick([1, -1, 2]);
    // g(x) = c f(x - h) + k ; inputs x with x - h in table
    const valid = cols.map((x) => x + h).filter((x) => cols.includes(x - h));
    const table: Figure = { kind: 'table', headers: ['$x$', ...cols.map((x) => `$${x}$`)], rows: [['$f(x)$', ...cols.map((x) => `$${fv(x)}$`)]] };
    const gTex = `${c === 1 ? '' : c === -1 ? '-' : c}f(x${signed(-h)})${signed(k)}`;
    if (d === 'medium') {
      const x0 = rng.pick(valid);
      const ans = c * fv(x0 - h) + k;
      const wrongIdx = cols.includes(x0 + h) ? x0 + h : x0 - h;
      return {
        prompt: `The table shows some values of the function ${m('f')}. The function ${m('g')} is defined by ${m(`g(x) = ${gTex}`)}. What is the value of ${m(`g(${x0})`)}?`,
        figure: table,
        ...numAnswer(rng, f, frac(ans), [
          { v: c * fv(wrongIdx) + k, e: 'cours' },
          { v: cols.includes(x0) ? c * fv(x0) + k : ans + 3, e: 'methode' },
          { v: c * fv(x0 - h) - k, e: 'calcul' },
        ]),
        hints: [`${m(`g(${x0})`)} uses the value of ${m('f')} at ${m(`${x0}${signed(-h)}`)}.`, `${m(`${x0}${signed(-h)} = ${x0 - h}`)}: read ${m(`f(${x0 - h})`)} in the table.`],
        solution: [`${m(`g(${x0}) = ${c === 1 ? '' : c === -1 ? '-' : c}f(${x0 - h})${signed(k)}`)}.`, `From the table, ${m(`f(${x0 - h}) = ${fv(x0 - h)}`)}.`, `${m(`g(${x0}) = ${ans}`)}.`],
        meta: { kind: 'evaluate', cols, vals, h, k, c, x0, ans },
      };
    }
    // hard: for which x is g(x) = target ?
    const xin = rng.pick(cols);
    const target = c * fv(xin) + k;
    const ans = xin + h;
    return {
      prompt: `The table shows some values of the function ${m('f')}. The function ${m('g')} is defined by ${m(`g(x) = ${gTex}`)}. For what value of ${m('x')} is ${m(`g(x) = ${target}`)}?`,
      figure: table,
      ...numAnswer(rng, f, frac(ans), [
        { v: xin - h, e: 'cours' },
        { v: xin, e: 'methode' },
        { v: -ans, e: 'calcul' },
      ]),
      hints: [`Solve for the value of ${m(`f(x${signed(-h)})`)} first, then find it in the table.`, `${m(`${c === 1 ? '' : c === -1 ? '-' : c}f(x${signed(-h)}) = ${target}${signed(-k)} = ${target - k}`)}.`],
      solution: [
        `${m(`f(x${signed(-h)}) = ${fv(xin)}`)}.`,
        `From the table, ${m(`f(${xin}) = ${fv(xin)}`)}, so ${m(`x${signed(-h)} = ${xin}`)}.`,
        `${m(`x = ${ans}`)}.`,
      ],
      meta: { kind: 'solve', cols, vals, h, k, c, target, ans },
    };
  },
});

// ---------------------------------------------------------------- quadratics: discriminant & number of solutions
export const satDiscriminant = defineGenerator({
  id: 'sat-discriminant',
  subject: 'sat',
  skill: 'adv-nonlinear-equations',
  title: 'Discriminant and number of solutions',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 90,
  build(rng, d, f) {
    if (f === 'mcq' && d === 'medium') {
      const a = rng.nonZero(-4, 4);
      const b = rng.int(-10, 10);
      const type = rng.pick(['zero', 'one', 'two'] as const);
      let c: number;
      if (type === 'one') {
        // b^2 = 4ac : choose b even multiple
        const t = rng.nonZero(-5, 5);
        const bb = 2 * a * t;
        c = a * t * t;
        return countQ(rng, a, bb, c, 'Exactly one');
      }
      const disc0 = b * b;
      c = Math.floor(disc0 / (4 * a)) + (type === 'zero' ? (a > 0 ? rng.int(1, 6) : -rng.int(1, 6)) : a > 0 ? -rng.int(1, 6) : rng.int(1, 6));
      return countQ(rng, a, b, c, type === 'zero' ? 'Zero' : 'Exactly two');
    }
    if (d === 'medium') {
      // x^2 + b x + c = 0 exactly one solution, b given -> c = b^2/4
      const b = 2 * rng.nonZero(-9, 9);
      const c = (b * b) / 4;
      return {
        prompt: `${m(`x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x + c = 0`)}\n\nIn the given equation, ${m('c')} is a constant. The equation has exactly one real solution. What is the value of ${m('c')}?`,
        ...numAnswer(rng, f, frac(c), [
          { v: b * b, e: 'cours' },
          { v: b / 2, e: 'calcul' },
          { v: -c, e: 'calcul' },
        ]),
        hints: ['A quadratic equation has exactly one real solution when its discriminant $b^2 - 4ac$ equals 0.', `Here ${m(`(${b})^2 - 4 \\times 1 \\times c = 0`)}.`],
        solution: [`Discriminant: ${m(`${b}^2 - 4c = ${b * b} - 4c`)}.`, `Set it to 0: ${m(`4c = ${b * b}`)}.`, `${m(`c = ${c}`)}.`],
        meta: { kind: 'one-c', a: 1, b, c },
      };
    }
    // hard: k x^2 + b x + c = 0 exactly one solution -> k = b^2 / (4c)
    const b = rng.nonZero(-12, 12);
    const c = rng.nonZero(-9, 9);
    const k = frac(b * b, 4 * c);
    return {
      prompt: `${m(`kx^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)} = 0`)}\n\nIn the given equation, ${m('k')} is a nonzero constant. The equation has exactly one solution. What is the value of ${m('k')}?`,
      ...numAnswer(rng, f, k, [
        { v: frac(b * b, c), e: 'cours' },
        { v: frac(-b * b, 4 * c), e: 'calcul' },
        { v: frac(4 * c, b * b), e: 'methode' },
      ]),
      hints: ['Exactly one solution ⇔ discriminant $= 0$.', `${m(`(${b})^2 - 4k \\times ${paren(c)} = 0`)}.`],
      solution: [`${m(`${b * b} - ${4 * c}k = 0`)}.`, `${m(`k = \\frac{${b * b}}{${4 * c}}`)}.`, `${m(`k = ${fr(k)}`)}.`],
      meta: { kind: 'one-k', b, c, k },
    };
  },
});

function countQ(rng: Rng, a: number, b: number, c: number, correct: string): Built {
  const disc = b * b - 4 * a * c;
  return {
    prompt: `${m(`${poly([a, b, c])} = 0`)}\n\nHow many distinct real solutions does the given equation have?`,
    ...textMcq(
      rng,
      correct,
      ['Zero', 'Exactly one', 'Exactly two', 'Infinitely many'].filter((x) => x !== correct).map((x) => ({ t: x, e: 'methode' as const })),
    ),
    hints: ['Compute the discriminant $\\Delta = b^2 - 4ac$ and look at its sign.', `${m(`a = ${a}`)}, ${m(`b = ${b}`)}, ${m(`c = ${c}`)}.`],
    solution: [`${m(`\\Delta = ${paren(b)}^2 - 4 \\times ${paren(a)} \\times ${paren(c)} = ${disc}`)}.`, disc > 0 ? 'Positive discriminant: two real solutions.' : disc === 0 ? 'Zero discriminant: one real solution.' : 'Negative discriminant: no real solution.', `Answer: ${correct.toLowerCase()}.`],
    meta: { kind: 'count', a, b, c, disc, correct },
  };
}

// ---------------------------------------------------------------- quadratic equations / systems with a parabola
export const satQuadRoots = defineGenerator({
  id: 'sat-quad-roots',
  subject: 'sat',
  skill: 'adv-nonlinear-equations',
  title: 'Quadratic equations and line–parabola systems',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 95,
  build(rng, d, f) {
    const kind = d === 'medium' ? rng.pick(['positive-root', 'system'] as const) : rng.pick(['sum', 'system-k'] as const);
    if (kind === 'positive-root') {
      const r1 = rng.int(1, 12);
      const r2 = -rng.int(1, 12);
      const a = rng.pick([1, 1, 2, 3]);
      const b = -a * (r1 + r2);
      const c = a * r1 * r2;
      return {
        prompt: `${m(`${poly([a, b, c])} = 0`)}\n\nWhat is the positive solution to the given equation?`,
        ...numAnswer(rng, f, frac(r1), [
          { v: -r2, e: 'calcul' },
          { v: -r1, e: 'calcul' },
          { v: r1 + r2, e: 'methode' },
        ]),
        hints: ['Factor the quadratic (or use the quadratic formula).', a === 1 ? `Find two numbers with product ${m(`${c}`)} and sum ${m(`${-b}`)}.` : `First divide every term by ${m(`${a}`)}.`],
        solution: [`${m(`${a === 1 ? '' : a}(x${signed(-r1)})(x${signed(-r2)}) = 0`)}.`, `Solutions: ${m(`x = ${r1}`)} and ${m(`x = ${r2}`)}.`, `The positive solution is ${m(`${r1}`)}.`],
        meta: { kind, a, b, c, roots: [r1, r2], ans: r1 },
      };
    }
    if (kind === 'sum') {
      // sum of solutions of a x^2 + b x + c = 0 with positive discriminant (non-integer roots)
      const a = rng.pick([2, 3, 4, 5, -2, -3]);
      const b = rng.nonZero(-15, 15);
      let c = rng.int(-12, 12);
      while (b * b - 4 * a * c <= 0) c += a > 0 ? -3 : 3;
      const s = frac(-b, a);
      return {
        prompt: `${m(`${poly([a, b, c])} = 0`)}\n\nWhat is the sum of the solutions to the given equation?`,
        ...numAnswer(rng, f, s, [
          { v: frac(b, a), e: 'calcul' },
          { v: frac(c, a), e: 'cours' },
          { v: frac(-b, 2 * a), e: 'methode' },
        ]),
        hints: ['You don\'t need the solutions themselves: the sum of the solutions of $ax^2 + bx + c = 0$ is $-\\frac{b}{a}$.', `Here ${m(`a = ${a}`)} and ${m(`b = ${b}`)}.`],
        solution: [`The discriminant is positive (${m(`${b * b - 4 * a * c}`)}), so there are two solutions.`, `Their sum is ${m(`-\\frac{b}{a} = -\\frac{${b}}{${a}}`)}.`, `${m(`= ${fr(s)}`)}.`],
        meta: { kind, a, b, c, ans: s },
      };
    }
    if (kind === 'system') {
      // y = x^2 + p x + q and y = m x + n intersect at integer x1, x2
      const x1 = rng.int(-6, 6);
      let x2 = rng.int(-6, 6);
      if (x2 === x1) x2 = x1 + rng.pick([2, 3, -2]);
      const mm = rng.int(-4, 4);
      const n = rng.int(-8, 8);
      // x^2 + p x + q - (m x + n) = (x - x1)(x - x2)
      const p = mm - (x1 + x2);
      const q = n + x1 * x2;
      const big = Math.max(x1, x2);
      const yAns = mm * big + n;
      return {
        prompt: `$$\\begin{aligned} y &= ${poly([1, p, q])} \\\\ y &= ${lin([[mm, 'x']], n)} \\end{aligned}$$\nThe graphs of the equations above intersect at two points. What is the ${m('y')}-coordinate of the intersection point with the greater ${m('x')}-coordinate?`,
        ...numAnswer(rng, f, frac(yAns), [
          { v: big, e: 'lecture' },
          { v: mm * Math.min(x1, x2) + n, e: 'lecture' },
          { v: sq(big) + p * big - q, e: 'calcul' },
        ]),
        hints: ['Set the two expressions for $y$ equal to each other.', `${m(`${poly([1, p, q])} = ${lin([[mm, 'x']], n)}`)}, so ${m(`${poly([1, p - mm, q - n])} = 0`)}.`],
        solution: [`${m(`${poly([1, p - mm, q - n])} = 0`)}.`, `${m(`(x${signed(-x1)})(x${signed(-x2)}) = 0`)}: ${m(`x = ${x1}`)} or ${m(`x = ${x2}`)}.`, `For ${m(`x = ${big}`)}: ${m(`y = ${yAns}`)}.`],
        meta: { kind, p, q, m: mm, n, x1, x2, ans: yAns },
      };
    }
    // y = x^2 + k and y = m x intersect at exactly one point: k = m^2/4
    const mm = 2 * rng.nonZero(-6, 6);
    let c0 = rng.int(-5, 5);
    if (c0 === mm) c0 += 2;
    // y = x^2 + c0 x + k, y = mm x  -> x^2 + (c0 - mm) x + k = 0, one solution -> k = (c0 - mm)^2/4
    const kk = frac(sq(c0 - mm), 4);
    return {
      prompt: `$$\\begin{aligned} y &= ${poly([1, c0, 0])} + k \\\\ y &= ${mm}x \\end{aligned}$$\nIn the system of equations above, ${m('k')} is a constant. The graphs of the two equations intersect at exactly one point. What is the value of ${m('k')}?`,
      ...numAnswer(rng, f, kk, [
        { v: frac(sq(c0 - mm), 2), e: 'calcul' },
        { v: frac(-sq(c0 - mm), 4), e: 'calcul' },
        { v: frac(sq(mm), 4), e: 'methode' },
      ]),
      hints: ['Substitute to get one quadratic equation; exactly one intersection point ⇔ discriminant 0.', `${m(`x^2 ${c0 - mm < 0 ? '-' : '+'} ${Math.abs(c0 - mm)}x + k = 0`)}.`],
      solution: [`${m(`x^2 + ${paren(c0 - mm)}x + k = 0`)}.`, `${m(`\\Delta = ${sq(c0 - mm)} - 4k = 0`)}.`, `${m(`k = ${fr(kk)}`)}.`],
      meta: { kind, c0, m: mm, k: kk },
    };
  },
});

// ---------------------------------------------------------------- radical and rational equations
export const satRadical = defineGenerator({
  id: 'sat-radical',
  subject: 'sat',
  skill: 'adv-nonlinear-equations',
  title: 'Radical and rational equations',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 100,
  build(rng, d, f) {
    if (d === 'hard') {
      // sqrt(x + a) = x - b, roots r (valid, r > b) and s (extraneous, s < b)
      // (x - b)^2 = x + a  -> x^2 - (2b+1) x + b^2 - a = 0 with roots r, s : r + s = 2b + 1
      const b = rng.int(-3, 6);
      const r = b + rng.int(2, 6);
      const s = 2 * b + 1 - r; // s < b since r > b + 1
      const a = b * b - r * s;
      return {
        prompt: `${m(`\\sqrt{x${signed(a)}} = x${signed(-b)}`)}\n\nWhat is the solution to the given equation?`,
        ...numAnswer(rng, f, frac(r), [
          { v: s, e: 'methode' },
          { v: r + s, e: 'calcul' },
          { v: -r, e: 'calcul' },
        ]),
        hints: ['Square both sides, solve the quadratic, then CHECK each solution in the original equation (squaring can create extraneous solutions).', `${m(`x${signed(a)} = (x${signed(-b)})^2`)}.`],
        solution: [
          `${m(`x${signed(a)} = x^2 ${-2 * b < 0 ? '-' : '+'} ${Math.abs(2 * b)}x + ${b * b}`)}, so ${m(`${poly([1, -(2 * b + 1), b * b - a])} = 0`)}.`,
          `${m(`(x${signed(-r)})(x${signed(-s)}) = 0`)}: candidates ${m(`${r}`)} and ${m(`${s}`)}.`,
          `For ${m(`x = ${s}`)} the right side is ${m(`${s - b} < 0`)}, impossible for a square root: the solution is ${m(`x = ${r}`)}.`,
        ],
        meta: { kind: 'radical', a, b, r, s },
      };
    }
    // a/(x + b) = c/(x + e) -> a(x + e) = c(x + b) -> x = (c b - a e)/(a - c)
    const a = rng.int(1, 9);
    let c = rng.int(1, 9);
    if (c === a) c = a + 1;
    const b = rng.int(-6, 6);
    let e = rng.int(-6, 6);
    if (e === b) e = b + 1;
    const x = F.div(frac(c * b - a * e), frac(a - c));
    // avoid x making a denominator zero (cannot happen unless b = e)
    return {
      prompt: `${m(`\\frac{${a}}{x${signed(b)}} = \\frac{${c}}{x${signed(e)}}`)}\n\nWhat value of ${m('x')} satisfies the equation above?`,
      ...numAnswer(rng, f, x, [
        { v: F.div(frac(c * b - a * e), frac(c - a)), e: 'calcul' },
        { v: F.div(frac(a * b - c * e), frac(a - c)), e: 'methode' },
        { v: frac(-b), e: 'lecture' },
      ]),
      hints: ['Cross-multiply to remove the fractions.', `${m(`${a}(x${signed(e)}) = ${c}(x${signed(b)})`)}.`],
      solution: [`${m(`${lin([[a, 'x']], a * e)} = ${lin([[c, 'x']], c * b)}`)}.`, `${m(`${a - c}x = ${c * b - a * e}`)}.`, `${m(`x = ${fr(x)}`)} (it doesn't cancel a denominator).`],
      meta: { kind: 'rational', a, b, c, e, x },
    };
  },
});

// ---------------------------------------------------------------- equivalent expressions
export const satExpand = defineGenerator({
  id: 'sat-expand',
  subject: 'sat',
  skill: 'adv-equivalent',
  title: 'Equivalent expressions (expand, factor)',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 80,
  build(rng, d, f) {
    if (d === 'medium') {
      // (a x + b)(c x + e) = A x^2 + B x + C ; ask B (spr) or choose expansion (mcq)
      const a = rng.nonZero(-5, 5);
      const b = rng.nonZero(-9, 9);
      const c = rng.nonZero(-5, 5);
      const e = rng.nonZero(-9, 9);
      const A = a * c;
      const B = a * e + b * c;
      const C = b * e;
      if (f === 'spr') {
        return {
          prompt: `The expression ${m(`(${lin([[a, 'x']], b)})(${lin([[c, 'x']], e)})`)} is equivalent to ${m('ax^2 + bx + c')}, where ${m('a')}, ${m('b')}, and ${m('c')} are constants. What is the value of ${m('b')}?`,
          ...numAnswer(rng, f, frac(B), []),
          hints: ['Expand with FOIL: First, Outer, Inner, Last.', `The ${m('x')}-terms come from the Outer and Inner products.`],
          solution: [`Outer: ${m(`${a}x \\times ${paren(e)} = ${a * e}x`)}; Inner: ${m(`${b} \\times ${c}x = ${b * c}x`)}.`, `${m(`b = ${a * e} + ${paren(b * c)}`)}.`, `${m(`b = ${B}`)}.`],
          meta: { kind: 'expand', a, b, c, e, A, B, C, ans: B },
        };
      }
      return {
        prompt: `Which expression is equivalent to ${m(`(${lin([[a, 'x']], b)})(${lin([[c, 'x']], e)})`)}?`,
        ...textMcq(rng, m(poly([A, B, C])), [
          { t: m(poly([A, a * e - b * c, C])), e: 'calcul' },
          { t: m(poly([A, 0, C])), e: 'methode' },
          { t: m(poly([A, B, -C])), e: 'calcul' },
          { t: m(poly([a + c, B, C])), e: 'calcul' },
        ]),
        hints: ['Distribute each term of the first factor over the second factor.', `${m(`${a}x \\times ${c}x = ${A}x^2`)}.`],
        solution: [`${m(`${A}x^2 + ${paren(a * e)}x + ${paren(b * c)}x + ${paren(C)}`)}.`, `Combine the ${m('x')}-terms: ${m(`${B}x`)}.`, `${m(poly([A, B, C]))}.`],
        meta: { kind: 'expand-mcq', a, b, c, e, A, B, C, choices: 'poly' },
      };
    }
    const kind = rng.pick(['diff-squares', 'rational'] as const);
    if (kind === 'diff-squares') {
      // (a x + b)^2 - (a x - b)^2 = 4ab x  ; ask coefficient k in kx
      const a = rng.int(2, 7);
      const b = rng.nonZero(-9, 9);
      const k = 4 * a * b;
      return {
        prompt: `The expression ${m(`(${lin([[a, 'x']], b)})^2 - (${lin([[a, 'x']], -b)})^2`)} is equivalent to ${m('kx')}, where ${m('k')} is a constant. What is the value of ${m('k')}?`,
        ...numAnswer(rng, f, frac(k), [
          { v: 2 * a * b, e: 'calcul' },
          { v: 0, e: 'methode' },
          { v: 2 * b * b, e: 'calcul' },
        ]),
        hints: ['Use the difference of squares $u^2 - v^2 = (u - v)(u + v)$, or expand both squares.', `With ${m(`u = ${lin([[a, 'x']], b)}`)} and ${m(`v = ${lin([[a, 'x']], -b)}`)}: ${m(`u - v = ${2 * b}`)}.`],
        solution: [`${m(`u - v = ${2 * b}`)} and ${m(`u + v = ${2 * a}x`)}.`, `${m(`(u - v)(u + v) = ${2 * b} \\times ${2 * a}x`)}.`, `${m(`k = ${k}`)}.`],
        meta: { kind, a, b, k },
      };
    }
    // 1/(x + p) + 1/(x + q) = (2x + p + q)/((x + p)(x + q)) ; spr: numerator at x = 0 ... ask "a" in (ax + b)/...
    const p = rng.nonZero(-8, 8);
    let q = rng.nonZero(-8, 8);
    if (q === p) q = -p === p ? p + 1 : -p;
    const r = rng.int(2, 5);
    // r/(x + p) + 1/(x + q) = ((r + 1) x + r q + p)/((x+p)(x+q))
    const A = r + 1;
    const B = r * q + p;
    return {
      prompt: `The expression ${m(`\\frac{${r}}{x${signed(p)}} + \\frac{1}{x${signed(q)}}`)} is equivalent to ${m(`\\frac{ax + b}{(x${signed(p)})(x${signed(q)})}`)} for ${m(`x \\ne ${-p}`)} and ${m(`x \\ne ${-q}`)}, where ${m('a')} and ${m('b')} are constants. What is the value of ${m('b')}?`,
      ...numAnswer(rng, f, frac(B), [
        { v: r * p + q, e: 'calcul' },
        { v: A, e: 'lecture' },
        { v: p + q, e: 'methode' },
      ]),
      hints: ['Use the common denominator $(x+p)(x+q)$: multiply each numerator by the missing factor.', `${m(`\\frac{${r}(x${signed(q)})}{(x${signed(p)})(x${signed(q)})} + \\frac{x${signed(p)}}{(x${signed(p)})(x${signed(q)})}`)}.`],
      solution: [`Numerator: ${m(`${r}(x${signed(q)}) + (x${signed(p)})`)}.`, `${m(`= ${A}x + ${paren(r * q)} + ${paren(p)}`)}.`, `${m(`b = ${B}`)}.`],
      meta: { kind, p, q, r, A, B },
    };
  },
});

// ---------------------------------------------------------------- literal equations (solve for a variable)
interface Literal {
  eq: string;
  target: string;
  others: string[];
  correct: string;
  /** solving steps (Markdown + TeX) */
  steps: string[];
  distractors: string[];
  /** numeric check: residual(env) = 0 for the original equation */
  residual: (v: Record<string, number>) => number;
  /** functions of the other variables, same order as [correct, ...distractors] */
  fns: ((v: Record<string, number>) => number)[];
}

function literalTemplates(rng: Rng): Literal[] {
  const k = rng.int(2, 9);
  const c = rng.int(2, 15);
  const n = rng.int(2, 6);
  return [
    {
      eq: `y = \\frac{${k}x}{w} + ${c}`,
      steps: [`Subtract ${c}: $\\frac{${k}x}{w} = y - ${c}$.`, `Multiply by $w$: $${k}x = w(y - ${c})$.`, `Divide by $${k}$.`],
      target: 'x',
      others: ['y', 'w'],
      correct: `x = \\frac{w(y - ${c})}{${k}}`,
      distractors: [`x = \\frac{w(y + ${c})}{${k}}`, `x = \\frac{${k}(y - ${c})}{w}`, `x = \\frac{wy}{${k}} - ${c}`],
      residual: (v) => v.y - (k * v.x) / v.w - c,
      fns: [(v) => (v.w * (v.y - c)) / k, (v) => (v.w * (v.y + c)) / k, (v) => (k * (v.y - c)) / v.w, (v) => (v.w * v.y) / k - c],
    },
    {
      eq: `A = \\frac{1}{2}h(b + c)`,
      steps: ['Multiply by 2: $2A = h(b + c)$.', 'Divide by $(b + c)$.'],
      target: 'h',
      others: ['A', 'b', 'c'],
      correct: `h = \\frac{2A}{b + c}`,
      distractors: [`h = \\frac{A}{2(b + c)}`, `h = 2A - b - c`, `h = \\frac{2A}{b} + c`],
      residual: (v) => v.A - 0.5 * v.h * (v.b + v.c),
      fns: [(v) => (2 * v.A) / (v.b + v.c), (v) => v.A / (2 * (v.b + v.c)), (v) => 2 * v.A - v.b - v.c, (v) => (2 * v.A) / v.b + v.c],
    },
    {
      eq: `v = u + at`,
      steps: ['Subtract $u$: $v - u = at$.', 'Divide by $t$.'],
      target: 'a',
      others: ['v', 'u', 't'],
      correct: `a = \\frac{v - u}{t}`,
      distractors: [`a = \\frac{v + u}{t}`, `a = \\frac{v}{t} - u`, `a = \\frac{t}{v - u}`],
      residual: (v) => v.v - v.u - v.a * v.t,
      fns: [(v) => (v.v - v.u) / v.t, (v) => (v.v + v.u) / v.t, (v) => v.v / v.t - v.u, (v) => v.t / (v.v - v.u)],
    },
    {
      eq: `P = ${n}\\ell + ${n}w`,
      steps: [`Subtract $${n}\\ell$: $P - ${n}\\ell = ${n}w$.`, `Divide by $${n}$.`],
      target: 'w',
      others: ['P', '\\ell'],
      correct: `w = \\frac{P - ${n}\\ell}{${n}}`,
      distractors: [`w = P - \\ell`, `w = \\frac{P - \\ell}{${n}}`, `w = \\frac{P}{${n}} - ${n}\\ell`],
      residual: (v) => v.P - n * v['\\ell'] - n * v.w,
      fns: [(v) => (v.P - n * v['\\ell']) / n, (v) => v.P - v['\\ell'], (v) => (v.P - v['\\ell']) / n, (v) => v.P / n - n * v['\\ell']],
    },
    {
      eq: `V = \\frac{1}{3}\\pi r^2 h`,
      steps: ['Multiply by 3: $3V = \\pi r^2 h$.', 'Divide by $\\pi r^2$.'],
      target: 'h',
      others: ['V', 'r'],
      correct: `h = \\frac{3V}{\\pi r^2}`,
      distractors: [`h = \\frac{V}{3\\pi r^2}`, `h = 3V\\pi r^2`, `h = \\frac{3V}{\\pi r}`],
      residual: (v) => v.V - (Math.PI * v.r * v.r * v.h) / 3,
      fns: [(v) => (3 * v.V) / (Math.PI * v.r * v.r), (v) => v.V / (3 * Math.PI * v.r * v.r), (v) => 3 * v.V * Math.PI * v.r * v.r, (v) => (3 * v.V) / (Math.PI * v.r)],
    },
    {
      eq: `E = \\frac{1}{2}mv^2`,
      steps: ['Multiply by 2: $2E = mv^2$.', 'Divide by $m$: $v^2 = \\frac{2E}{m}$.', 'Take the positive square root ($v > 0$).'],
      target: 'v',
      others: ['E', 'm'],
      correct: `v = \\sqrt{\\frac{2E}{m}}`,
      distractors: [`v = \\sqrt{\\frac{E}{2m}}`, `v = \\frac{2E}{m}`, `v = \\sqrt{2Em}`],
      residual: (v) => v.E - 0.5 * v.m * v.v * v.v,
      fns: [(v) => Math.sqrt((2 * v.E) / v.m), (v) => Math.sqrt(v.E / (2 * v.m)), (v) => (2 * v.E) / v.m, (v) => Math.sqrt(2 * v.E * v.m)],
    },
    {
      eq: `\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{q}`,
      steps: ['Subtract $\\frac{1}{p}$: $\\frac{1}{q} = \\frac{1}{f} - \\frac{1}{p} = \\frac{p - f}{fp}$.', 'Take reciprocals.'],
      target: 'q',
      others: ['f', 'p'],
      correct: `q = \\frac{fp}{p - f}`,
      distractors: [`q = \\frac{fp}{f - p}`, `q = p - f`, `q = \\frac{p - f}{fp}`],
      residual: (v) => 1 / v.f - 1 / v.p - 1 / v.q,
      fns: [(v) => (v.f * v.p) / (v.p - v.f), (v) => (v.f * v.p) / (v.f - v.p), (v) => v.p - v.f, (v) => (v.p - v.f) / (v.f * v.p)],
    },
  ];
}

export const satLiteral = defineGenerator({
  id: 'sat-literal',
  subject: 'sat',
  skill: 'adv-equivalent',
  title: 'Solve an equation for one of its variables',
  formats: ['mcq'],
  difficulties: ['medium', 'hard'],
  targetSec: 75,
  build(rng, d) {
    const all = literalTemplates(rng);
    const t = d === 'medium' ? rng.pick(all.slice(0, 4)) : rng.pick(all.slice(3));
    const others = t.others.map((o) => m(o)).join(', ');
    return {
      prompt: `${m(t.eq)}\n\nThe given equation relates the positive quantities ${others} and ${m(t.target)}. Which equation correctly expresses ${m(t.target)} in terms of the other variable${t.others.length > 1 ? 's' : ''}?`,
      ...textMcq(rng, m(t.correct), t.distractors.map((x, i) => ({ t: m(x), e: i === 0 ? ('calcul' as const) : ('methode' as const) }))),
      hints: [`Undo the operations applied to ${m(t.target)} one at a time, in reverse order, doing the same to both sides.`, `Start by isolating the term that contains ${m(t.target)}.`],
      solution: [...t.steps, `${m(t.correct)}.`],
      meta: { kind: 'literal', eq: t.eq },
    };
  },
});

export { literalTemplates };

// ---------------------------------------------------------------- exponent rules
export const satExponents = defineGenerator({
  id: 'sat-exponents',
  subject: 'sat',
  skill: 'adv-equivalent',
  title: 'Exponent rules and radicals',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 70,
  build(rng, d, f) {
    if (d === 'medium') {
      // (x^a * x^b) / x^c = x^k
      const a = rng.int(2, 9);
      const b = rng.int(2, 9);
      const c = rng.int(1, 9);
      const k = a + b - c;
      return {
        prompt: `For ${m('x > 0')}, the expression ${m(`\\frac{x^{${a}} \\cdot x^{${b}}}{x^{${c}}}`)} is equivalent to ${m('x^k')}. What is the value of ${m('k')}?`,
        ...numAnswer(rng, f, frac(k), [
          { v: (a * b) / c, e: 'cours' },
          { v: a * b - c, e: 'cours' },
          { v: a + b + c, e: 'calcul' },
        ]),
        hints: ['When multiplying powers of the same base, add exponents; when dividing, subtract.', `Numerator: ${m(`x^{${a} + ${b}}`)}.`],
        solution: [`${m(`x^{${a}} \\cdot x^{${b}} = x^{${a + b}}`)}.`, `${m(`\\frac{x^{${a + b}}}{x^{${c}}} = x^{${a + b} - ${c}}`)}.`, `${m(`k = ${k}`)}.`],
        meta: { kind: 'powers', a, b, c, k: frac(k) },
      };
    }
    // hard: (cube root of x^p) * sqrt(x^q) = x^k  (k rational)
    const p = rng.int(1, 8);
    const q = rng.int(1, 8);
    const r1 = rng.pick([3, 4, 5]);
    const k = F.add(frac(p, r1), frac(q, 2));
    return {
      prompt: `For ${m('x > 0')}, the expression ${m(`\\sqrt[${r1}]{x^{${p}}} \\cdot \\sqrt{x^{${q}}}`)} is equivalent to ${m('x^k')}, where ${m('k')} is a constant. What is the value of ${m('k')}?`,
      ...numAnswer(rng, f, k, [
        { v: F.mul(frac(p, r1), frac(q, 2)), e: 'cours' },
        { v: frac(p + q, r1 + 2), e: 'methode' },
        { v: F.add(frac(r1, p), frac(2, q)), e: 'cours' },
      ]),
      hints: ['Rewrite each radical as a power: $\\sqrt[n]{x^m} = x^{m/n}$.', `${m(`\\sqrt[${r1}]{x^{${p}}} = x^{\\frac{${p}}{${r1}}}`)}.`],
      solution: [`${m(`x^{\\frac{${p}}{${r1}}} \\cdot x^{\\frac{${q}}{2}}`)}.`, `Add the exponents: ${m(`\\frac{${p}}{${r1}} + \\frac{${q}}{2}`)}.`, `${m(`k = ${fr(k)}`)}.`],
      meta: { kind: 'radicals', p, q, r1, k },
    };
  },
});

export const ADVANCED_GENERATORS = [satQuadVertex, satExponential, satTransform, satDiscriminant, satQuadRoots, satRadical, satExpand, satLiteral, satExponents];
