/** Maths spé — suites, limites, continuité, exp/ln, primitives/intégrales, équations différentielles. */
import { F, frac } from '../../lib/fraction';
import { defineGenerator } from '../define';
import { fr, lin, m, num, paren, poly, signed } from '../helpers';

const L = 'fr' as const;
const nf = (x: number) => num(x, L);

// ---------------------------------------------------------------- suites arithmético-géométriques
export const suiteArithGeo = defineGenerator({
  id: 'maths-suite-ag',
  subject: 'maths',
  skill: 'maths-suites',
  title: 'Suite arithmético-géométrique',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 150,
  build(rng, d) {
    const a = rng.pick([0.5, 0.2, 0.8, 2, 3, -0.5, 0.25]);
    const l = rng.int(-10, 20);
    const b = l * (1 - a); // fixed point l
    const u0 = l + rng.nonZero(-8, 8);
    const rec = `u_{n+1} = ${nf(a)}\\,u_n${signed(b, L)}`;
    if (d === 'easy') {
      const n = 3;
      let u = u0;
      const vals = [u0];
      for (let i = 0; i < n; i++) {
        u = a * u + b;
        vals.push(u);
      }
      return {
        prompt: `Soit la suite définie par ${m(`u_0 = ${u0}`)} et ${m(rec)}. Calcule ${m('u_3')}.`,
        answer: { kind: 'number', value: u, tolerance: 1e-9 },
        answerDisplay: m(`u_3 = ${nf(u)}`),
        hints: ['Calcule les termes un par un avec la relation de récurrence.', `${m(`u_1 = ${nf(a)} \\times ${paren(u0)}${signed(b, L)}`)}.`],
        solution: vals.slice(1).map((v, i) => `${m(`u_${i + 1} = ${nf(a)} \\times ${paren(nf(vals[i]))}${signed(b, L)} = ${nf(v)}`)}.`),
        meta: { kind: 'term', a, b, u0, n, ans: u },
      };
    }
    if (d === 'medium') {
      return {
        prompt: `Soit la suite définie par ${m(`u_0 = ${u0}`)} et ${m(rec)}. On pose ${m('v_n = u_n - \\ell')}, où ${m('\\ell')} est le réel tel que ${m('(v_n)')} soit géométrique. Exprime ${m('u_n')} en fonction de ${m('n')}.`,
        answer: { kind: 'expr', expected: `(${u0 - l})*(${a})^n+(${l})`, variable: 'n', domain: [0, 12], integer: true },
        answerDisplay: m(`u_n = ${u0 - l} \\times ${paren(nf(a))}^n${signed(l, L)}`),
        hints: [`${m('\\ell')} est le point fixe : il vérifie ${m(`\\ell = ${nf(a)}\\,\\ell${signed(b, L)}`)}.`, `${m(`\\ell = ${l}`)} ; alors ${m(`v_{n+1} = ${nf(a)}\\,v_n`)}.`],
        solution: [
          `${m(`\\ell = ${nf(a)}\\ell${signed(b, L)} \\iff \\ell = ${l}`)}.`,
          `${m('(v_n)')} est géométrique de raison ${m(nf(a))} et de premier terme ${m(`v_0 = ${u0} - ${paren(l)} = ${u0 - l}`)} : ${m(`v_n = ${u0 - l} \\times ${paren(nf(a))}^n`)}.`,
          `${m(`u_n = v_n + ${paren(l)} = ${u0 - l} \\times ${paren(nf(a))}^n${signed(l, L)}`)}.`,
        ],
        meta: { kind: 'formula', a, b, u0, l },
      };
    }
    // limit
    const conv = Math.abs(a) < 1;
    const lim: number | 'inf' | '-inf' = conv ? l : a > 1 ? (u0 - l > 0 ? 'inf' : '-inf') : 'inf';
    return {
      prompt: `Soit la suite définie par ${m(`u_0 = ${u0}`)} et ${m(rec)}. Quelle est la limite de ${m('(u_n)')} ? (écris un nombre, +inf ou -inf)`,
      answer: { kind: 'limit', value: lim },
      answerDisplay: m(`\\lim u_n = ${typeof lim === 'number' ? nf(lim) : lim === 'inf' ? '+\\infty' : '-\\infty'}`),
      hints: ['Écris $u_n$ à l’aide de la suite géométrique $v_n = u_n - \\ell$.', `${m(`v_n = ${u0 - l} \\times ${paren(nf(a))}^n`)} et ${m(`u_n = v_n${signed(l, L)}`)}.`],
      solution: [
        `${m(`u_n = ${u0 - l} \\times ${paren(nf(a))}^n${signed(l, L)}`)}.`,
        conv ? `${m(`-1 < ${nf(a)} < 1`)}, donc ${m(`${paren(nf(a))}^n \\to 0`)}.` : `${m(`${nf(a)} > 1`)}, donc ${m(`${nf(a)}^n \\to +\\infty`)}, multiplié par ${m(`${u0 - l}`)}.`,
        `${m(`\\lim u_n = ${typeof lim === 'number' ? nf(lim) : lim === 'inf' ? '+\\infty' : '-\\infty'}`)}.`,
      ],
      meta: { kind: 'limit', a, b, u0, l, lim },
    };
  },
});

// ---------------------------------------------------------------- limites de suites
export const suiteLimite = defineGenerator({
  id: 'maths-suite-limite',
  subject: 'maths',
  skill: 'maths-suites',
  title: 'Limite d’une suite',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 90,
  build(rng, d) {
    const kind = d === 'easy' ? rng.pick(['geo', 'ratio-same'] as const) : d === 'medium' ? rng.pick(['ratio-same', 'ratio-low', 'ratio-high'] as const) : rng.pick(['sqrt', 'exp-poly'] as const);
    if (kind === 'geo') {
      const q = rng.pick([0.3, 0.5, 0.9, 1.2, 2, 3, -0.4]);
      const c = rng.nonZero(-5, 5);
      const k = rng.int(-5, 5);
      const lim: number | 'inf' | '-inf' = Math.abs(q) < 1 ? k : c > 0 ? 'inf' : '-inf';
      return {
        prompt: `Détermine ${m(`\\lim_{n \\to +\\infty} \\left(${c} \\times ${paren(nf(q))}^n${signed(k, L)}\\right)`)}.`,
        answer: { kind: 'limit', value: lim },
        answerDisplay: m(typeof lim === 'number' ? `${lim}` : lim === 'inf' ? '+\\infty' : '-\\infty'),
        hints: ['Limite de $q^n$ : 0 si $-1 < q < 1$, $+\\infty$ si $q > 1$.', `Ici ${m(`q = ${nf(q)}`)}.`],
        solution: [`${m(`q = ${nf(q)}`)} : ${Math.abs(q) < 1 ? m('q^n \\to 0') : m('q^n \\to +\\infty')}.`, Math.abs(q) < 1 ? `Il reste ${m(`${k}`)}.` : `Multiplié par ${m(`${c}`)} : ${c > 0 ? m('+\\infty') : m('-\\infty')}.`, `Limite : ${m(typeof lim === 'number' ? `${lim}` : lim === 'inf' ? '+\\infty' : '-\\infty')}.`],
        meta: { kind, q, c, k, lim },
      };
    }
    if (kind === 'ratio-same' || kind === 'ratio-low' || kind === 'ratio-high') {
      const a = rng.nonZero(-6, 6);
      const b = rng.int(-5, 5);
      const c = rng.int(-5, 5);
      const dd = rng.nonZero(1, 6) * rng.sign();
      const e = rng.int(1, 6);
      const num_ = kind === 'ratio-high' ? `${a}n^{3}${signed(b, L)}n${signed(c, L)}` : `${poly([a, b, c], 'n', L)}`;
      const den = kind === 'ratio-low' ? `${poly([dd, 0, e, 0], 'n', L)}` : `${poly([dd, 0, e], 'n', L)}`;
      const lim: number | 'inf' | '-inf' = kind === 'ratio-same' ? a / dd : kind === 'ratio-low' ? 0 : a / dd > 0 ? 'inf' : '-inf';
      const plainNum = kind === 'ratio-high' ? `${a}*n^3+(${b})*n+(${c})` : `${a}*n^2+(${b})*n+(${c})`;
      const plainDen = kind === 'ratio-low' ? `${dd}*n^3+${e}*n` : `${dd}*n^2+${e}`;
      return {
        prompt: `Détermine ${m(`\\lim_{n \\to +\\infty} \\frac{${num_}}{${den}}`)}.`,
        answer: { kind: 'limit', value: lim },
        answerDisplay: m(typeof lim === 'number' ? fr(frac(a, dd)) : lim === 'inf' ? '+\\infty' : '-\\infty'),
        hints: ['Factorise le numérateur et le dénominateur par leur terme de plus haut degré.', `Termes dominants : ${m(kind === 'ratio-high' ? `${a}n^3` : `${a}n^2`)} et ${m(kind === 'ratio-low' ? `${dd}n^3` : `${dd}n^2`)}.`],
        solution: [
          `On factorise : la limite est celle de ${m(`\\frac{${kind === 'ratio-high' ? `${a}n^3` : `${a}n^2`}}{${kind === 'ratio-low' ? `${dd}n^3` : `${dd}n^2`}}`)}.`,
          kind === 'ratio-same' ? `${m(`= \\frac{${a}}{${dd}}`)}.` : kind === 'ratio-low' ? `${m(`= \\frac{${a}}{${dd}n} \\to 0`)}.` : `${m(`= \\frac{${a}n}{${dd}} \\to ${a / dd > 0 ? '+' : '-'}\\infty`)}.`,
          `Limite : ${m(typeof lim === 'number' ? fr(frac(a, dd)) : lim === 'inf' ? '+\\infty' : '-\\infty')}.`,
        ],
        meta: { kind, num: plainNum, den: plainDen, lim },
      };
    }
    if (kind === 'sqrt') {
      // sqrt(n^2 + p n) - n -> p/2
      const p = rng.nonZero(-9, 9);
      const lim = p / 2;
      return {
        prompt: `Détermine ${m(`\\lim_{n \\to +\\infty} \\left(\\sqrt{n^2${signed(p, L)}n} - n\\right)`)}.`,
        answer: { kind: 'limit', value: lim },
        answerDisplay: m(fr(frac(p, 2))),
        hints: ['Forme indéterminée $\\infty - \\infty$ : multiplie par la quantité conjuguée.', `${m(`\\sqrt{n^2${signed(p, L)}n} - n = \\frac{${p}n}{\\sqrt{n^2${signed(p, L)}n} + n}`)}.`],
        solution: [`Conjuguée : ${m(`\\frac{${p}n}{\\sqrt{n^2${signed(p, L)}n} + n}`)}.`, `On factorise par ${m('n')} : ${m(`\\frac{${p}}{\\sqrt{1 + \\frac{${p}}{n}} + 1}`)}.`, `Limite : ${m(`\\frac{${p}}{2} = ${fr(frac(p, 2))}`)}.`],
        meta: { kind, num: `sqrt(n^2+(${p})*n)-n`, den: '1', lim },
      };
    }
    // e^n / n^k -> +inf ; n^k e^{-n} -> 0
    const k = rng.int(1, 5);
    const up = rng.bool();
    return {
      prompt: up ? `Détermine ${m(`\\lim_{n \\to +\\infty} \\frac{\\mathrm{e}^n}{n^{${k}}}`)}.` : `Détermine ${m(`\\lim_{n \\to +\\infty} n^{${k}}\\mathrm{e}^{-n}`)}.`,
      answer: { kind: 'limit', value: up ? 'inf' : 0 },
      answerDisplay: m(up ? '+\\infty' : '0'),
      hints: ['Croissances comparées : l’exponentielle l’emporte sur toute puissance de $n$.', up ? 'Le numérateur « gagne ».' : `${m(`n^{${k}}\\mathrm{e}^{-n} = \\frac{n^{${k}}}{\\mathrm{e}^n}`)}.`],
      solution: ['Croissances comparées.', up ? `${m(`\\frac{\\mathrm{e}^n}{n^{${k}}} \\to +\\infty`)}.` : `${m(`\\frac{n^{${k}}}{\\mathrm{e}^n} \\to 0`)}.`, `Limite : ${m(up ? '+\\infty' : '0')}.`],
      meta: { kind, num: up ? 'exp(n)' : `n^${k}*exp(-n)`, den: up ? `n^${k}` : '1', lim: up ? 'inf' : 0 },
    };
  },
});

// ---------------------------------------------------------------- limites de fonctions
export const limiteFonction = defineGenerator({
  id: 'maths-limite-fonction',
  subject: 'maths',
  skill: 'maths-limites',
  title: 'Limites de fonctions',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 100,
  build(rng, d) {
    const kind = d === 'easy' ? 'rational-inf' : d === 'medium' ? rng.pick(['at-point', 'rational-inf'] as const) : rng.pick(['xexp', 'lnx', 'at-point'] as const);
    if (kind === 'rational-inf') {
      const a = rng.nonZero(-6, 6);
      const b = rng.int(-5, 5);
      const c = rng.nonZero(-5, 5);
      const dd = rng.int(-5, 5);
      const toMinus = rng.bool();
      const lim = a / c;
      return {
        prompt: `Détermine ${m(`\\lim_{x \\to ${toMinus ? '-' : '+'}\\infty} \\frac{${poly([a, b, 1], 'x', L)}}{${poly([c, dd, 3], 'x', L)}}`)}.`,
        answer: { kind: 'limit', value: lim },
        answerDisplay: m(fr(frac(a, c))),
        hints: ['En $\\pm\\infty$, une fonction rationnelle a la même limite que le quotient de ses termes de plus haut degré.', `${m(`\\frac{${a}x^2}{${c}x^2}`)}.`],
        solution: [`Termes dominants : ${m(`${a}x^2`)} et ${m(`${c}x^2`)}.`, `${m(`\\frac{${a}x^2}{${c}x^2} = \\frac{${a}}{${c}}`)}.`, `Limite : ${m(fr(frac(a, c)))}.`],
        meta: { kind, f: `(${a}*x^2+(${b})*x+1)/(${c}*x^2+(${dd})*x+3)`, at: toMinus ? -1e5 : 1e5, lim },
      };
    }
    if (kind === 'at-point') {
      // (a x + b)/(x - c) when x -> c^+ or c^- , with a c + b != 0
      const c = rng.int(-5, 5);
      const a = rng.nonZero(-5, 5);
      let b = rng.int(-9, 9);
      if (a * c + b === 0) b += 1;
      const side = rng.pick(['+', '-'] as const);
      const numSign = Math.sign(a * c + b);
      const denSign = side === '+' ? 1 : -1;
      const lim: 'inf' | '-inf' = numSign * denSign > 0 ? 'inf' : '-inf';
      return {
        prompt: `Détermine ${m(`\\lim_{x \\to ${c}^{${side}}} \\frac{${lin([[a, 'x']], b, L)}}{x${signed(-c, L)}}`)} (${m(`x ${side === '+' ? '>' : '<'} ${c}`)}).`,
        answer: { kind: 'limit', value: lim },
        answerDisplay: m(lim === 'inf' ? '+\\infty' : '-\\infty'),
        hints: ['Le dénominateur tend vers 0 : étudie le signe du numérateur et celui du dénominateur.', `Le numérateur tend vers ${m(`${a * c + b}`)}.`],
        solution: [`Numérateur ${m(`\\to ${a * c + b}`)} (${numSign > 0 ? 'positif' : 'négatif'}).`, `Dénominateur ${m(`\\to 0^{${side}}`)}.`, `Règle des signes : ${m(lim === 'inf' ? '+\\infty' : '-\\infty')}.`],
        meta: { kind, f: `(${a}*x+(${b}))/(x-(${c}))`, at: c + (side === '+' ? 1e-7 : -1e-7), lim },
      };
    }
    if (kind === 'xexp') {
      // x^k e^{x} at -inf -> 0 ; e^x / x^k at +inf -> +inf
      const k = rng.int(1, 4);
      const atMinus = rng.bool();
      return {
        prompt: atMinus ? `Détermine ${m(`\\lim_{x \\to -\\infty} x^{${k}}\\mathrm{e}^{x}`)}.` : `Détermine ${m(`\\lim_{x \\to +\\infty} \\frac{\\mathrm{e}^{x}}{x^{${k}}}`)}.`,
        answer: { kind: 'limit', value: atMinus ? 0 : 'inf' },
        answerDisplay: m(atMinus ? '0' : '+\\infty'),
        hints: ['Croissances comparées entre exponentielle et puissances.', atMinus ? 'En $-\\infty$, $\\mathrm{e}^x$ tend vers 0 « plus vite » que toute puissance ne diverge.' : 'En $+\\infty$, l’exponentielle l’emporte.'],
        solution: ['Croissances comparées.', atMinus ? m(`\\lim_{x\\to-\\infty} x^{${k}}\\mathrm{e}^x = 0`) : m(`\\lim_{x\\to+\\infty} \\frac{\\mathrm{e}^x}{x^{${k}}} = +\\infty`), `Limite : ${m(atMinus ? '0' : '+\\infty')}.`],
        meta: { kind, f: atMinus ? `x^${k}*exp(x)` : `exp(x)/x^${k}`, at: atMinus ? -200 : 200, lim: atMinus ? 0 : 'inf' },
      };
    }
    // ln x / x at +inf -> 0 ; x ln x at 0+ -> 0 ; ln x at 0+ -> -inf
    const v = rng.pick(['lnx/x', 'xlnx', 'ln0'] as const);
    const lim: number | '-inf' = v === 'ln0' ? '-inf' : 0;
    const tex = v === 'lnx/x' ? '\\lim_{x \\to +\\infty} \\frac{\\ln x}{x}' : v === 'xlnx' ? '\\lim_{x \\to 0^+} x\\ln x' : '\\lim_{x \\to 0^+} \\left(\\ln x + 3\\right)';
    return {
      prompt: `Détermine ${m(tex)}.`,
      answer: { kind: 'limit', value: lim },
      answerDisplay: m(lim === '-inf' ? '-\\infty' : '0'),
      hints: ['Limites de référence du logarithme et croissances comparées.', v === 'ln0' ? '$\\ln x \\to -\\infty$ quand $x \\to 0^+$.' : 'Les puissances de $x$ l’emportent sur $\\ln x$.'],
      solution: ['Limite de référence (croissances comparées).', m(tex), `${m(`= ${lim === '-inf' ? '-\\infty' : '0'}`)}.`],
      meta: { kind, f: v === 'lnx/x' ? 'ln(x)/x' : v === 'xlnx' ? 'x*ln(x)' : 'ln(x)+3', at: v === 'lnx/x' ? 1e12 : 1e-12, lim },
    };
  },
});

// ---------------------------------------------------------------- continuité / TVI
export const tvi = defineGenerator({
  id: 'maths-tvi',
  subject: 'maths',
  skill: 'maths-continuite',
  title: 'Théorème des valeurs intermédiaires',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 180,
  build(rng, d) {
    if (d === 'hard') {
      // number of real solutions of x^3 - 3 a^2 x + k = 0 : critical values k ± 2a^3
      const a = rng.int(1, 3);
      const crit = 2 * a ** 3;
      const k = rng.pick([0, crit, -crit, crit + rng.int(1, 5), -crit - rng.int(1, 5), rng.int(-crit + 1, crit - 1)]);
      const count = Math.abs(k) < crit ? 3 : Math.abs(k) === crit ? 2 : 1;
      return {
        prompt: `Combien de solutions réelles l'équation ${m(`x^3 - ${3 * a * a}x${signed(k, L)} = 0`)} admet-elle ?`,
        answer: { kind: 'number', value: count, tolerance: 0 },
        answerDisplay: m(`${count}`),
        hints: ['Étudie les variations de $f(x) = x^3 - 3a^2x + k$ et la valeur de ses extremums ; applique le TVI sur chaque intervalle de monotonie.', `${m(`f'(x) = 3x^2 - ${3 * a * a} = 3(x - ${a})(x + ${a})`)}.`],
        solution: [
          `${m('f')} croît sur ${m(`]-\\infty;-${a}]`)}, décroît sur ${m(`[-${a};${a}]`)}, croît sur ${m(`[${a};+\\infty[`)}.`,
          `Maximum local ${m(`f(-${a}) = ${crit + k}`)}, minimum local ${m(`f(${a}) = ${k - crit}`)}.`,
          `${count === 3 ? 'Maximum > 0 et minimum < 0 : une solution sur chaque intervalle de monotonie (TVI + stricte monotonie).' : count === 2 ? 'Un extremum est nul : une solution double et une solution simple.' : 'Les deux extremums ont le même signe : une seule solution.'} Réponse : ${m(`${count}`)}.`,
        ],
        meta: { kind: 'count', a, k, count },
      };
    }
    // approximate the unique root of x^3 + p x + q = 0 (p > 0 -> increasing)
    const p = rng.int(1, 6);
    let q = rng.nonZero(-20, 20);
    // avoid an integer root (the bracketing statements need strict signs)
    while (Array.from({ length: 21 }, (_, i) => i - 10).some((x) => x ** 3 + p * x + q === 0)) q += 1;
    const f = (x: number) => x ** 3 + p * x + q;
    let lo = -10;
    let hi = 10;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < 0) lo = mid;
      else hi = mid;
    }
    const alpha = (lo + hi) / 2;
    const a0 = Math.floor(alpha);
    const prec = d === 'easy' ? 1 : 0.01;
    if (d === 'easy') {
      return {
        prompt: `Soit ${m(`f(x) = x^3${signed(p, L)}x${signed(q, L)}`)}. L'équation ${m('f(x) = 0')} a une unique solution ${m('\\alpha')}. Donne l'entier ${m('n')} tel que ${m('n \\le \\alpha < n + 1')}.`,
        answer: { kind: 'number', value: a0, tolerance: 0 },
        answerDisplay: m(`n = ${a0}`),
        hints: ['$f$ est continue et strictement croissante : cherche deux entiers consécutifs où $f$ change de signe.', `Calcule ${m(`f(${a0 - 1})`)}, ${m(`f(${a0})`)}, ${m(`f(${a0 + 1})`)}…`],
        solution: [`${m(`f'(x) = 3x^2 + ${p} > 0`)} : ${m('f')} est strictement croissante.`, `${m(`f(${a0}) = ${f(a0)}`)} ${f(a0) < 0 ? '< 0' : '≤ 0'} et ${m(`f(${a0 + 1}) = ${f(a0 + 1)} > 0`)}.`, `TVI : ${m(`${a0} \\le \\alpha < ${a0 + 1}`)}, donc ${m(`n = ${a0}`)}.`],
        meta: { kind: 'bracket', p, q, alpha, ans: a0 },
      };
    }
    return {
      prompt: `Soit ${m(`f(x) = x^3${signed(p, L)}x${signed(q, L)}`)}. L'équation ${m('f(x) = 0')} admet une unique solution ${m('\\alpha')} sur ${m('\\mathbb{R}')}. Donne une valeur approchée de ${m('\\alpha')} à ${m('10^{-2}')} près.`,
      answer: { kind: 'number', value: alpha, tolerance: prec },
      answerDisplay: m(`\\alpha \\approx ${nf(Math.round(alpha * 100) / 100)}`),
      hints: ['Encadre $\\alpha$ par dichotomie (ou avec la calculatrice), en vérifiant le changement de signe de $f$.', `${m(`f(${a0}) = ${nf(f(a0))} < 0`)} et ${m(`f(${a0 + 1}) = ${nf(f(a0 + 1))} > 0`)}.`],
      solution: [`${m('f')} est continue, strictement croissante (${m(`f'(x) = 3x^2 + ${p} > 0`)}).`, `Par dichotomie : ${m(`f(${nf(Math.floor(alpha * 100) / 100)}) < 0 < f(${nf(Math.floor(alpha * 100) / 100 + 0.01)})`)}.`, `${m(`\\alpha \\approx ${nf(Math.round(alpha * 100) / 100)}`)}.`],
      meta: { kind: 'approx', p, q, alpha },
    };
  },
});

// ---------------------------------------------------------------- exponentielle et logarithme
export const expLnEquations = defineGenerator({
  id: 'maths-explog-equations',
  subject: 'maths',
  skill: 'maths-explog',
  title: 'Équations avec exp et ln',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 120,
  build(rng, d) {
    const a = rng.nonZero(-5, 5);
    const b = rng.int(-6, 6);
    if (d === 'easy') {
      const c = rng.int(-8, 8);
      const x = frac(c - b, a);
      return {
        prompt: `Résous dans ${m('\\mathbb{R}')} : ${m(`\\mathrm{e}^{${lin([[a, 'x']], b, L)}} = \\mathrm{e}^{${c}}`)}.`,
        answer: { kind: 'number', value: F.val(x), tolerance: 1e-9 },
        answerDisplay: m(`x = ${fr(x)}`),
        hints: ['La fonction exponentielle est strictement croissante : $\\mathrm{e}^A = \\mathrm{e}^B \\iff A = B$.', `${m(`${lin([[a, 'x']], b, L)} = ${c}`)}.`],
        solution: [`${m(`${lin([[a, 'x']], b, L)} = ${c}`)}.`, `${m(`${a}x = ${c - b}`)}.`, `${m(`x = ${fr(x)}`)}.`],
        meta: { kind: 'exp-exp', a, b, c, x: F.val(x) },
      };
    }
    if (d === 'medium') {
      const k = rng.pick([2, 3, 5, 6, 7, 10]);
      const useLn = rng.bool();
      if (useLn) {
        // ln(a x + b) = k' -> x = (e^k - b)/a ; ensure a x + b > 0 automatically
        const kk = rng.int(-2, 3);
        const x = (Math.exp(kk) - b) / a;
        return {
          prompt: `Résous : ${m(`\\ln(${lin([[a, 'x']], b, L)}) = ${kk}`)}. (Tu peux écrire ${m('e^(…)')} ou ${m('exp(…)')}.)`,
          answer: { kind: 'number', value: x, tolerance: 1e-6 },
          answerDisplay: m(`x = \\frac{\\mathrm{e}^{${kk}}${signed(-b, L)}}{${a}}`),
          hints: ['$\\ln A = k \\iff A = \\mathrm{e}^k$ (avec $A > 0$).', `${m(`${lin([[a, 'x']], b, L)} = \\mathrm{e}^{${kk}}`)}.`],
          solution: [`${m(`${lin([[a, 'x']], b, L)} = \\mathrm{e}^{${kk}}`)} (et alors l'expression est bien ${m('> 0')}).`, `${m(`${a}x = \\mathrm{e}^{${kk}}${signed(-b, L)}`)}.`, `${m(`x = \\frac{\\mathrm{e}^{${kk}}${signed(-b, L)}}{${a}}`)}.`],
          meta: { kind: 'ln', a, b, k: kk, x },
        };
      }
      const x = (Math.log(k) - b) / a;
      return {
        prompt: `Résous : ${m(`\\mathrm{e}^{${lin([[a, 'x']], b, L)}} = ${k}`)}. (Tu peux écrire ${m('ln(…)')}.)`,
        answer: { kind: 'number', value: x, tolerance: 1e-6 },
        answerDisplay: m(`x = \\frac{\\ln ${k}${signed(-b, L)}}{${a}}`),
        hints: ['$\\mathrm{e}^A = k \\iff A = \\ln k$ (pour $k > 0$).', `${m(`${lin([[a, 'x']], b, L)} = \\ln ${k}`)}.`],
        solution: [`${m(`${lin([[a, 'x']], b, L)} = \\ln ${k}`)}.`, `${m(`${a}x = \\ln ${k}${signed(-b, L)}`)}.`, `${m(`x = \\frac{\\ln ${k}${signed(-b, L)}}{${a}}`)}.`],
        meta: { kind: 'exp', a, b, k, x },
      };
    }
    // e^{2x} - (p+q) e^x + p q = 0 -> X = e^x in {p, q} ; ask the greatest solution
    const p = rng.int(1, 6);
    let q = rng.int(2, 9);
    if (q === p) q += 1;
    const big = Math.log(Math.max(p, q));
    return {
      prompt: `Résous ${m(`\\mathrm{e}^{2x} - ${p + q}\\,\\mathrm{e}^{x} + ${p * q} = 0`)} et donne la plus grande solution.`,
      answer: { kind: 'number', value: big, tolerance: 1e-6 },
      answerDisplay: m(`x = \\ln ${Math.max(p, q)}`),
      hints: ['Pose $X = \\mathrm{e}^x$ : on obtient une équation du second degré.', `${m(`X^2 - ${p + q}X + ${p * q} = 0`)}.`],
      solution: [`${m(`X^2 - ${p + q}X + ${p * q} = (X - ${p})(X - ${q})`)} : ${m(`X = ${p}`)} ou ${m(`X = ${q}`)}.`, `${m(`\\mathrm{e}^x = ${p}`)} ou ${m(`\\mathrm{e}^x = ${q}`)} : ${m(`x = \\ln ${p}`)} ou ${m(`x = \\ln ${q}`)}.`, `Plus grande solution : ${m(`\\ln ${Math.max(p, q)}`)}.`],
      meta: { kind: 'quadexp', p, q, x: big },
    };
  },
});

export const lnDecomposition = defineGenerator({
  id: 'maths-ln-decomposition',
  subject: 'maths',
  skill: 'maths-explog',
  title: 'Propriétés algébriques du logarithme',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 90,
  build(rng, d) {
    // ln(2^p 3^q / ...) = p ln 2 + q ln 3
    let p = rng.int(d === 'easy' ? 0 : -3, 5);
    const q = rng.int(d === 'easy' ? 0 : -3, 4);
    if (p === 0 && q === 0) p = 2;
    const half = d === 'hard';
    const val = 2 ** p * 3 ** q;
    const numPart = 2 ** Math.max(p, 0) * 3 ** Math.max(q, 0);
    const denPart = 2 ** Math.max(-p, 0) * 3 ** Math.max(-q, 0);
    const inner = denPart === 1 ? `${numPart}` : `\\frac{${numPart}}{${denPart}}`;
    const expr = half ? `\\ln\\sqrt{${inner}}` : `\\ln ${denPart === 1 ? inner : `\\left(${inner}\\right)`}`;
    const A = half ? p / 2 : p;
    const B = half ? q / 2 : q;
    return {
      prompt: `Écris ${m(expr)} sous la forme ${m('a\\ln 2 + b\\ln 3')}. Donne ${m('a')} et ${m('b')}.`,
      answer: {
        kind: 'fields',
        fields: [
          { label: '$a$', kind: 'number', value: A, tolerance: 1e-9 },
          { label: '$b$', kind: 'number', value: B, tolerance: 1e-9 },
        ],
      },
      answerDisplay: m(`${expr} = ${nf(A)}\\ln 2 ${B < 0 ? '-' : '+'} ${nf(Math.abs(B))}\\ln 3`),
      hints: ['$\\ln(ab) = \\ln a + \\ln b$, $\\ln\\frac{a}{b} = \\ln a - \\ln b$, $\\ln(a^n) = n\\ln a$, $\\ln\\sqrt{a} = \\frac{1}{2}\\ln a$.', `Décompose en facteurs premiers : ${m(`${numPart} = 2^{${Math.max(p, 0)}} \\times 3^{${Math.max(q, 0)}}`)}${denPart > 1 ? `, ${m(`${denPart} = 2^{${Math.max(-p, 0)}} \\times 3^{${Math.max(-q, 0)}}`)}` : ''}.`],
      solution: [`${m(`${inner} = 2^{${p}} \\times 3^{${q}}`)}.`, half ? `${m(`\\ln\\sqrt{X} = \\frac{1}{2}\\ln X`)}.` : 'On applique les propriétés.', `${m(`${nf(A)}\\ln 2 ${B < 0 ? '-' : '+'} ${nf(Math.abs(B))}\\ln 3`)} : ${m(`a = ${nf(A)}`)}, ${m(`b = ${nf(B)}`)}.`],
      meta: { val, half, A, B },
    };
  },
});

// ---------------------------------------------------------------- primitives et intégrales
export const primitives = defineGenerator({
  id: 'maths-primitive',
  subject: 'maths',
  skill: 'maths-integrales',
  title: 'Calculer une primitive',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 120,
  build(rng, d) {
    const a = rng.nonZero(-5, 5);
    const b = rng.nonZero(-5, 5);
    const c = rng.int(-6, 6);
    type T = { f: string; fPlain: string; F: string; FTex: string; domain: [number, number]; hint: string };
    const pick = rng.pick(d === 'easy' ? (['poly', 'exp'] as const) : d === 'medium' ? (['uexpu', 'inv'] as const) : (['uoveru', 'power'] as const));
    let t: T;
    if (pick === 'poly') {
      const a3 = 3 * rng.nonZero(-3, 3);
      t = { f: poly([a3, 2 * b, c], 'x', L), fPlain: `${a3}*x^2+(${2 * b})*x+(${c})`, F: `${a3 / 3}*x^3+(${b})*x^2+(${c})*x`, FTex: poly([a3 / 3, b, c, 0], 'x', L), domain: [-3, 3], hint: 'Une primitive de $x^n$ est $\\frac{x^{n+1}}{n+1}$.' };
    } else if (pick === 'exp') {
      t = { f: `${a}\\mathrm{e}^{${b}x}`, fPlain: `${a}*exp(${b}*x)`, F: `${a}/(${b})*exp(${b}*x)`, FTex: `${fr(frac(a, b))}\\mathrm{e}^{${b}x}`, domain: [-1, 1], hint: 'Une primitive de $\\mathrm{e}^{kx}$ est $\\frac{1}{k}\\mathrm{e}^{kx}$.' };
    } else if (pick === 'uexpu') {
      // (2 a x + b) e^{a x^2 + b x}
      t = { f: `(${lin([[2 * a, 'x']], b, L)})\\mathrm{e}^{${poly([a, b, 0], 'x', L)}}`, fPlain: `(${2 * a}*x+(${b}))*exp(${a}*x^2+(${b})*x)`, F: `exp(${a}*x^2+(${b})*x)`, FTex: `\\mathrm{e}^{${poly([a, b, 0], 'x', L)}}`, domain: [-1, 1], hint: "Une primitive de $u'\\mathrm{e}^{u}$ est $\\mathrm{e}^{u}$." };
    } else if (pick === 'inv') {
      t = { f: `\\frac{${a}}{x}`, fPlain: `${a}/x`, F: `${a}*ln(x)`, FTex: `${a}\\ln x`, domain: [0.2, 5], hint: 'Sur $]0;+\\infty[$, une primitive de $\\frac{1}{x}$ est $\\ln x$.' };
    } else if (pick === 'uoveru') {
      const aa = Math.abs(a);
      const bb = Math.abs(b);
      t = { f: `\\frac{${2 * aa}x}{${poly([aa, 0, bb], 'x', L)}}`, fPlain: `${2 * aa}*x/(${aa}*x^2+${bb})`, F: `ln(${aa}*x^2+${bb})`, FTex: `\\ln(${poly([aa, 0, bb], 'x', L)})`, domain: [-3, 3], hint: "Une primitive de $\\frac{u'}{u}$ (avec $u > 0$) est $\\ln u$." };
    } else {
      // (a x + b)^n -> (a x + b)^{n+1} / (a (n+1))
      const n = rng.int(2, 5);
      t = { f: `(${lin([[a, 'x']], b, L)})^{${n}}`, fPlain: `(${a}*x+(${b}))^${n}`, F: `(${a}*x+(${b}))^${n + 1}/(${a * (n + 1)})`, FTex: `\\frac{(${lin([[a, 'x']], b, L)})^{${n + 1}}}{${a * (n + 1)}}`, domain: [-2, 2], hint: "Une primitive de $u'u^n$ est $\\frac{u^{n+1}}{n+1}$ : ajuste le facteur $u'$." };
    }
    return {
      prompt: `Donne une primitive ${m('F')} de ${m(`f(x) = ${t.f}`)}${pick === 'inv' ? ` sur ${m(']0;+\\infty[')}` : ''}.\n\nN'importe quelle primitive est acceptée (constante libre).`,
      answer: { kind: 'expr', expected: t.F, variable: 'x', domain: t.domain, mode: 'antiderivative' },
      answerDisplay: m(`F(x) = ${t.FTex} + C`),
      hints: [t.hint, 'Vérifie en dérivant ta réponse : tu dois retrouver $f$.'],
      solution: [t.hint, `${m(`F(x) = ${t.FTex}`)} convient (à une constante près).`, `Vérification : ${m("F'(x) = f(x)")}.`],
      meta: { f: t.fPlain, F: t.F, domain: t.domain },
    };
  },
});

export const integrale = defineGenerator({
  id: 'maths-integrale',
  subject: 'maths',
  skill: 'maths-integrales',
  title: 'Calculer une intégrale',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 150,
  build(rng, d) {
    const a = rng.int(-2, 1);
    const b = a + rng.int(1, 3);
    if (d === 'hard') {
      const k = rng.nonZero(-2, 2);
      const val = (Math.exp(k * b) - Math.exp(k * a)) / k;
      return {
        prompt: `Calcule ${m(`I = \\int_{${a}}^{${b}} \\mathrm{e}^{${k}x}\\,\\mathrm{d}x`)} (valeur exacte ou approchée à ${m('10^{-3}')} près).`,
        answer: { kind: 'number', value: val, tolerance: 1e-3 },
        answerDisplay: m(`I = \\frac{\\mathrm{e}^{${k * b}} - \\mathrm{e}^{${k * a}}}{${k}} \\approx ${nf(Math.round(val * 1000) / 1000)}`),
        hints: ['$I = F(b) - F(a)$ avec $F$ une primitive.', `Une primitive est ${m(`\\frac{1}{${k}}\\mathrm{e}^{${k}x}`)}.`],
        solution: [`${m(`F(x) = \\frac{1}{${k}}\\mathrm{e}^{${k}x}`)}.`, `${m(`I = F(${b}) - F(${a}) = \\frac{\\mathrm{e}^{${k * b}} - \\mathrm{e}^{${k * a}}}{${k}}`)}.`, `${m(`I \\approx ${nf(Math.round(val * 1000) / 1000)}`)}.`],
        meta: { kind: 'exp', a, b, k, f: `exp(${k}*x)`, val },
      };
    }
    const c2 = rng.int(-3, 3) * 3;
    const c1 = rng.int(-4, 4) * 2;
    const c0 = rng.int(-5, 5);
    const P = (x: number) => (c2 / 3) * x ** 3 + (c1 / 2) * x ** 2 + c0 * x;
    const val = P(b) - P(a);
    return {
      prompt: `Calcule ${m(`I = \\int_{${a}}^{${b}} \\left(${poly([c2, c1, c0], 'x', L)}\\right)\\mathrm{d}x`)}.`,
      answer: { kind: 'number', value: val, tolerance: 1e-9 },
      answerDisplay: m(`I = ${nf(val)}`),
      hints: ['Cherche une primitive $F$, puis calcule $F(b) - F(a)$.', `${m(`F(x) = ${poly([c2 / 3, c1 / 2, c0, 0], 'x', L)}`)}.`],
      solution: [`${m(`F(x) = ${poly([c2 / 3, c1 / 2, c0, 0], 'x', L)}`)}.`, `${m(`F(${b}) = ${nf(P(b))}`)} et ${m(`F(${a}) = ${nf(P(a))}`)}.`, `${m(`I = ${nf(val)}`)}.`],
      meta: { kind: 'poly', a, b, f: `${c2}*x^2+(${c1})*x+(${c0})`, val },
    };
  },
});

// ---------------------------------------------------------------- équations différentielles
export const equaDiff = defineGenerator({
  id: 'maths-equadiff',
  subject: 'maths',
  skill: 'maths-equadiff',
  title: 'Équation différentielle y′ = ay + b',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 150,
  build(rng, d) {
    const a = rng.nonZero(-3, 3);
    const b = d === 'easy' ? 0 : rng.nonZero(-6, 6);
    const y0 = rng.int(-5, 5);
    const part = -b / a; // particular constant solution
    const C = y0 - part;
    const Cf = F.sub(frac(y0), frac(-b, a));
    const partF = frac(-b, a);
    return {
      prompt: `Détermine la solution ${m('f')} de l'équation différentielle ${m(`y' = ${a === 1 ? '' : a === -1 ? '-' : a}y${signed(b, L)}`)} vérifiant ${m(`f(0) = ${y0}`)}.\n\nÉcris ${m('f(x) = \\ldots')}`,
      answer: { kind: 'expr', expected: `(${C})*exp(${a}*x)+(${part})`, variable: 'x', domain: [-1, 1] },
      answerDisplay: m(`f(x) = ${fr(Cf)}\\,\\mathrm{e}^{${a}x}${b === 0 ? '' : ` ${F.val(partF) < 0 ? '-' : '+'} ${fr(frac(Math.abs(partF.n), partF.d))}`}`),
      hints: [b === 0 ? "Les solutions de $y' = ay$ sont $x \\mapsto C\\mathrm{e}^{ax}$." : "Solutions de $y' = ay + b$ : $x \\mapsto C\\mathrm{e}^{ax} - \\frac{b}{a}$.", b === 0 ? `${m(`f(x) = C\\mathrm{e}^{${a}x}`)} : utilise ${m(`f(0) = ${y0}`)}.` : `La solution constante est ${m(`-\\frac{${b}}{${a}} = ${fr(partF)}`)}.`],
      solution: [
        `${m(`f(x) = C\\mathrm{e}^{${a}x}${b === 0 ? '' : ` + ${paren(fr(partF))}`}`)}.`,
        `${m(`f(0) = C${b === 0 ? '' : ` + ${paren(fr(partF))}`} = ${y0}`)}, donc ${m(`C = ${fr(Cf)}`)}.`,
        `${m(`f(x) = ${fr(Cf)}\\,\\mathrm{e}^{${a}x}${b === 0 ? '' : ` ${F.val(partF) < 0 ? '-' : '+'} ${fr(frac(Math.abs(partF.n), partF.d))}`}`)}.`,
      ],
      meta: { a, b, y0, C, part },
    };
  },
});

export const ANALYSE_GENERATORS = [suiteArithGeo, suiteLimite, limiteFonction, tvi, expLnEquations, lnDecomposition, primitives, integrale, equaDiff];
