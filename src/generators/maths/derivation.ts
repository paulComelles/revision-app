/** Maths spé — Dérivation et convexité (chapitre en cours). */
import type { Rng } from '../../lib/rng';
import { defineGenerator } from '../define';
import { lin, m, num, paren, poly, signed } from '../helpers';

const L = 'fr' as const;
const CH = 'maths-derivation';

interface DerivTemplate {
  /** TeX of f(x) */
  f: string;
  /** parser string of f (tests: numeric derivative) */
  fPlain: string;
  /** parser string of f' */
  d: string;
  /** TeX of f'(x) */
  dTex: string;
  /** domain where f is defined and smooth */
  domain: [number, number];
  /** derivative rule(s) used */
  rule: string;
  /** first step of the computation */
  step: string;
  steps: string[];
}

function derivTemplates(rng: Rng, level: 'easy' | 'medium' | 'hard'): DerivTemplate {
  const a = rng.nonZero(-5, 5);
  const b = rng.nonZero(-6, 6);
  const c = rng.nonZero(-3, 3);
  const pick = rng.pick(
    level === 'easy' ? (['power', 'sqrt', 'expquad'] as const) : level === 'medium' ? (['affexp', 'lnquad', 'affln'] as const) : (['quotient', 'quadexp', 'lnquotient'] as const),
  );
  switch (pick) {
    case 'power': {
      const n = rng.int(2, 6);
      return {
        f: `(${lin([[a, 'x']], b, L)})^{${n}}`,
        fPlain: `(${a}*x+(${b}))^${n}`,
        d: `${n * a}*(${a}*x+(${b}))^${n - 1}`,
        dTex: `${n * a}(${lin([[a, 'x']], b, L)})^{${n - 1}}`,
        domain: [-3, 3],
        rule: `${m("(u^n)' = n\\,u'\\,u^{n-1}")}`,
        step: `Ici ${m(`u(x) = ${lin([[a, 'x']], b, L)}`)}, donc ${m(`u'(x) = ${a}`)}.`,
        steps: [`${m(`u(x) = ${lin([[a, 'x']], b, L)}`)}, ${m(`u'(x) = ${a}`)}, ${m(`n = ${n}`)}.`, `${m(`f'(x) = ${n} \\times ${paren(a)} \\times (${lin([[a, 'x']], b, L)})^{${n - 1}} = ${n * a}(${lin([[a, 'x']], b, L)})^{${n - 1}}`)}.`],
      };
    }
    case 'sqrt': {
      const aa = Math.abs(a);
      const bb = Math.abs(b);
      return {
        f: `\\sqrt{${lin([[aa, 'x']], bb, L)}}`,
        fPlain: `sqrt(${aa}*x+${bb})`,
        d: `${aa}/(2*sqrt(${aa}*x+${bb}))`,
        dTex: `\\frac{${aa}}{2\\sqrt{${lin([[aa, 'x']], bb, L)}}}`,
        domain: [0.1, 5],
        rule: `${m("(\\sqrt{u})' = \\frac{u'}{2\\sqrt{u}}")}`,
        step: `Ici ${m(`u(x) = ${lin([[aa, 'x']], bb, L)}`)} et ${m(`u'(x) = ${aa}`)}.`,
        steps: [`${m(`u(x) = ${lin([[aa, 'x']], bb, L)}`)}, ${m(`u'(x) = ${aa}`)}.`, `${m(`f'(x) = \\frac{${aa}}{2\\sqrt{${lin([[aa, 'x']], bb, L)}}}`)}.`],
      };
    }
    case 'expquad': {
      // e^{a x^2 + b x}
      return {
        f: `\\mathrm{e}^{${poly([a, b, 0], 'x', L)}}`,
        fPlain: `exp(${a}*x^2+(${b})*x)`,
        d: `(${2 * a}*x+(${b}))*exp(${a}*x^2+(${b})*x)`,
        dTex: `(${lin([[2 * a, 'x']], b, L)})\\mathrm{e}^{${poly([a, b, 0], 'x', L)}}`,
        domain: [-1.5, 1.5],
        rule: `${m("(\\mathrm{e}^{u})' = u'\\,\\mathrm{e}^{u}")}`,
        step: `Ici ${m(`u(x) = ${poly([a, b, 0], 'x', L)}`)}.`,
        steps: [`${m(`u(x) = ${poly([a, b, 0], 'x', L)}`)}, ${m(`u'(x) = ${lin([[2 * a, 'x']], b, L)}`)}.`, `${m(`f'(x) = (${lin([[2 * a, 'x']], b, L)})\\mathrm{e}^{${poly([a, b, 0], 'x', L)}}`)}.`],
      };
    }
    case 'affexp': {
      // (a x + b) e^{c x}
      return {
        f: `(${lin([[a, 'x']], b, L)})\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`,
        fPlain: `(${a}*x+(${b}))*exp(${c}*x)`,
        d: `(${a * c}*x+(${a + b * c}))*exp(${c}*x)`,
        dTex: `(${lin([[a * c, 'x']], a + b * c, L)})\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`,
        domain: [-2, 2],
        rule: `${m("(uv)' = u'v + uv'")} et ${m("(\\mathrm{e}^{kx})' = k\\,\\mathrm{e}^{kx}")}`,
        step: `${m(`u(x) = ${lin([[a, 'x']], b, L)}`)}, ${m(`v(x) = \\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`)}, donc ${m(`u'(x) = ${a}`)} et ${m(`v'(x) = ${c}\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`)}.`,
        steps: [
          `${m(`f'(x) = ${a}\\mathrm{e}^{${lin([[c, 'x']], 0, L)}} + (${lin([[a, 'x']], b, L)}) \\times ${c}\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`)}.`,
          `On factorise par ${m(`\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`)} : ${m(`f'(x) = (${lin([[a * c, 'x']], a + b * c, L)})\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`)}.`,
        ],
      };
    }
    case 'lnquad': {
      const aa = Math.abs(a);
      const bb = Math.abs(b);
      return {
        f: `\\ln(${poly([aa, 0, bb], 'x', L)})`,
        fPlain: `ln(${aa}*x^2+${bb})`,
        d: `${2 * aa}*x/(${aa}*x^2+${bb})`,
        dTex: `\\frac{${2 * aa}x}{${poly([aa, 0, bb], 'x', L)}}`,
        domain: [-3, 3],
        rule: `${m("(\\ln u)' = \\frac{u'}{u}")}`,
        step: `Ici ${m(`u(x) = ${poly([aa, 0, bb], 'x', L)}`)} (strictement positif).`,
        steps: [`${m(`u'(x) = ${2 * aa}x`)}.`, `${m(`f'(x) = \\frac{${2 * aa}x}{${poly([aa, 0, bb], 'x', L)}}`)}.`],
      };
    }
    case 'affln': {
      // (a x + b) ln x
      return {
        f: `(${lin([[a, 'x']], b, L)})\\ln x`,
        fPlain: `(${a}*x+(${b}))*ln(x)`,
        d: `${a}*ln(x)+(${a}*x+(${b}))/x`,
        dTex: `${a}\\ln x + \\frac{${lin([[a, 'x']], b, L)}}{x}`,
        domain: [0.2, 5],
        rule: `${m("(uv)' = u'v + uv'")} et ${m("(\\ln x)' = \\frac{1}{x}")}`,
        step: `${m(`u(x) = ${lin([[a, 'x']], b, L)}`)}, ${m('v(x) = \\ln x')}.`,
        steps: [`${m(`u'(x) = ${a}`)}, ${m("v'(x) = \\frac{1}{x}")}.`, `${m(`f'(x) = ${a}\\ln x + \\frac{${lin([[a, 'x']], b, L)}}{x}`)}.`],
      };
    }
    case 'quotient': {
      // (a x + b)/(c x + d), domain where c x + d > 0
      const cc = Math.abs(c);
      const d = rng.nonZero(-6, 6);
      const det = a * d - b * cc;
      if (det === 0) return derivTemplates(rng, 'medium');
      const x0 = -d / cc;
      return {
        f: `\\frac{${lin([[a, 'x']], b, L)}}{${lin([[cc, 'x']], d, L)}}`,
        fPlain: `(${a}*x+(${b}))/(${cc}*x+(${d}))`,
        d: `${det}/(${cc}*x+(${d}))^2`,
        dTex: `\\frac{${det}}{(${lin([[cc, 'x']], d, L)})^2}`,
        domain: [x0 + 0.3, x0 + 5],
        rule: `${m("\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}")}`,
        step: `${m(`u(x) = ${lin([[a, 'x']], b, L)}`)}, ${m(`v(x) = ${lin([[cc, 'x']], d, L)}`)}, ${m(`u'(x) = ${a}`)}, ${m(`v'(x) = ${cc}`)}.`,
        steps: [
          `${m(`f'(x) = \\frac{${a}(${lin([[cc, 'x']], d, L)}) - ${cc}(${lin([[a, 'x']], b, L)})}{(${lin([[cc, 'x']], d, L)})^2}`)}.`,
          `Le numérateur vaut ${m(`${a * d} - ${paren(b * cc)} = ${det}`)} : ${m(`f'(x) = \\frac{${det}}{(${lin([[cc, 'x']], d, L)})^2}`)}.`,
        ],
      };
    }
    case 'quadexp': {
      // (x^2 + b) e^{c x}
      return {
        f: `(${poly([1, 0, b], 'x', L)})\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`,
        fPlain: `(x^2+(${b}))*exp(${c}*x)`,
        d: `(${c}*x^2+2*x+(${b * c}))*exp(${c}*x)`,
        dTex: `(${poly([c, 2, b * c], 'x', L)})\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`,
        domain: [-2, 2],
        rule: `${m("(uv)' = u'v + uv'")}`,
        step: `${m(`u(x) = ${poly([1, 0, b], 'x', L)}`)} et ${m(`v(x) = \\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`)}.`,
        steps: [
          `${m(`f'(x) = 2x\\,\\mathrm{e}^{${lin([[c, 'x']], 0, L)}} + (${poly([1, 0, b], 'x', L)}) \\times ${c}\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`)}.`,
          `${m(`f'(x) = (${poly([c, 2, b * c], 'x', L)})\\mathrm{e}^{${lin([[c, 'x']], 0, L)}}`)}.`,
        ],
      };
    }
    case 'lnquotient': {
      // ln(x) / x^k
      const k = rng.int(1, 3);
      return {
        f: `\\frac{\\ln x}{x${k === 1 ? '' : `^{${k}}`}}`,
        fPlain: `ln(x)/x^${k}`,
        d: `(1-${k}*ln(x))/x^${k + 1}`,
        dTex: `\\frac{1 - ${k === 1 ? '' : k}\\ln x}{x^{${k + 1}}}`,
        domain: [0.3, 6],
        rule: `${m("\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}")}`,
        step: `${m('u(x) = \\ln x')}, ${m(`v(x) = x${k === 1 ? '' : `^{${k}}`}`)}.`,
        steps: [`${m(`f'(x) = \\frac{\\frac{1}{x} \\times x${k === 1 ? '' : `^{${k}}`} - \\ln x \\times ${k === 1 ? '1' : `${k}x^{${k - 1}}`}}{x^{${2 * k}}}`)}.`, `${m(`f'(x) = \\frac{1 - ${k === 1 ? '' : k}\\ln x}{x^{${k + 1}}}`)}.`],
      };
    }
  }
}

export const derivCalcul = defineGenerator({
  id: 'maths-deriv-calcul',
  subject: 'maths',
  skill: CH,
  title: 'Calculer une dérivée',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 120,
  build(rng, d) {
    const t = derivTemplates(rng, d);
    return {
      prompt: `Soit ${m(`f(x) = ${t.f}`)}, définie et dérivable sur un intervalle où l'expression a un sens.\n\nCalcule ${m("f'(x)")}.`,
      answer: { kind: 'expr', expected: t.d, variable: 'x', domain: t.domain },
      answerDisplay: m(`f'(x) = ${t.dTex}`),
      hints: [`Formule utile : ${t.rule}.`, t.step],
      solution: [...t.steps],
      meta: { f: t.fPlain, d: t.d, domain: t.domain },
    };
  },
});

export const derivTangente = defineGenerator({
  id: 'maths-deriv-tangente',
  subject: 'maths',
  skill: CH,
  title: 'Équation de tangente',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 150,
  build(rng, d) {
    let fTex: string;
    let fPlain: string;
    let fa: number;
    let fpa: number;
    let a: number;
    let derivTex: string;
    if (d === 'hard') {
      // f(x) = (x + b) e^{x} at a = 0 or 1 → use a = 0 for exact values
      const b = rng.nonZero(-5, 5);
      a = 0;
      fTex = `(x${signed(b, L)})\\mathrm{e}^{x}`;
      fPlain = `(x+(${b}))*exp(x)`;
      fa = b;
      fpa = b + 1;
      derivTex = `f'(x) = (x${signed(b + 1, L)})\\mathrm{e}^{x}`;
    } else {
      const c3 = d === 'easy' ? 0 : rng.nonZero(-2, 2);
      const c2 = rng.int(-4, 4);
      const c1 = rng.int(-6, 6);
      const c0 = rng.int(-8, 8);
      a = rng.int(-3, 3);
      fTex = poly([c3, c2, c1, c0], 'x', L);
      fPlain = `${c3}*x^3+(${c2})*x^2+(${c1})*x+(${c0})`;
      fa = c3 * a ** 3 + c2 * a ** 2 + c1 * a + c0;
      fpa = 3 * c3 * a ** 2 + 2 * c2 * a + c1;
      derivTex = `f'(x) = ${poly([3 * c3, 2 * c2, c1], 'x', L)}`;
    }
    const p = fa - fpa * a; // y = fpa x + p
    return {
      prompt: `Soit ${m(`f(x) = ${fTex}`)}. Donne l'équation réduite de la tangente à la courbe de ${m('f')} au point d'abscisse ${m(`${a}`)}.\n\nÉcris seulement le membre de droite : ${m('y = \\ldots')}`,
      answer: { kind: 'expr', expected: `${fpa}*x+(${p})`, variable: 'x', domain: [-5, 5] },
      answerDisplay: m(`y = ${lin([[fpa, 'x']], p, L)}`),
      hints: [`La tangente au point d'abscisse ${m('a')} a pour équation ${m("y = f'(a)(x - a) + f(a)")}.`, `Calcule ${m(`f(${a})`)} et ${m(`f'(${a})`)}.`],
      solution: [`${m(derivTex)}.`, `${m(`f(${a}) = ${fa}`)} et ${m(`f'(${a}) = ${fpa}`)}.`, `${m(`y = ${fpa}(x - ${paren(a)}) + ${paren(fa)}`)}, soit ${m(`y = ${lin([[fpa, 'x']], p, L)}`)}.`],
      meta: { f: fPlain, a, slope: fpa, p },
    };
  },
});

export const derivConvexite = defineGenerator({
  id: 'maths-convexite',
  subject: 'maths',
  skill: CH,
  title: 'Convexité et point d’inflexion',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 150,
  build(rng, d) {
    if (d === 'hard') {
      // f(x) = (x + k) e^{x}: f''(x) = (x + k + 2) e^x
      const k = rng.int(-6, 6);
      const xi = -k - 2;
      return {
        prompt: `Soit ${m(`f(x) = (x${signed(k, L)})\\mathrm{e}^{x}`)} sur ${m('\\mathbb{R}')}. Quelle est l'abscisse du point d'inflexion de la courbe de ${m('f')} ?`,
        answer: { kind: 'number', value: xi, tolerance: 1e-9 },
        answerDisplay: m(`x = ${xi}`),
        hints: ['Un point d’inflexion correspond à un changement de signe de $f\'\'$ (la courbe traverse sa tangente).', `${m(`f'(x) = (x${signed(k + 1, L)})\\mathrm{e}^{x}`)}.`],
        solution: [`${m(`f'(x) = (x${signed(k + 1, L)})\\mathrm{e}^{x}`)}, puis ${m(`f''(x) = (x${signed(k + 2, L)})\\mathrm{e}^{x}`)}.`, `${m('\\mathrm{e}^{x} > 0')}, donc ${m("f''")} a le signe de ${m(`x${signed(k + 2, L)}`)}, qui change de signe en ${m(`${xi}`)}.`, `Abscisse du point d'inflexion : ${m(`${xi}`)}.`],
        meta: { kind: 'exp', f: `(x+(${k}))*exp(x)`, xi },
      };
    }
    // cubic a x^3 + b x^2 + c x + e with inflection at x = -b/(3a) integer
    const a = rng.nonZero(-3, 3);
    const xi = rng.int(-4, 4);
    const b = -3 * a * xi;
    const c = rng.int(-9, 9);
    const e = rng.int(-9, 9);
    const askConvexInterval = d === 'medium';
    const convexRight = a > 0; // f'' = 6a(x - xi)
    if (askConvexInterval) {
      return {
        prompt: `Soit ${m(`f(x) = ${poly([a, b, c, e], 'x', L)}`)} sur ${m('\\mathbb{R}')}. La fonction ${m('f')} est convexe sur un intervalle de la forme ${convexRight ? m('[\\alpha ; +\\infty[') : m(']-\\infty ; \\alpha]')}. Quelle est la valeur de ${m('\\alpha')} ?`,
        answer: { kind: 'number', value: xi, tolerance: 1e-9 },
        answerDisplay: m(`\\alpha = ${xi}`),
        hints: ["$f$ est convexe là où $f''(x) \\ge 0$.", `${m(`f'(x) = ${poly([3 * a, 2 * b, c], 'x', L)}`)}.`],
        solution: [`${m(`f''(x) = ${lin([[6 * a, 'x']], 2 * b, L)} = ${6 * a}(x - ${paren(xi)})`)}.`, `${m("f''(x) \\ge 0")} pour ${convexRight ? m(`x \\ge ${xi}`) : m(`x \\le ${xi}`)}.`, `${m(`\\alpha = ${xi}`)}.`],
        meta: { kind: 'cubic-interval', a, b, c, e, xi },
      };
    }
    return {
      prompt: `Soit ${m(`f(x) = ${poly([a, b, c, e], 'x', L)}`)} sur ${m('\\mathbb{R}')}. Quelle est l'abscisse du point d'inflexion de sa courbe ?`,
      answer: { kind: 'number', value: xi, tolerance: 1e-9 },
      answerDisplay: m(`x = ${xi}`),
      hints: ["Cherche où $f''$ s'annule en changeant de signe.", `${m(`f'(x) = ${poly([3 * a, 2 * b, c], 'x', L)}`)}.`],
      solution: [`${m(`f''(x) = ${lin([[6 * a, 'x']], 2 * b, L)}`)}.`, `${m("f''(x) = 0")} pour ${m(`x = ${xi}`)}, et ${m("f''")} change de signe (fonction affine).`, `Abscisse : ${m(`${xi}`)}.`],
      meta: { kind: 'cubic', a, b, c, e, xi },
    };
  },
});

export const derivVariations = defineGenerator({
  id: 'maths-variations',
  subject: 'maths',
  skill: CH,
  title: 'Variations et extremum',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 150,
  build(rng, d) {
    // f'(x) = 3a (x - r1)(x - r2) with r1 < r2, f = a x^3 - 3a/2 (r1+r2) x^2 + 3a r1 r2 x + e
    const r1 = rng.int(-5, 3);
    const r2 = r1 + rng.int(1, 6);
    let a = rng.pick([-2, -1, 1, 2]);
    if ((r1 + r2) % 2 !== 0 && Math.abs(a) === 1) a *= 2;
    const e = rng.int(-10, 10);
    const b2 = (-3 * a * (r1 + r2)) / 2;
    const b1 = 3 * a * r1 * r2;
    const f = (x: number) => a * x ** 3 + b2 * x ** 2 + b1 * x + e;
    // a > 0: local max at r1, local min at r2
    const askMax = d === 'easy' ? true : rng.bool();
    const xAns = a > 0 ? (askMax ? r1 : r2) : askMax ? r2 : r1;
    const askValue = d === 'hard';
    const ans = askValue ? f(xAns) : xAns;
    return {
      prompt: `Soit ${m(`f(x) = ${poly([a, b2, b1, e], 'x', L)}`)} sur ${m('\\mathbb{R}')}. ${askValue ? `Quelle est la valeur du ${askMax ? 'maximum' : 'minimum'} local de ${m('f')} ?` : `En quelle abscisse ${m('f')} admet-elle un ${askMax ? 'maximum' : 'minimum'} local ?`}`,
      answer: { kind: 'number', value: ans, tolerance: 1e-9 },
      answerDisplay: m(askValue ? `f(${xAns}) = ${num(ans, L)}` : `x = ${xAns}`),
      hints: ["Étudie le signe de $f'(x)$ : un maximum local correspond à $f'$ qui passe de $+$ à $-$.", `${m(`f'(x) = ${poly([3 * a, 2 * b2, b1], 'x', L)}`)}.`],
      solution: [
        `${m(`f'(x) = ${poly([3 * a, 2 * b2, b1], 'x', L)} = ${3 * a}(x - ${paren(r1)})(x - ${paren(r2)})`)}.`,
        `${m("f'")} est du signe de ${m(`${3 * a}`)} à l'extérieur des racines ${m(`${r1}`)} et ${m(`${r2}`)} : ${a > 0 ? `${m('f')} croît, décroît puis croît` : `${m('f')} décroît, croît puis décroît`}.`,
        `${askMax ? 'Maximum' : 'Minimum'} local en ${m(`x = ${xAns}`)}${askValue ? `, de valeur ${m(`${num(ans, L)}`)}` : ''}.`,
      ],
      meta: { a, b2, b1, e, r1, r2, askMax, askValue, xAns, ans },
    };
  },
});

export const DERIVATION_GENERATORS = [derivCalcul, derivTangente, derivConvexite, derivVariations];
