/** SAT Problem-Solving and Data Analysis generators. All data are fictional. */
import { frac, gcd, toFrac } from '../../lib/fraction';
import type { Rng } from '../../lib/rng';
import { plot, type Pt } from '../../lib/svg';
import { defineGenerator, type Built } from '../define';
import { fr, m } from '../helpers';
import type { Figure } from '../types';
import { dollars, numAnswer, textMcq, texOf } from './common';

const pct = (x: number) => m(`${texOf(x)}\\%`);

// ---------------------------------------------------------------- ratios, rates, proportional relationships, units
export const satRatios = defineGenerator({
  id: 'sat-ratios',
  subject: 'sat',
  skill: 'psda-ratios',
  title: 'Rates, ratios and unit conversion',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 80,
  build(rng, d, f) {
    const kind = d === 'medium' ? rng.pick(['rate', 'ratio', 'direct'] as const) : rng.pick(['units', 'ratio-change'] as const);
    if (kind === 'rate') {
      const mins = rng.pick([3, 4, 5, 6, 10, 12, 15, 20]);
      const per = rng.int(2, 12); // every listed `mins` divides 60, so the answer is an integer
      const h = rng.int(2, 8);
      const ans = (per * 60 * h) / mins;
      return {
        prompt: `A machine fills ${m(`${per}`)} bottles every ${m(`${mins}`)} minutes. At this rate, how many bottles does the machine fill in ${m(`${h}`)} hours?`,
        ...numAnswer(rng, f, frac(ans), [
          { v: per * h, e: 'lecture' },
          { v: (per * h * mins) / 60, e: 'methode' },
          { v: per * 60 * h, e: 'calcul' },
        ]),
        hints: ['Convert hours to minutes, then use the rate (bottles per minute).', `${m(`${h}`)} hours ${m(`= ${60 * h}`)} minutes.`],
        solution: [`Rate: ${m(`\\frac{${per}}{${mins}}`)} bottles per minute.`, `In ${m(`${60 * h}`)} minutes: ${m(`\\frac{${per}}{${mins}} \\times ${60 * h}`)}.`, `${m(`= ${ans}`)} bottles.`],
        meta: { kind, per, mins, h, ans },
      };
    }
    if (kind === 'ratio') {
      const a = rng.int(1, 7);
      let b = rng.int(2, 9);
      while (gcd(a, b) !== 1 || a === b) b = rng.int(2, 9);
      const k = rng.int(3, 15);
      const total = (a + b) * k;
      return {
        prompt: `In a school club, the ratio of juniors to seniors is ${m(`${a} : ${b}`)}. The club has ${m(`${total}`)} members, all juniors or seniors. How many seniors are in the club?`,
        ...numAnswer(rng, f, frac(b * k), [
          { v: a * k, e: 'lecture' },
          { v: frac(total * b, a), e: 'methode' },
          { v: total - b, e: 'methode' },
        ]),
        hints: ['A ratio a : b splits the total into a + b equal parts.', `There are ${m(`${a} + ${b} = ${a + b}`)} parts.`],
        solution: [`One part: ${m(`\\frac{${total}}{${a + b}} = ${k}`)} members.`, `Seniors: ${m(`${b}`)} parts.`, `${m(`${b} \\times ${k} = ${b * k}`)}.`],
        meta: { kind, a, b, k, total, ans: b * k },
      };
    }
    if (kind === 'direct') {
      const kk = rng.int(2, 9);
      const x1 = rng.int(2, 12);
      const x2 = rng.int(13, 40);
      return {
        prompt: `The quantity ${m('y')} is directly proportional to ${m('x')}. When ${m(`x = ${x1}`)}, ${m(`y = ${kk * x1}`)}. What is the value of ${m('y')} when ${m(`x = ${x2}`)}?`,
        ...numAnswer(rng, f, frac(kk * x2), [
          { v: kk * x1 + (x2 - x1), e: 'methode' },
          { v: frac(x1 * x2, kk * x1), e: 'calcul' },
          { v: kk * x1 * x2, e: 'calcul' },
        ]),
        hints: ['Directly proportional means $y = kx$ for a constant $k$.', `${m(`k = \\frac{${kk * x1}}{${x1}}`)}.`],
        solution: [`${m(`k = \\frac{${kk * x1}}{${x1}} = ${kk}`)}.`, `${m(`y = ${kk}x`)}.`, `${m(`y = ${kk} \\times ${x2} = ${kk * x2}`)}.`],
        meta: { kind, k: kk, x1, x2, ans: kk * x2 },
      };
    }
    if (kind === 'units') {
      // 1 mile = 5280 ft, 1 h = 3600 s: v mph = 22v/15 ft/s ; use multiples of 15 mph
      const mph = 15 * rng.int(1, 5);
      return unitQ(rng, f, (mph * 22) / 15, mph);
    }
    // ratio change: a:b, after adding n of b the ratio is c:d -> original total
    const a = rng.int(2, 5);
    const b = rng.int(a + 1, 9);
    const k = rng.int(3, 12);
    const add = rng.int(2, 10);
    // after adding `add` to the first group: (a k + add) : (b k)
    const g = gcd(a * k + add, b * k);
    return {
      prompt: `A bag contains only red and blue marbles in the ratio ${m(`${a} : ${b}`)}. After ${m(`${add}`)} red marbles are added, the ratio of red to blue marbles becomes ${m(`${(a * k + add) / g} : ${(b * k) / g}`)}. How many blue marbles are in the bag?`,
      ...numAnswer(rng, f, frac(b * k), [
        { v: a * k, e: 'lecture' },
        { v: (b * k) / g, e: 'methode' },
        { v: a * k + add, e: 'lecture' },
      ]),
      hints: [`Write the numbers of marbles as ${m(`${a}k`)} red and ${m(`${b}k`)} blue.`, `${m(`\\frac{${a}k + ${add}}{${b}k} = \\frac{${(a * k + add) / g}}{${(b * k) / g}}`)}.`],
      solution: [
        `${m(`${(b * k) / g}(${a}k + ${add}) = ${(a * k + add) / g} \\times ${b}k`)}.`,
        `${m(`${((b * k) / g) * a}k + ${((b * k) / g) * add} = ${((a * k + add) / g) * b}k`)}, so ${m(`k = ${k}`)}.`,
        `Blue marbles: ${m(`${b} \\times ${k} = ${b * k}`)}.`,
      ],
      meta: { kind, a, b, k, add, ans: b * k },
    };
  },
});

function unitQ(rng: Rng, f: 'mcq' | 'spr' | 'input', fps: number, mph: number): Built {
  return {
    prompt: `A cyclist travels at a constant speed of ${m(`${fps}`)} feet per second. What is this speed in miles per hour? (${m('1')} mile ${m('= 5{,}280')} feet)`,
    ...numAnswer(rng, f, frac(mph), [
      { v: frac(fps * 60, 5280), e: 'methode' },
      { v: frac(fps * 5280, 3600), e: 'methode' },
      { v: fps * 60, e: 'cours' },
    ]),
    hints: ['Multiply by conversion factors so that the units cancel: seconds → hours, feet → miles.', `${m('1')} hour ${m('= 3{,}600')} seconds.`],
    solution: [`${m(`${fps}\\,\\frac{\\text{ft}}{\\text{s}} \\times \\frac{3600\\,\\text{s}}{1\\,\\text{h}} \\times \\frac{1\\,\\text{mi}}{5280\\,\\text{ft}}`)}.`, `${m(`= \\frac{${fps} \\times 3600}{5280}`)}.`, `${m(`= ${mph}`)} miles per hour.`],
    meta: { kind: 'units', fps, mph, ans: mph },
  };
}

// ---------------------------------------------------------------- percentages
export const satPercent = defineGenerator({
  id: 'sat-percent',
  subject: 'sat',
  skill: 'psda-percentages',
  title: 'Percentages',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 80,
  build(rng, d, f) {
    const kind = d === 'medium' ? rng.pick(['change', 'of'] as const) : rng.pick(['successive', 'reverse', 'percent-of-percent'] as const);
    if (kind === 'change') {
      const old = rng.int(4, 40) * 5;
      const p = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
      const up = rng.bool();
      const nw = (old * (100 + (up ? p : -p))) / 100;
      return {
        prompt: `The price of a jacket changed from ${m(dollars(old))} to ${m(dollars(nw))}. By what percent did the price ${up ? 'increase' : 'decrease'}?${f === 'spr' ? ' (Disregard the percent sign when entering your answer.)' : ''}`,
        ...numAnswer(
          rng,
          f,
          frac(p),
          [
            { v: (Math.abs(nw - old) / nw) * 100, e: 'methode' },
            { v: Math.abs(nw - old), e: 'lecture' },
            { v: (nw / old) * 100, e: 'methode' },
          ],
          f === 'mcq' ? (x) => pct(Math.round(x * 100) / 100) : undefined,
        ),
        hints: ['Percent change = (change ÷ ORIGINAL value) × 100.', `The change is ${m(`${Math.abs(nw - old)}`)}.`],
        solution: [`Change: ${m(`${Math.abs(nw - old)}`)}.`, `${m(`\\frac{${Math.abs(nw - old)}}{${old}} \\times 100`)}.`, `${m(`= ${p}\\%`)}.`],
        meta: { kind, old, nw, p, ans: p },
      };
    }
    if (kind === 'of') {
      const p = rng.pick([4, 6, 8, 12, 15, 18, 24, 35, 45, 65]);
      const base = rng.int(2, 30) * 20;
      const ans = (p * base) / 100;
      return {
        prompt: `What is ${m(`${p}\\%`)} of ${m(`${base}`)}?`,
        ...numAnswer(rng, f, toFrac(ans), [
          { v: (base * 100) / p, e: 'methode' },
          { v: p * base, e: 'calcul' },
          { v: base - ans, e: 'lecture' },
        ]),
        hints: ['p% of N means (p/100) × N.', `${m(`\\frac{${p}}{100} \\times ${base}`)}.`],
        solution: [`${m(`${p}\\% = ${p / 100}`)}.`, `${m(`${p / 100} \\times ${base}`)}.`, `${m(`= ${texOf(ans)}`)}.`],
        meta: { kind, p, base, ans },
      };
    }
    if (kind === 'successive') {
      const p = rng.pick([10, 20, 25, 30, 40, 50]);
      const q = rng.pick([10, 20, 25, 30, 40, 50]);
      const factor = ((100 + p) * (100 - q)) / 10000;
      const net = Math.round((factor - 1) * 10000) / 100; // percent
      const word = net >= 0 ? 'increase' : 'decrease';
      return {
        prompt: `A store increased the price of a product by ${m(`${p}\\%`)}. Later, it decreased the new price by ${m(`${q}\\%`)}. The final price is what percent of the original price?`,
        ...numAnswer(
          rng,
          f,
          frac(Math.round(factor * 10000), 100),
          [
            { v: 100 + p - q, e: 'methode' },
            { v: Math.abs(net), e: 'lecture' },
            { v: (100 - p) * (100 + q) / 100, e: 'lecture' },
          ],
          f === 'mcq' ? (x) => pct(x) : undefined,
        ),
        hints: ['Successive percent changes multiply: an increase of p% multiplies by (1 + p/100).', `First change: × ${m(`${1 + p / 100}`)}.`],
        solution: [`${m(`${1 + p / 100} \\times ${1 - q / 100} = ${factor}`)}.`, `The final price is ${m(`${texOf(factor * 100)}\\%`)} of the original (a net ${word} of ${m(`${texOf(Math.abs(net))}\\%`)}).`, `Answer: ${m(texOf(factor * 100))}.`],
        meta: { kind, p, q, factor, ans: factor * 100 },
      };
    }
    if (kind === 'reverse') {
      const p = rng.pick([10, 15, 20, 25, 30, 40]);
      const orig = rng.int(4, 30) * 20;
      const sale = (orig * (100 - p)) / 100;
      return {
        prompt: `During a sale, a camera was discounted by ${m(`${p}\\%`)}. The sale price was ${m(dollars(sale))}. What was the original price, in dollars?`,
        ...numAnswer(rng, f, frac(orig), [
          { v: sale * (1 + p / 100), e: 'methode' },
          { v: sale + p, e: 'cours' },
          { v: sale * (1 - p / 100), e: 'methode' },
        ]),
        hints: [`The sale price is ${m(`${100 - p}\\%`)} of the original price.`, `${m(`${(100 - p) / 100} \\times \\text{original} = ${sale}`)}.`],
        solution: [`${m(`${(100 - p) / 100}x = ${sale}`)}.`, `${m(`x = \\frac{${sale}}{${(100 - p) / 100}}`)}.`, `${m(`x = ${orig}`)}.`],
        meta: { kind, p, orig, sale, ans: orig },
      };
    }
    // p% of q% of N
    const p = rng.pick([10, 20, 25, 40, 50, 60, 75]);
    const q = rng.pick([10, 20, 30, 40, 50, 80]);
    const N = rng.int(1, 20) * 100;
    const ans = (p * q * N) / 10000;
    const pr = frac(p * q, 100);
    return {
      prompt: `In a survey of ${m(`${N}`)} people, ${m(`${q}\\%`)} said they own a bicycle. Of those who own a bicycle, ${m(`${p}\\%`)} ride it to work. What percent of all the people surveyed ride a bicycle to work?`,
      ...numAnswer(
        rng,
        f,
        pr,
        [
          { v: p + q, e: 'methode' },
          { v: ans, e: 'lecture' },
          { v: Math.abs(p - q) || p / 2, e: 'methode' },
        ],
        f === 'mcq' ? (x) => pct(x) : undefined,
      ),
      hints: ['A percent of a percent: multiply the two decimals.', `${m(`${q / 100} \\times ${p / 100}`)}.`],
      solution: [`${m(`${q / 100} \\times ${p / 100} = ${(p * q) / 10000}`)}.`, `That is ${m(`${fr(pr)}\\%`)} of the people surveyed.`, `Answer: ${m(fr(pr))}.`],
      meta: { kind, p, q, N, ans: pr },
    };
  },
});

// ---------------------------------------------------------------- one-variable data
function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
function sd(xs: number[]) {
  const mu = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - mu) ** 2)));
}

export const satOneVar = defineGenerator({
  id: 'sat-one-var',
  subject: 'sat',
  skill: 'psda-one-var',
  title: 'Mean, median and spread',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 90,
  build(rng, d, f) {
    const kind = f === 'mcq' && rng.bool(0.4) ? 'compare' : d === 'medium' ? rng.pick(['freq-mean', 'median'] as const) : rng.pick(['added-value', 'freq-median'] as const);
    if (kind === 'freq-mean' || kind === 'freq-median') {
      const vals = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 5).sort((a, b) => a - b);
      const freqs = vals.map(() => rng.int(1, 8));
      // make the mean nice-ish for SPR: total frequency
      const data = vals.flatMap((v, i) => Array(freqs[i]).fill(v) as number[]);
      const mu = frac(data.reduce((a, b) => a + b, 0), data.length);
      const md = median(data);
      const table: Figure = { kind: 'table', headers: ['Number of books read', 'Frequency'], rows: vals.map((v, i) => [`$${v}$`, `$${freqs[i]}$`]) };
      if (kind === 'freq-mean') {
        return {
          prompt: `The frequency table summarizes the numbers of books read last summer by the students in a class. What is the mean number of books read per student?`,
          figure: table,
          ...numAnswer(rng, f, mu, [
            { v: mean(vals), e: 'methode' },
            { v: md, e: 'cours' },
            { v: frac(data.reduce((a, b) => a + b, 0), vals.length), e: 'methode' },
          ]),
          hints: ['Each value counts as many times as its frequency.', `Total number of students: ${m(`${data.length}`)}.`],
          solution: [`Sum: ${m(vals.map((v, i) => `${v}\\times ${freqs[i]}`).join(' + ') + ` = ${data.reduce((a, b) => a + b, 0)}`)}.`, `Divide by the number of students: ${m(`\\frac{${data.reduce((a, b) => a + b, 0)}}{${data.length}}`)}.`, `Mean ${m(`= ${fr(mu)}`)}.`],
          meta: { kind, vals, freqs, ans: mu },
        };
      }
      return {
        prompt: `The frequency table summarizes the numbers of books read last summer by the students in a class. What is the median number of books read?`,
        figure: table,
        ...numAnswer(rng, f, md, [
          { v: median(vals), e: 'methode' },
          { v: mu, e: 'cours' },
          { v: vals[freqs.indexOf(Math.max(...freqs))], e: 'cours' },
        ]),
        hints: ['List the values in order (with repetitions); the median is the middle one.', `There are ${m(`${data.length}`)} values in total.`],
        solution: [
          `${m(`${data.length}`)} values; the median is ${data.length % 2 ? `the ${m(`${(data.length + 1) / 2}`)}th value` : `the mean of the ${m(`${data.length / 2}`)}th and ${m(`${data.length / 2 + 1}`)}th values`}.`,
          `Cumulative frequencies: ${m(freqs.map((_, i) => freqs.slice(0, i + 1).reduce((a, b) => a + b, 0)).join(', '))}.`,
          `Median ${m(`= ${texOf(md)}`)}.`,
        ],
        meta: { kind, vals, freqs, ans: md },
      };
    }
    if (kind === 'median') {
      const n = rng.pick([7, 8, 9, 10]);
      const xs = Array.from({ length: n }, () => rng.int(10, 60));
      const md = median(xs);
      return {
        prompt: `The list shows the number of minutes each of ${m(`${n}`)} students spent on homework: ${m(xs.join(',\\ '))}. What is the median of the data?`,
        ...numAnswer(rng, f, md, [
          { v: xs[Math.floor(n / 2)], e: 'methode' },
          { v: Math.round(mean(xs) * 100) / 100, e: 'cours' },
          { v: (Math.min(...xs) + Math.max(...xs)) / 2, e: 'cours' },
        ]),
        hints: ['Sort the data first.', n % 2 ? 'With an odd number of values, the median is the middle value.' : 'With an even number of values, the median is the mean of the two middle values.'],
        solution: [`Sorted: ${m([...xs].sort((a, b) => a - b).join(',\\ '))}.`, n % 2 ? `Middle (${m(`${(n + 1) / 2}`)}th) value.` : `Mean of the ${m(`${n / 2}`)}th and ${m(`${n / 2 + 1}`)}th values.`, `Median ${m(`= ${texOf(md)}`)}.`],
        meta: { kind, xs, ans: md },
      };
    }
    if (kind === 'added-value') {
      const n = rng.int(5, 12);
      const m1 = rng.int(20, 80);
      const n2 = n + 1;
      const mean2 = rng.int(m1 - 10, m1 + 10);
      const added = mean2 * n2 - n * m1;
      return {
        prompt: `The mean of a data set of ${m(`${n}`)} numbers is ${m(`${m1}`)}. When one number is added to the data set, the mean of the ${m(`${n2}`)} numbers is ${m(`${mean2}`)}. What number was added?`,
        ...numAnswer(rng, f, frac(added), [
          { v: mean2 - m1, e: 'methode' },
          { v: mean2 * n - n * m1, e: 'calcul' },
          { v: (m1 + mean2) / 2, e: 'cours' },
        ]),
        hints: ['Work with totals: sum = mean × number of values.', `Original total: ${m(`${n} \\times ${m1} = ${n * m1}`)}.`],
        solution: [`Original total ${m(`${n * m1}`)}; new total ${m(`${n2} \\times ${mean2} = ${mean2 * n2}`)}.`, `Added number: ${m(`${mean2 * n2} - ${n * m1}`)}.`, `${m(`= ${added}`)}.`],
        meta: { kind, n, m1, mean2, ans: added },
      };
    }
    // compare SD / mean of two data sets
    const center = rng.int(20, 50);
    const spreadA = rng.int(1, 3);
    const spreadB = spreadA + rng.int(3, 6);
    const offsets = [-2, -1, 0, 1, 2];
    const A = offsets.map((o) => center + o * spreadA);
    const B = offsets.map((o) => center + o * spreadB);
    const [X, Y, xName, yName] = rng.bool() ? [A, B, 'A', 'B'] : [B, A, 'A', 'B'];
    const sdX = sd(X);
    const sdY = sd(Y);
    const larger = sdX > sdY ? xName : yName;
    const smaller = larger === 'A' ? 'B' : 'A';
    return {
      prompt: `Data set ${m('A')}: ${m(X.join(',\\ '))}\n\nData set ${m('B')}: ${m(Y.join(',\\ '))}\n\nWhich statement best compares the standard deviations of data sets ${m('A')} and ${m('B')}?`,
      ...textMcq(rng, `The standard deviation of data set ${m(larger)} is greater.`, [
        { t: `The standard deviation of data set ${m(smaller)} is greater.`, e: 'cours' },
        { t: 'The standard deviations are equal.', e: 'cours' },
        { t: 'There is not enough information to compare them.', e: 'cours' },
      ]),
      hints: ['Standard deviation measures how spread out the values are around the mean.', `Both data sets have the same mean, ${m(`${center}`)}; compare how far the values are from it.`],
      solution: [`Both means equal ${m(`${center}`)}.`, `Data set ${m(larger)} has values farther from the mean (range ${m(`${Math.max(...(larger === xName ? X : Y)) - Math.min(...(larger === xName ? X : Y))}`)} vs ${m(`${Math.max(...(larger === xName ? Y : X)) - Math.min(...(larger === xName ? Y : X))}`)}).`, `So the standard deviation of ${m(larger)} is greater.`],
      meta: { kind: 'compare', X, Y, larger },
    };
  },
});

// ---------------------------------------------------------------- two-variable data
export const satTwoVar = defineGenerator({
  id: 'sat-two-var',
  subject: 'sat',
  skill: 'psda-two-var',
  title: 'Scatterplots and models',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 90,
  build(rng, _d, f) {
    const kind = f === 'mcq' ? rng.pick(['slope-meaning', 'model-type', 'predict'] as const) : 'predict';
    if (kind === 'model-type') {
      const lin_ = rng.bool();
      const start = rng.int(2, 9) * 10;
      const step = rng.int(2, 9) * (lin_ ? 5 : 1);
      const ratio = rng.pick([2, 3]);
      const xs = [0, 1, 2, 3, 4];
      const ys = xs.map((x) => (lin_ ? start + step * x : start * ratio ** x));
      const table: Figure = { kind: 'table', headers: ['$x$', ...xs.map((x) => `$${x}$`)], rows: [['$y$', ...ys.map((y) => `$${y}$`)]] };
      const correct = lin_ ? `A linear model, because ${m('y')} increases by the same amount each time ${m('x')} increases by 1.` : `An exponential model, because ${m('y')} is multiplied by the same factor each time ${m('x')} increases by 1.`;
      return {
        prompt: 'Which type of model best fits the data in the table?',
        figure: table,
        ...textMcq(rng, correct, [
          { t: lin_ ? `An exponential model, because ${m('y')} increases each time ${m('x')} increases.` : `A linear model, because ${m('y')} increases each time ${m('x')} increases.`, e: 'cours' },
          { t: `A linear model, because ${m('y')} is multiplied by the same factor each time ${m('x')} increases by 1.`, e: 'cours' },
          { t: `An exponential model, because ${m('y')} increases by the same amount each time ${m('x')} increases by 1.`, e: 'cours' },
        ]),
        hints: ['Look at differences and at ratios of consecutive $y$-values.', `Differences: ${m(ys.slice(1).map((y, i) => y - ys[i]).join(', '))}.`],
        solution: [`Differences: ${m(ys.slice(1).map((y, i) => y - ys[i]).join(', '))}; ratios: ${m(ys.slice(1).map((y, i) => texOf(y / ys[i])).join(', '))}.`, lin_ ? 'The differences are constant: linear.' : 'The ratios are constant: exponential.', correct],
        meta: { kind, lin: lin_, ys },
      };
    }
    // scatterplot with line of best fit
    const slope = rng.pick([0.5, 1, 1.5, 2, 2.5, 3, -0.5, -1, -1.5, -2]);
    const b = slope > 0 ? rng.int(1, 6) : rng.int(14, 20);
    const xmax = 10;
    const pts: Pt[] = [];
    for (let x = 1; x <= 9; x++) {
      const y = slope * x + b + (rng.next() - 0.5) * 3;
      pts.push([x, Math.round(y * 2) / 2]);
    }
    const ymax = Math.ceil(Math.max(...pts.map((p) => p[1]), b + slope * xmax) / 2) * 2 + 2;
    const svg = plot({
      xmin: 0,
      xmax,
      ymin: 0,
      ymax,
      ystep: ymax > 20 ? 4 : 2,
      xstep: 1,
      labelEvery: 1,
      originAxes: false,
      xlabel: 'x',
      ylabel: 'y',
      fns: [{ f: (x) => slope * x + b, color: '#3987e5' }],
      points: pts.map((p) => ({ p, color: '#d95926' })),
      width: 340,
      height: 280,
    });
    const figure: Figure = { kind: 'svg', svg, alt: `Scatterplot with a line of best fit through (0, ${b}) with slope ${slope}` };
    const ctxs = [
      { x: 'hours studied', y: 'test score (points)', xu: 'hour', yu: 'points' },
      { x: 'days since planting', y: 'plant height (cm)', xu: 'day', yu: 'centimeters' },
      { x: 'temperature (°C)', y: 'drinks sold (dozens)', xu: 'degree Celsius', yu: 'dozen drinks' },
    ];
    const c = rng.pick(ctxs);
    if (kind === 'slope-meaning') {
      const s = Math.abs(slope);
      const dir = slope > 0 ? 'increase' : 'decrease';
      return {
        prompt: `The scatterplot shows ${c.y} ${m('y')} versus ${c.x} ${m('x')} for a fictional study, with a line of best fit. Which statement best interprets the slope of the line of best fit?`,
        figure,
        ...textMcq(rng, `For each additional ${c.xu}, the model predicts an ${dir} of about ${m(texOf(s))} ${c.yu}.`, [
          { t: `For each additional ${c.xu}, the model predicts an ${dir} of about ${m(`${b}`)} ${c.yu}.`, e: 'lecture' },
          { t: `When ${m('x = 0')}, the model predicts about ${m(texOf(s))} ${c.yu}.`, e: 'cours' },
          { t: `For each additional ${c.xu}, the model predicts an ${dir === 'increase' ? 'decrease' : 'increase'} of about ${m(texOf(s))} ${c.yu}.`, e: 'lecture' },
          { t: `For each additional ${c.xu}, the model predicts an ${dir} of about ${m(texOf(s + 1))} ${c.yu}.`, e: 'calcul' },
        ]),
        hints: ['The slope is the predicted change in $y$ for an increase of 1 in $x$.', 'Read two points on the LINE (not the data points) to find the slope.'],
        solution: [`The line passes through ${m(`(0, ${b})`)} and ${m(`(2, ${texOf(b + 2 * slope)})`)}.`, `Slope ${m(`= \\frac{${texOf(2 * slope)}}{2} = ${texOf(slope)}`)}.`, `Each extra ${c.xu} changes the prediction by ${m(texOf(slope))} ${c.yu}.`],
        meta: { kind, slope, b },
      };
    }
    const x0 = rng.pick([2, 4, 6, 8]);
    const pred = slope * x0 + b;
    return {
      prompt: `The scatterplot shows ${c.y} ${m('y')} versus ${c.x} ${m('x')} for a fictional study, with the line of best fit. The line passes through grid points. Based on the line of best fit, what is the predicted value of ${m('y')} when ${m(`x = ${x0}`)}?`,
      figure,
      ...numAnswer(rng, f, frac(Math.round(pred * 2), 2), [
        { v: pts[x0 - 1][1] === pred ? pred + 1 : pts[x0 - 1][1], e: 'lecture' },
        { v: slope * x0, e: 'methode' },
        { v: b, e: 'lecture' },
      ]),
      hints: ['Use the LINE, not the individual data points.', `Find the line's ${m('y')}-intercept and slope from two grid points it passes through.`],
      solution: [`The line passes through ${m(`(0, ${b})`)} with slope ${m(texOf(slope))}: ${m(`y = ${texOf(slope)}x + ${b}`)}.`, `At ${m(`x = ${x0}`)}: ${m(`y = ${texOf(slope)} \\times ${x0} + ${b}`)}.`, `${m(`y = ${texOf(pred)}`)}.`],
      meta: { kind, slope, b, x0, ans: pred },
    };
  },
});

// ---------------------------------------------------------------- probability / two-way tables
export const satProbability = defineGenerator({
  id: 'sat-probability',
  subject: 'sat',
  skill: 'psda-probability',
  title: 'Two-way tables and conditional probability',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 85,
  build(rng, d, f) {
    const setting = rng.pick([
      { rows: ['Juniors', 'Seniors'], rowP: ['juniors', 'seniors'], cols: ['Bus', 'Car', 'Bike'], colP: ['takes the bus', 'comes by car', 'bikes'], what: 'students', how: 'how they get to school' },
      { rows: ['Morning', 'Evening'], rowP: ['morning members', 'evening members'], cols: ['Yoga', 'Running', 'Swimming'], colP: ['prefers yoga', 'prefers running', 'prefers swimming'], what: 'gym members', how: 'favorite activity' },
      { rows: ['Plant A', 'Plant B'], rowP: ['tomatoes from Plant A', 'tomatoes from Plant B'], cols: ['Small', 'Medium', 'Large'], colP: ['is small', 'is medium', 'is large'], what: 'tomatoes', how: 'size' },
    ]);
    const cells = setting.rows.map(() => setting.cols.map(() => rng.int(5, 60)));
    const rowT = cells.map((r) => r.reduce((a, b) => a + b, 0));
    const colT = setting.cols.map((_, j) => cells.reduce((a, r) => a + r[j], 0));
    const total = rowT.reduce((a, b) => a + b, 0);
    const table: Figure = {
      kind: 'table',
      headers: ['', ...setting.cols, 'Total'],
      rows: [...setting.rows.map((r, i) => [r, ...cells[i].map((c) => `$${c}$`), `$${rowT[i]}$`]), ['Total', ...colT.map((c) => `$${c}$`), `$${total}$`]],
    };
    const i = rng.int(0, 1);
    const j = rng.int(0, setting.cols.length - 1);
    const given = d === 'hard' ? rng.pick(['col', 'row'] as const) : 'none';
    const num_ = cells[i][j];
    const den = given === 'row' ? rowT[i] : given === 'col' ? colT[j] : total;
    const desc =
      given === 'row'
        ? `One of the ${setting.rowP[i]} is selected at random. What is the probability that this one ${setting.colP[j]}?`
        : given === 'col'
          ? `One of the ${setting.what} that ${setting.colP[j].replace(/^is /, 'are ').replace(/^takes/, 'take').replace(/^comes/, 'come').replace(/^prefers/, 'prefer')} is selected at random. What is the probability that it is one of the ${setting.rowP[i]}?`
          : `One of the ${setting.what} is selected at random. What is the probability that it is one of the ${setting.rowP[i]} and ${setting.colP[j].replace(/^is /, 'is ')}?`;
    const p = frac(num_, den);
    return {
      prompt: `The table summarizes ${m(`${total}`)} ${setting.what} by group and by ${setting.how} (fictional data). ${desc}`,
      figure: table,
      ...numAnswer(rng, f, p, [
        { v: frac(num_, given === 'none' ? rowT[i] : total), e: 'methode' },
        { v: frac(num_, given === 'col' ? rowT[i] : colT[j]), e: 'lecture' },
        { v: frac(given === 'row' ? colT[j] : rowT[i], total), e: 'lecture' },
      ]),
      hints: [
        given === 'none' ? 'Probability = favorable outcomes ÷ total.' : 'For a conditional probability, the denominator is the total of the GIVEN group only.',
        `The number of favorable outcomes is the cell at row "${setting.rows[i]}" and column "${setting.cols[j]}".`,
      ],
      solution: [`Favorable: ${m(`${num_}`)}.`, `Denominator (${given === 'none' ? 'all' : given === 'row' ? setting.rows[i] : setting.cols[j]}): ${m(`${den}`)}.`, `Probability ${m(`= \\frac{${num_}}{${den}} = ${fr(p)}`)}.`],
      meta: { kind: given, cells, i, j, ans: p },
    };
  },
});

// ---------------------------------------------------------------- inference and margin of error
export const satInference = defineGenerator({
  id: 'sat-inference',
  subject: 'sat',
  skill: 'psda-inference',
  title: 'Sample statistics and margin of error',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 75,
  build(rng, d, f) {
    if (f === 'spr' || (d === 'medium' && rng.bool(0.4))) {
      // estimate a population count from a sample proportion
      const n = rng.pick([50, 80, 100, 120, 200, 250, 400]);
      const yes = Math.round(n * rng.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.6]));
      const N = n * rng.int(3, 20);
      const est = frac(yes * N, n);
      return {
        prompt: `A random sample of ${m(`${n}`)} students from a school of ${m(`${N}`)} students was surveyed. Of the students in the sample, ${m(`${yes}`)} said they walk to school. Based on the survey, what is the best estimate of the number of students at the school who walk to school?`,
        ...numAnswer(rng, f, est, [
          { v: yes, e: 'lecture' },
          { v: frac(n * N, yes), e: 'methode' },
          { v: N - yes, e: 'methode' },
        ]),
        hints: ['A random sample gives an estimate of the proportion in the whole population.', `Sample proportion: ${m(`\\frac{${yes}}{${n}}`)}.`],
        solution: [`Sample proportion ${m(`\\frac{${yes}}{${n}} = ${texOf(yes / n)}`)}.`, `Apply it to the population: ${m(`${texOf(yes / n)} \\times ${N}`)}.`, `${m(`= ${fr(est)}`)}.`],
        meta: { kind: 'estimate', n, yes, N, ans: est },
      };
    }
    if (d === 'medium') {
      const p = rng.int(20, 80);
      const moe = rng.pick([2, 3, 4, 5, 6]);
      const lo = p - moe;
      const hi = p + moe;
      return {
        prompt: `Based on a random sample of voters in a city, an estimated ${m(`${p}\\%`)} of voters support a new park, with an associated margin of error of ${m(`${moe}\\%`)}. Which statement is the most appropriate conclusion?`,
        ...textMcq(rng, `It is plausible that between ${m(`${lo}\\%`)} and ${m(`${hi}\\%`)} of all voters in the city support the new park.`, [
          { t: `Exactly ${m(`${p}\\%`)} of all voters in the city support the new park.`, e: 'cours' },
          { t: `It is plausible that between ${m(`${p}\\%`)} and ${m(`${hi}\\%`)} of all voters in the city support the new park.`, e: 'methode' },
          { t: `It is plausible that between ${m(`${p - 2 * moe}\\%`)} and ${m(`${p + 2 * moe}\\%`)} of the voters in the sample support the new park.`, e: 'lecture' },
        ]),
        hints: ['The margin of error gives a range of plausible values for the POPULATION value: estimate ± margin.', `${m(`${p} - ${moe}`)} and ${m(`${p} + ${moe}`)}.`],
        solution: [`Plausible interval: ${m(`${p} \\pm ${moe}`)}.`, `From ${m(`${lo}\\%`)} to ${m(`${hi}\\%`)} of the population (not the sample).`, 'An exact value is never certain from a sample.'],
        meta: { kind: 'interval', p, moe },
      };
    }
    // hard: which change reduces the margin of error / comparing two studies
    const n1 = rng.pick([100, 200, 300]);
    const n2 = n1 * rng.pick([2, 3, 4]);
    return {
      prompt: `Two researchers each surveyed a random sample of adults in the same town about the number of hours they sleep per night. Researcher A surveyed ${m(`${n1}`)} adults and Researcher B surveyed ${m(`${n2}`)} adults. Both reported the sample mean with a margin of error at the same confidence level. Which statement is most likely true?`,
      ...textMcq(rng, `The margin of error for Researcher B's estimate is smaller than for Researcher A's estimate.`, [
        { t: `The margin of error for Researcher A's estimate is smaller than for Researcher B's estimate.`, e: 'cours' },
        { t: 'The two margins of error are equal because the samples come from the same town.', e: 'cours' },
        { t: `Researcher B's sample mean must be closer to Researcher A's sample mean than to the true mean.`, e: 'cours' },
      ]),
      hints: ['How does the sample size affect the precision of an estimate?', 'Larger random samples vary less from sample to sample.'],
      solution: ['With the same confidence level, the margin of error decreases when the sample size increases.', `${m(`${n2} > ${n1}`)}.`, "So Researcher B's margin of error is smaller."],
      meta: { kind: 'sample-size', n1, n2 },
    };
  },
});

// ---------------------------------------------------------------- evaluating statistical claims
export const satClaims = defineGenerator({
  id: 'sat-claims',
  subject: 'sat',
  skill: 'psda-claims',
  title: 'Observational studies and experiments',
  formats: ['mcq'],
  difficulties: ['medium', 'hard'],
  targetSec: 70,
  build(rng) {
    const ctx = rng.pick([
      { pop: 'students at a large high school', treat: 'listening to music while studying', out: 'quiz scores', sub: 'students' },
      { pop: 'employees of a large company', treat: 'a short daily walk', out: 'reported energy levels', sub: 'employees' },
      { pop: 'tomato plants in a greenhouse', treat: 'a new fertilizer', out: 'plant height', sub: 'plants' },
      { pop: 'residents of a city', treat: 'a reminder text message', out: 'recycling rates', sub: 'residents' },
    ]);
    const randomSample = rng.bool();
    const randomAssign = rng.bool();
    const n = rng.int(4, 30) * 10;
    const selection = randomSample ? `selected a random sample of ${m(`${n}`)} ${ctx.pop}` : `recruited ${m(`${n}`)} volunteers from among the ${ctx.pop}`;
    const assignment = randomAssign
      ? `The ${ctx.sub} were randomly assigned to either receive ${ctx.treat} or not.`
      : `The ${ctx.sub} chose for themselves whether to receive ${ctx.treat} or not.`;
    const prompt = `A researcher ${selection}. ${assignment} The group receiving ${ctx.treat} had significantly better ${ctx.out}. Which conclusion is best supported by the study?`;
    const cause = `${ctx.treat[0].toUpperCase()}${ctx.treat.slice(1)} causes better ${ctx.out}`;
    const assoc = `${ctx.treat[0].toUpperCase()}${ctx.treat.slice(1)} is associated with better ${ctx.out}`;
    const all = `for ${ctx.pop}`;
    const only = `for ${ctx.sub} like those in the study`;
    const options = {
      cc: `${cause} ${all}.`,
      co: `${cause} ${only}.`,
      ac: `${assoc} ${all}, but a cause-and-effect relationship cannot be concluded.`,
      ao: `${assoc} ${only}, but it cannot be generalized to all ${ctx.pop}, and cause and effect cannot be concluded.`,
    };
    const key = randomAssign ? (randomSample ? 'cc' : 'co') : randomSample ? 'ac' : 'ao';
    return {
      prompt,
      ...textMcq(
        rng,
        options[key],
        (Object.keys(options) as (keyof typeof options)[]).filter((k) => k !== key).map((k) => ({ t: options[k], e: 'cours' as const })),
      ),
      hints: ['Random ASSIGNMENT to treatments allows cause-and-effect conclusions; random SAMPLING allows generalizing to the population.', `Here: random sampling ${randomSample ? 'yes' : 'no'}; random assignment ${randomAssign ? 'yes' : 'no'}.`],
      solution: [
        randomAssign ? 'Treatments were randomly assigned: a causal conclusion is justified.' : 'No random assignment (observational): only an association can be concluded.',
        randomSample ? `The ${ctx.sub} were randomly sampled: the result generalizes to all ${ctx.pop}.` : 'Volunteers are not a random sample: the result only applies to people like those in the study.',
        options[key],
      ],
      meta: { kind: 'claims', randomSample, randomAssign, key },
    };
  },
});

export const PSDA_GENERATORS = [satRatios, satPercent, satOneVar, satTwoVar, satProbability, satInference, satClaims];
export { mean, median, sd };
