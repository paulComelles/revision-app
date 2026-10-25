/** Maths spé — géométrie dans l'espace, loi binomiale, dénombrement. */
import { frac } from '../../lib/fraction';
import { defineGenerator } from '../define';
import { fr, lin, m, num, paren, signed } from '../helpers';

const L = 'fr' as const;
const nf = (x: number) => num(x, L);
const vec = (v: (number | string)[]) => `\\begin{pmatrix} ${v.join(' \\\\ ')} \\end{pmatrix}`;

export function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

// ---------------------------------------------------------------- géométrie dans l'espace
export const espace = defineGenerator({
  id: 'maths-espace',
  subject: 'maths',
  skill: 'maths-espace',
  title: 'Produit scalaire, plans et droites de l’espace',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 150,
  build(rng, d) {
    if (d === 'easy') {
      // orthogonality: find m so that u ⟂ v
      const u = [rng.nonZero(-5, 5), rng.int(-5, 5), rng.int(-5, 5)];
      const v2 = rng.int(-5, 5);
      const v3 = rng.int(-5, 5);
      // u1 m + u2 v2 + u3 v3 = 0  -> m = -(u2 v2 + u3 v3)/u1
      const mval = frac(-(u[1] * v2 + u[2] * v3), u[0]);
      return {
        prompt: `Dans un repère orthonormé, on considère ${m(`\\vec u ${vec(u)}`)} et ${m(`\\vec v ${vec(['m', v2, v3])}`)}. Pour quelle valeur de ${m('m')} les vecteurs sont-ils orthogonaux ?`,
        answer: { kind: 'number', value: mval.n / mval.d, tolerance: 1e-9 },
        answerDisplay: m(`m = ${fr(mval)}`),
        hints: ['Deux vecteurs sont orthogonaux si et seulement si leur produit scalaire est nul.', `${m(`\\vec u \\cdot \\vec v = ${u[0]}m + ${paren(u[1])} \\times ${paren(v2)} + ${paren(u[2])} \\times ${paren(v3)}`)}.`],
        solution: [`${m(`\\vec u \\cdot \\vec v = ${u[0]}m${signed(u[1] * v2 + u[2] * v3, L)}`)}.`, `${m(`${u[0]}m${signed(u[1] * v2 + u[2] * v3, L)} = 0`)}.`, `${m(`m = ${fr(mval)}`)}.`],
        meta: { kind: 'ortho', u, v2, v3, m: mval.n / mval.d },
      };
    }
    if (d === 'medium') {
      // plane through A with normal n: a x + b y + c z + dd = 0 -> dd
      const n = [rng.nonZero(-5, 5), rng.int(-5, 5), rng.nonZero(-5, 5)];
      const A = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)];
      const dd = -(n[0] * A[0] + n[1] * A[1] + n[2] * A[2]);
      return {
        prompt: `Le plan ${m('\\mathcal{P}')} passe par ${m(`A(${A.join(' ; ')})`)} et admet ${m(`\\vec n ${vec(n)}`)} pour vecteur normal. Son équation cartésienne s'écrit ${m(`${lin([[n[0], 'x'], [n[1], 'y'], [n[2], 'z']], 0, L)} + d = 0`)}. Donne ${m('d')}.`,
        answer: { kind: 'number', value: dd, tolerance: 0 },
        answerDisplay: m(`d = ${dd}`),
        hints: ['Un vecteur normal $(a ; b ; c)$ donne une équation $ax + by + cz + d = 0$ ; le point $A$ doit la vérifier.', `Remplace ${m('x, y, z')} par les coordonnées de ${m('A')}.`],
        solution: [`${m(`${n[0]} \\times ${paren(A[0])} + ${paren(n[1])} \\times ${paren(A[1])} + ${paren(n[2])} \\times ${paren(A[2])} + d = 0`)}.`, `${m(`${-dd} + d = 0`)}.`, `${m(`d = ${dd}`)}.`],
        meta: { kind: 'plane', n, A, d: dd },
      };
    }
    // intersection of line (param) with plane
    const nrm = [rng.nonZero(-3, 3), rng.int(-3, 3), rng.nonZero(-3, 3)];
    const dir = [rng.int(-3, 3), rng.int(-3, 3), rng.nonZero(-3, 3)];
    if (nrm[0] * dir[0] + nrm[1] * dir[1] + nrm[2] * dir[2] === 0) dir[2] += dir[2] > 0 ? 1 : -1;
    const t0 = rng.int(-3, 3);
    const P0 = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)];
    const I = P0.map((p, i) => p + t0 * dir[i]);
    const dd = -(nrm[0] * I[0] + nrm[1] * I[1] + nrm[2] * I[2]);
    const param = ['x', 'y', 'z'].map((c, i) => `${c} = ${lin([[dir[i], 't']], P0[i], L)}`).join(' \\\\ ');
    return {
      prompt: `La droite ${m('\\mathcal{D}')} a pour représentation paramétrique ${m(`\\left\\{\\begin{array}{l} ${param} \\end{array}\\right. \\quad (t \\in \\mathbb{R})`)} et le plan ${m('\\mathcal{P}')} a pour équation ${m(`${lin([[nrm[0], 'x'], [nrm[1], 'y'], [nrm[2], 'z']], dd, L)} = 0`)}. Donne les coordonnées du point d'intersection.`,
      answer: {
        kind: 'fields',
        fields: [
          { label: '$x$', kind: 'number', value: I[0], tolerance: 1e-9 },
          { label: '$y$', kind: 'number', value: I[1], tolerance: 1e-9 },
          { label: '$z$', kind: 'number', value: I[2], tolerance: 1e-9 },
        ],
      },
      answerDisplay: m(`(${I.join(' ; ')})`),
      hints: ['Remplace $x$, $y$, $z$ de la représentation paramétrique dans l’équation du plan pour trouver $t$.', `On obtient une équation du premier degré en ${m('t')}.`],
      solution: [
        `${m(`${nrm[0]}(${lin([[dir[0], 't']], P0[0], L)}) + ${paren(nrm[1])}(${lin([[dir[1], 't']], P0[1], L)}) + ${paren(nrm[2])}(${lin([[dir[2], 't']], P0[2], L)})${signed(dd, L)} = 0`)}.`,
        `${m(`t = ${t0}`)}.`,
        `Point d'intersection : ${m(`(${I.join(' ; ')})`)}.`,
      ],
      meta: { kind: 'intersection', nrm, dir, P0, d: dd, I, t0 },
    };
  },
});

// ---------------------------------------------------------------- loi binomiale
export const binomiale = defineGenerator({
  id: 'maths-binomiale',
  subject: 'maths',
  skill: 'maths-binomiale',
  title: 'Loi binomiale',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 120,
  build(rng, d) {
    const n = rng.int(5, 12);
    const p = rng.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8]);
    const kind = d === 'easy' ? rng.pick(['esp', 'eq'] as const) : d === 'medium' ? rng.pick(['le', 'atleast1'] as const) : rng.pick(['ge', 'var'] as const);
    const pk = (j: number) => binom(n, j) * p ** j * (1 - p) ** (n - j);
    const cdf = (j: number) => Array.from({ length: j + 1 }, (_, i) => pk(i)).reduce((a, b) => a + b, 0);
    // choose k so that the asked probability is meaningful (not ~0 or ~1)
    const candidates = Array.from({ length: n - 1 }, (_, i) => i + 1).filter((j) => {
      const v = kind === 'eq' ? pk(j) : kind === 'le' ? cdf(j) : 1 - cdf(j - 1);
      return v > 0.01 && v < 0.99;
    });
    const k = candidates.length ? rng.pick(candidates) : Math.round(n * p) || 1;
    let value: number;
    let ask: string;
    let steps: string[];
    let hint2: string;
    switch (kind) {
      case 'esp':
        value = n * p;
        ask = m('E(X)');
        hint2 = `${m(`n = ${n}`)}, ${m(`p = ${nf(p)}`)}.`;
        steps = [`${m('E(X) = np')}.`, `${m(`E(X) = ${n} \\times ${nf(p)} = ${nf(value)}`)}.`];
        break;
      case 'var':
        value = n * p * (1 - p);
        ask = m('V(X)');
        hint2 = `${m('V(X) = np(1-p)')}.`;
        steps = [`${m('V(X) = np(1-p)')}.`, `${m(`V(X) = ${n} \\times ${nf(p)} \\times ${nf(1 - p)} = ${nf(value)}`)}.`];
        break;
      case 'eq':
        value = pk(k);
        ask = m(`P(X = ${k})`);
        hint2 = `${m(`P(X = k) = \\binom{n}{k}p^k(1-p)^{n-k}`)}, avec ${m(`\\binom{${n}}{${k}} = ${binom(n, k)}`)}.`;
        steps = [`${m(`P(X = ${k}) = \\binom{${n}}{${k}} \\times ${nf(p)}^{${k}} \\times ${nf(1 - p)}^{${n - k}}`)}.`, `${m(`\\binom{${n}}{${k}} = ${binom(n, k)}`)}.`];
        break;
      case 'le':
        value = Array.from({ length: k + 1 }, (_, j) => pk(j)).reduce((a, b) => a + b, 0);
        ask = m(`P(X \\le ${k})`);
        hint2 = `${m(`P(X \\le ${k}) = P(X = 0) + \\dots + P(X = ${k})`)} (ou la fonction de répartition de la calculatrice).`;
        steps = [`${m(`P(X \\le ${k}) = \\sum_{j=0}^{${k}} \\binom{${n}}{j}${nf(p)}^j ${nf(1 - p)}^{${n}-j}`)}.`, 'Calcul à la calculatrice (binomFRép).'];
        break;
      case 'ge':
        value = 1 - Array.from({ length: k }, (_, j) => pk(j)).reduce((a, b) => a + b, 0);
        ask = m(`P(X \\ge ${k})`);
        hint2 = `${m(`P(X \\ge ${k}) = 1 - P(X \\le ${k - 1})`)}.`;
        steps = [`${m(`P(X \\ge ${k}) = 1 - P(X \\le ${k - 1})`)}.`, 'Calcul à la calculatrice.'];
        break;
      case 'atleast1':
        value = 1 - (1 - p) ** n;
        ask = m('P(X \\ge 1)');
        hint2 = `${m('P(X \\ge 1) = 1 - P(X = 0)')}.`;
        steps = [`${m('P(X \\ge 1) = 1 - P(X = 0)')}.`, `${m(`= 1 - ${nf(1 - p)}^{${n}}`)}.`];
        break;
    }
    const exact = ['esp', 'var'].includes(kind);
    const shown = exact ? nf(value) : nf(Math.round(value * 1000) / 1000);
    return {
      prompt: `La variable aléatoire ${m('X')} suit la loi binomiale ${m(`\\mathcal{B}(${n} ; ${nf(p)})`)}. Calcule ${ask}${exact ? '' : ` (arrondi à ${m('10^{-3}')})`}.`,
      answer: { kind: 'number', value, tolerance: exact ? 1e-9 : 6e-4 },
      answerDisplay: `${ask} ${exact ? '=' : '≈'} ${m(shown)}`,
      hints: ['$X$ compte le nombre de succès dans $n$ répétitions indépendantes d’une épreuve de Bernoulli de paramètre $p$.', hint2],
      solution: [...steps, `${ask} ${exact ? '=' : '≈'} ${m(shown)}.`],
      meta: { kind, n, p, k, value },
    };
  },
});

// ---------------------------------------------------------------- dénombrement
export const denombrement = defineGenerator({
  id: 'maths-denombrement',
  subject: 'maths',
  skill: 'maths-combinatoire',
  title: 'Dénombrement',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 100,
  build(rng, d) {
    const kind = d === 'easy' ? rng.pick(['uplets', 'perm'] as const) : d === 'medium' ? rng.pick(['arr', 'comb'] as const) : rng.pick(['atleast', 'subsets'] as const);
    if (kind === 'uplets') {
      const n = rng.int(2, 10);
      const k = rng.int(2, 5);
      const v = n ** k;
      return {
        prompt: `Un code est formé de ${m(`${k}`)} symboles choisis (avec répétition possible) parmi ${m(`${n}`)} symboles. Combien de codes différents existe-t-il ?`,
        answer: { kind: 'number', value: v, tolerance: 0 },
        answerDisplay: m(`${n}^{${k}} = ${v}`),
        hints: ['Il s’agit de $k$-uplets d’un ensemble à $n$ éléments.', `${m(`${n}`)} choix pour chaque position.`],
        solution: [`Chaque position : ${m(`${n}`)} choix, ${m(`${k}`)} positions.`, `${m(`${n}^{${k}}`)}.`, `${m(`= ${v}`)}.`],
        meta: { kind, n, k, v },
      };
    }
    if (kind === 'perm') {
      const n = rng.int(3, 8);
      const v = Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
      return {
        prompt: `De combien de façons peut-on ranger ${m(`${n}`)} livres distincts sur une étagère ?`,
        answer: { kind: 'number', value: v, tolerance: 0 },
        answerDisplay: m(`${n}! = ${v}`),
        hints: ['Ce sont les permutations d’un ensemble à $n$ éléments.', `${m(`${n}`)} choix pour la 1re place, ${m(`${n - 1}`)} pour la 2e, …`],
        solution: [`Nombre de permutations : ${m(`${n}!`)}.`, `${m(`${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(' \\times ')}`)}.`, `${m(`= ${v}`)}.`],
        meta: { kind, n, v },
      };
    }
    if (kind === 'arr') {
      const n = rng.int(5, 12);
      const k = rng.int(2, 4);
      const v = Array.from({ length: k }, (_, i) => n - i).reduce((a, b) => a * b, 1);
      return {
        prompt: `Une course compte ${m(`${n}`)} participants. Combien de classements des ${m(`${k}`)} premières places (${Array.from({ length: k }, (_, i) => (i === 0 ? '1er' : `${i + 1}e`)).join(', ')}) sont possibles ?`,
        answer: { kind: 'number', value: v, tolerance: 0 },
        answerDisplay: m(`${Array.from({ length: k }, (_, i) => n - i).join(' \\times ')} = ${v}`),
        hints: ['L’ordre compte et il n’y a pas de répétition : ce sont des arrangements.', `${m(`${n}`)} choix pour la 1re place, puis ${m(`${n - 1}`)}…`],
        solution: [`Arrangements de ${m(`${k}`)} parmi ${m(`${n}`)} : ${m(`\\frac{${n}!}{${n - k}!}`)}.`, `${m(Array.from({ length: k }, (_, i) => n - i).join(' \\times '))}.`, `${m(`= ${v}`)}.`],
        meta: { kind, n, k, v },
      };
    }
    if (kind === 'comb') {
      const n = rng.int(5, 15);
      const k = rng.int(2, 5);
      const v = binom(n, k);
      return {
        prompt: `Dans une classe de ${m(`${n}`)} élèves, on choisit un groupe de ${m(`${k}`)} élèves (sans ordre). Combien de groupes différents peut-on former ?`,
        answer: { kind: 'number', value: v, tolerance: 0 },
        answerDisplay: m(`\\binom{${n}}{${k}} = ${v}`),
        hints: ['L’ordre ne compte pas : ce sont des combinaisons.', `${m(`\\binom{${n}}{${k}} = \\frac{${n}!}{${k}!\\,${n - k}!}`)}.`],
        solution: [`${m(`\\binom{${n}}{${k}}`)}.`, `${m(`\\frac{${Array.from({ length: k }, (_, i) => n - i).join(' \\times ')}}{${k}!}`)}.`, `${m(`= ${v}`)}.`],
        meta: { kind, n, k, v },
      };
    }
    if (kind === 'atleast') {
      // draw k cards among n containing a aces: number of hands with at least one ace
      const n = rng.int(8, 16);
      const a = rng.int(2, 4);
      const k = rng.int(2, 4);
      const v = binom(n, k) - binom(n - a, k);
      return {
        prompt: `Une urne contient ${m(`${n}`)} jetons dont ${m(`${a}`)} rouges. On tire simultanément ${m(`${k}`)} jetons. Combien de tirages contiennent au moins un jeton rouge ?`,
        answer: { kind: 'number', value: v, tolerance: 0 },
        answerDisplay: m(`\\binom{${n}}{${k}} - \\binom{${n - a}}{${k}} = ${v}`),
        hints: ['« Au moins un » : passe par l’événement contraire (aucun jeton rouge).', `Tirages sans rouge : ${m(`\\binom{${n - a}}{${k}}`)}.`],
        solution: [`Total : ${m(`\\binom{${n}}{${k}} = ${binom(n, k)}`)}.`, `Sans rouge : ${m(`\\binom{${n - a}}{${k}} = ${binom(n - a, k)}`)}.`, `${m(`${binom(n, k)} - ${binom(n - a, k)} = ${v}`)}.`],
        meta: { kind, n, a, k, v },
      };
    }
    const n = rng.int(3, 12);
    return {
      prompt: `Combien de parties (sous-ensembles) possède un ensemble à ${m(`${n}`)} éléments ?`,
      answer: { kind: 'number', value: 2 ** n, tolerance: 0 },
      answerDisplay: m(`2^{${n}} = ${2 ** n}`),
      hints: ['Pour chaque élément : il est dans la partie ou non.', `${m('2')} choix par élément, ${m(`${n}`)} éléments.`],
      solution: ['Chaque élément : 2 possibilités.', `${m(`2^{${n}}`)}.`, `${m(`= ${2 ** n}`)}.`],
      meta: { kind: 'subsets', n, v: 2 ** n },
    };
  },
});

export const AUTRES_GENERATORS = [espace, binomiale, denombrement];
