/** Maths expertes — matrices et graphes, chaînes de Markov, arithmétique, nombres complexes. */
import { F, frac, gcd, type Frac } from '../../lib/fraction';
import type { Rng } from '../../lib/rng';
import { SvgBuilder, type Pt } from '../../lib/svg';
import { parseNumberFr } from '../../lib/expr';
import { defineGenerator } from '../define';
import { fr, m, num, paren, signed } from '../helpers';
import type { FieldSpec, Figure } from '../types';

const L = 'fr' as const;
const nf = (x: number) => num(x, L);
type Mat = number[][];

export const matMul = (A: Mat, B: Mat): Mat => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)));
export const matPow = (A: Mat, n: number): Mat => {
  let R: Mat = A.map((r, i) => r.map((_, j) => (i === j ? 1 : 0)));
  for (let i = 0; i < n; i++) R = matMul(R, A);
  return R;
};
const texMat = (A: (number | string)[][]) => `\\begin{pmatrix} ${A.map((r) => r.map((x) => (typeof x === 'number' ? nf(x) : x)).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
const randMat = (rng: Rng, r: number, c: number, lo = -4, hi = 5): Mat => Array.from({ length: r }, () => Array.from({ length: c }, () => rng.int(lo, hi)));
const matFields = (M: Mat, name = 'c'): FieldSpec[] =>
  M.flatMap((row, i) => row.map((v, j) => ({ label: `$${name}_{${i + 1}${j + 1}}$`, kind: 'number' as const, value: v, tolerance: 1e-9 })));
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ---------------------------------------------------------------- matrices
export const matriceProduit = defineGenerator({
  id: 'exp-matrice-produit',
  subject: 'expertes',
  skill: 'exp-matrices',
  title: 'Produit et puissance de matrices',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 150,
  build(rng, d) {
    if (d === 'hard') {
      const A = randMat(rng, 2, 2, -2, 3);
      const n = 3;
      const R = matPow(A, n);
      return {
        prompt: `Soit ${m(`A = ${texMat(A)}`)}. Calcule ${m('A^3')}.`,
        answer: { kind: 'fields', layout: 'matrix', cols: 2, fields: matFields(R) },
        answerDisplay: m(`A^3 = ${texMat(R)}`),
        hints: ['$A^3 = A \\times A \\times A$ : calcule d’abord $A^2$.', `Coefficient ${m('(i,j)')} d'un produit : ligne ${m('i')} de la première matrice × colonne ${m('j')} de la seconde.`],
        solution: [`${m(`A^2 = ${texMat(matMul(A, A))}`)}.`, `${m(`A^3 = A^2 \\times A`)}.`, `${m(`A^3 = ${texMat(R)}`)}.`],
        meta: { kind: 'power', A, n, R },
      };
    }
    const n = d === 'easy' ? 2 : 3;
    const A = randMat(rng, n, n);
    const B = randMat(rng, n, n === 2 ? 2 : 1 + rng.int(0, 1) * 2);
    const C = matMul(A, B);
    return {
      prompt: `Soit ${m(`A = ${texMat(A)}`)} et ${m(`B = ${texMat(B)}`)}. Calcule ${m('C = AB')}.`,
      answer: { kind: 'fields', layout: 'matrix', cols: C[0].length, fields: matFields(C) },
      answerDisplay: m(`AB = ${texMat(C)}`),
      hints: ['Le coefficient $c_{ij}$ est le produit de la ligne $i$ de $A$ par la colonne $j$ de $B$.', `${m(`c_{11} = ${A[0].map((a, k) => `${paren(a)} \\times ${paren(B[k][0])}`).join(' + ')}`)}.`],
      solution: [`${m(`c_{11} = ${A[0].map((a, k) => `${paren(a)} \\times ${paren(B[k][0])}`).join(' + ')} = ${C[0][0]}`)}.`, 'Même calcul pour chaque coefficient.', `${m(`AB = ${texMat(C)}`)}.`],
      meta: { kind: 'product', A, B, C },
    };
  },
});

export const matriceInverse = defineGenerator({
  id: 'exp-matrice-inverse',
  subject: 'expertes',
  skill: 'exp-matrices',
  title: 'Inverse d’une matrice 2×2',
  formats: ['input'],
  difficulties: ['medium', 'hard'],
  targetSec: 120,
  build(rng, d) {
    let a: number, b: number, c: number, e: number, det: number;
    do {
      a = rng.int(-5, 5);
      b = rng.int(-5, 5);
      c = rng.int(-5, 5);
      e = rng.int(-5, 5);
      det = a * e - b * c;
    } while (det === 0 || (d === 'medium' && Math.abs(det) !== 1));
    const inv: Frac[][] = [
      [frac(e, det), frac(-b, det)],
      [frac(-c, det), frac(a, det)],
    ];
    return {
      prompt: `Soit ${m(`A = ${texMat([[a, b], [c, e]])}`)}. Détermine ${m('A^{-1}')} (fractions acceptées, ex. 2/3).`,
      answer: { kind: 'fields', layout: 'matrix', cols: 2, fields: inv.flatMap((r, i) => r.map((v, j) => ({ label: `$a'_{${i + 1}${j + 1}}$`, kind: 'number' as const, value: F.val(v), tolerance: 1e-9 }))) },
      answerDisplay: m(`A^{-1} = \\begin{pmatrix} ${inv.map((r) => r.map(fr).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`),
      hints: ['Pour $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ avec $ad - bc \\ne 0$ : $A^{-1} = \\frac{1}{ad - bc}\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$.', `${m(`\\det A = ${a} \\times ${paren(e)} - ${paren(b)} \\times ${paren(c)} = ${det}`)}.`],
      solution: [`${m(`\\det A = ${det} \\ne 0`)} : ${m('A')} est inversible.`, `${m(`A^{-1} = \\frac{1}{${det}}${texMat([[e, -b], [-c, a]])}`)}.`, `${m(`A^{-1} = \\begin{pmatrix} ${inv.map((r) => r.map(fr).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`)}.`],
      meta: { A: [[a, b], [c, e]], inv: inv.map((r) => r.map(F.val)) },
    };
  },
});

// ---------------------------------------------------------------- graphes
function graphFigure(n: number, adj: Mat, directed: boolean): Figure {
  const W = 260;
  const H = 230;
  const svg = new SvgBuilder(W, H);
  const C: Pt = [W / 2, H / 2];
  const R = 85;
  const P: Pt[] = Array.from({ length: n }, (_, i) => [C[0] + R * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n), C[1] + R * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n)]);
  if (directed) svg.raw('<defs><marker id="arr" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>');
  const r = 13;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (!adj[i][j]) continue;
      if (!directed && j < i) continue;
      const both = directed && adj[j][i];
      const dx = P[j][0] - P[i][0];
      const dy = P[j][1] - P[i][1];
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      // offset parallel arcs when both directions exist
      const off = both ? 5 : 0;
      const ox = -uy * off;
      const oy = ux * off;
      const a: Pt = [P[i][0] + ux * r + ox, P[i][1] + uy * r + oy];
      const b: Pt = [P[j][0] - ux * (r + 2) + ox, P[j][1] - uy * (r + 2) + oy];
      svg.raw(`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="currentColor" stroke-width="1.6"${directed ? ' marker-end="url(#arr)"' : ''}/>`);
    }
  P.forEach((p, i) => {
    svg.circle(p, r, { fill: 'rgba(57,135,229,0.15)', color: '#3987e5' });
    svg.text(p, LETTERS[i], { size: 13 });
  });
  return { kind: 'svg', svg: svg.toString(), alt: `Graphe ${directed ? 'orienté' : 'non orienté'} à ${n} sommets` };
}

function randomGraph(rng: Rng, n: number, directed: boolean): Mat {
  for (;;) {
    const A: Mat = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (!directed && j < i) continue;
        if (rng.next() < (directed ? 0.4 : 0.55)) {
          A[i][j] = 1;
          if (!directed) A[j][i] = 1;
        }
      }
    // every vertex has at least one edge
    if (A.every((row, i) => row.some((x) => x) || A.some((r) => r[i]))) return A;
  }
}

export const grapheChemins = defineGenerator({
  id: 'exp-graphe-chemins',
  subject: 'expertes',
  skill: 'exp-matrices',
  title: 'Matrice d’adjacence et nombre de chemins',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 180,
  build(rng, d) {
    const n = d === 'easy' ? 4 : rng.int(4, 5);
    const directed = d !== 'easy' && rng.bool(0.6);
    const A = randomGraph(rng, n, directed);
    const figure = graphFigure(n, A, directed);
    const order = LETTERS.slice(0, n).join(', ');
    if (d === 'easy') {
      return {
        prompt: `On considère le graphe non orienté ci-dessous, sommets rangés dans l'ordre ${order}. Donne sa matrice d'adjacence ${m('M')}.`,
        figure,
        answer: { kind: 'fields', layout: 'matrix', cols: n, fields: matFields(A, 'm') },
        answerDisplay: m(`M = ${texMat(A)}`),
        hints: ['$m_{ij} = 1$ si une arête relie le $i$-ème et le $j$-ème sommet, $0$ sinon.', 'Pour un graphe non orienté, la matrice est symétrique et sa diagonale est nulle (pas de boucle).'],
        solution: ['Ligne par ligne, on note 1 pour chaque voisin.', `${m(`M = ${texMat(A)}`)}.`],
        meta: { kind: 'adjacency', A },
      };
    }
    const k = d === 'medium' ? 2 : rng.int(3, 4);
    const Mk = matPow(A, k);
    let i = rng.int(0, n - 1);
    let j = rng.int(0, n - 1);
    // prefer a non-trivial count
    for (let t = 0; t < 20 && Mk[i][j] === 0; t++) {
      i = rng.int(0, n - 1);
      j = rng.int(0, n - 1);
    }
    return {
      prompt: `On considère le graphe ${directed ? 'orienté' : 'non orienté'} ci-dessous (sommets dans l'ordre ${order}), de matrice d'adjacence ${m(`M = ${texMat(A)}`)}. Combien existe-t-il de chemins de longueur ${m(`${k}`)} allant de ${m(LETTERS[i])} à ${m(LETTERS[j])} ?`,
      figure,
      answer: { kind: 'number', value: Mk[i][j], tolerance: 0 },
      answerDisplay: m(`(M^{${k}})_{${i + 1}${j + 1}} = ${Mk[i][j]}`),
      hints: [`Le nombre de chemins de longueur ${m('k')} de ${m('i')} à ${m('j')} est le coefficient ${m('(i, j)')} de ${m('M^k')}.`, `Calcule ${m(`M^{${k}}`)} (ou seulement sa ligne ${m(`${i + 1}`)}).`],
      solution: [`${m(`M^{${k}} = ${texMat(Mk)}`)}.`, `Coefficient ligne ${m(`${i + 1}`)} (${LETTERS[i]}), colonne ${m(`${j + 1}`)} (${LETTERS[j]}).`, `${m(`${Mk[i][j]}`)} chemins.`],
      meta: { kind: 'paths', A, k, i, j, count: Mk[i][j], directed },
    };
  },
});

// ---------------------------------------------------------------- chaînes de Markov
function markovFigure(p: Frac, q: Frac): Figure {
  const svg = new SvgBuilder(300, 150);
  svg.raw('<defs><marker id="arm" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>');
  const A: Pt = [80, 80];
  const B: Pt = [220, 80];
  svg.circle(A, 20, { fill: 'rgba(57,135,229,0.15)', color: '#3987e5' }).text(A, 'A');
  svg.circle(B, 20, { fill: 'rgba(57,135,229,0.15)', color: '#3987e5' }).text(B, 'B');
  svg.raw('<path d="M 98 70 Q 150 40 202 70" fill="none" stroke="currentColor" stroke-width="1.6" marker-end="url(#arm)"/>');
  svg.raw('<path d="M 202 90 Q 150 120 98 90" fill="none" stroke="currentColor" stroke-width="1.6" marker-end="url(#arm)"/>');
  svg.raw('<path d="M 64 66 C 30 30 30 130 64 94" fill="none" stroke="currentColor" stroke-width="1.6" marker-end="url(#arm)"/>');
  svg.raw('<path d="M 236 66 C 270 30 270 130 236 94" fill="none" stroke="currentColor" stroke-width="1.6" marker-end="url(#arm)"/>');
  const t = (f: Frac) => (f.d === 1 ? `${f.n}` : `${(f.n / f.d).toFixed(2).replace('.', ',')}`);
  svg.text([150, 42], t(p), { size: 12 }).text([150, 122], t(q), { size: 12 });
  svg.text([24, 80], t(F.sub(frac(1), p)), { size: 12 }).text([276, 80], t(F.sub(frac(1), q)), { size: 12 });
  return { kind: 'svg', svg: svg.toString(), alt: 'Graphe probabiliste à deux états A et B' };
}

export const markov = defineGenerator({
  id: 'exp-markov',
  subject: 'expertes',
  skill: 'exp-markov',
  title: 'Chaîne de Markov à deux états',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 180,
  build(rng, d) {
    const p = frac(rng.int(1, 9), 10); // A -> B
    const q = frac(rng.int(1, 9), 10); // B -> A
    const P = [
      [1 - F.val(p), F.val(p)],
      [F.val(q), 1 - F.val(q)],
    ];
    const figure = markovFigure(p, q);
    const Ptex = `\\begin{pmatrix} ${nf(P[0][0])} & ${nf(P[0][1])} \\\\ ${nf(P[1][0])} & ${nf(P[1][1])} \\end{pmatrix}`;
    if (d === 'hard') {
      const a = F.div(q, F.add(p, q));
      const b = F.div(p, F.add(p, q));
      return {
        prompt: `Une chaîne de Markov sur les états A et B est représentée par le graphe ci-dessous (matrice de transition ${m(`P = ${Ptex}`)}). Détermine la distribution invariante ${m('\\pi = (a \\;\\; b)')} vérifiant ${m('\\pi P = \\pi')} et ${m('a + b = 1')}.`,
        figure,
        answer: {
          kind: 'fields',
          fields: [
            { label: '$a$', kind: 'number', value: F.val(a), tolerance: 1e-6 },
            { label: '$b$', kind: 'number', value: F.val(b), tolerance: 1e-6 },
          ],
        },
        answerDisplay: m(`\\pi = \\left(${fr(a)} \\;\\; ${fr(b)}\\right)`),
        hints: ['Écris $\\pi P = \\pi$ : on obtient deux équations équivalentes, à compléter par $a + b = 1$.', `${m(`a = ${nf(P[0][0])}a + ${nf(P[1][0])}b`)}.`],
        solution: [`${m(`a = ${nf(P[0][0])}a + ${nf(P[1][0])}b \\iff ${nf(F.val(p))}a = ${nf(F.val(q))}b`)}.`, `Avec ${m('a + b = 1')} : ${m(`a = \\frac{${nf(F.val(q))}}{${nf(F.val(p))} + ${nf(F.val(q))}}`)}.`, `${m(`\\pi = \\left(${fr(a)} \\;\\; ${fr(b)}\\right)`)}.`],
        meta: { kind: 'stationary', P, a: F.val(a), b: F.val(b) },
      };
    }
    const n = d === 'easy' ? 1 : 2;
    const start = rng.pick([
      [1, 0],
      [0, 1],
      [0.5, 0.5],
    ]);
    let dist = start;
    for (let i = 0; i < n; i++) dist = [dist[0] * P[0][0] + dist[1] * P[1][0], dist[0] * P[0][1] + dist[1] * P[1][1]];
    return {
      prompt: `Une chaîne de Markov sur les états A et B est représentée par le graphe ci-dessous. La distribution initiale est ${m(`\\pi_0 = (${nf(start[0])} \\;\\; ${nf(start[1])})`)}. Détermine ${m(`\\pi_{${n}} = (a \\;\\; b)`)}.`,
      figure,
      answer: {
        kind: 'fields',
        fields: [
          { label: '$a$', kind: 'number', value: dist[0], tolerance: 1e-6 },
          { label: '$b$', kind: 'number', value: dist[1], tolerance: 1e-6 },
        ],
      },
      answerDisplay: m(`\\pi_{${n}} = (${nf(dist[0])} \\;\\; ${nf(dist[1])})`),
      hints: ['$\\pi_{n+1} = \\pi_n P$ où $P$ est la matrice de transition (lignes = état de départ).', `${m(`P = ${Ptex}`)}.`],
      solution: [`${m(`P = ${Ptex}`)}.`, `${m(`\\pi_{${n}} = \\pi_0 P${n === 2 ? '^2' : ''}`)}.`, `${m(`\\pi_{${n}} = (${nf(dist[0])} \\;\\; ${nf(dist[1])})`)}.`],
      meta: { kind: 'distribution', P, start, n, dist },
    };
  },
});

// ---------------------------------------------------------------- arithmétique
const mod = (a: number, n: number) => ((a % n) + n) % n;
const intIn = (s: string) => {
  const v = parseNumberFr(s);
  if (!Number.isInteger(v)) throw new Error('Entier attendu.');
  return v;
};

export const pgcdGen = defineGenerator({
  id: 'exp-pgcd',
  subject: 'expertes',
  skill: 'exp-arithmetique',
  title: 'PGCD (algorithme d’Euclide)',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 90,
  build(rng, d) {
    const g = rng.int(2, d === 'hard' ? 40 : 15);
    let u = rng.int(2, d === 'easy' ? 12 : 60);
    let v = rng.int(2, d === 'easy' ? 12 : 60);
    while (gcd(u, v) !== 1 || u === v) {
      u = rng.int(2, 60);
      v = rng.int(2, 60);
    }
    const a = g * Math.max(u, v);
    const b = g * Math.min(u, v);
    const steps: string[] = [];
    let x = a;
    let y = b;
    while (y) {
      steps.push(`${x} = ${y} \\times ${Math.floor(x / y)} + ${x % y}`);
      [x, y] = [y, x % y];
    }
    return {
      prompt: `Calcule ${m(`\\mathrm{PGCD}(${a} ; ${b})`)}.`,
      answer: { kind: 'number', value: g, tolerance: 0 },
      answerDisplay: m(`\\mathrm{PGCD}(${a} ; ${b}) = ${g}`),
      hints: ['Algorithme d’Euclide : $\\mathrm{PGCD}(a ; b) = \\mathrm{PGCD}(b ; r)$ où $r$ est le reste de $a$ par $b$.', `Première division : ${m(steps[0])}.`],
      solution: [...steps.map((s) => `${m(s)}`), `Le dernier reste non nul est ${m(`${g}`)}.`],
      meta: { a, b, g },
    };
  },
});

function egcd(a: number, b: number): [number, number, number] {
  if (b === 0) return [a, 1, 0];
  const [g, x, y] = egcd(b, a % b);
  return [g, y, x - Math.floor(a / b) * y];
}

export const bezoutGen = defineGenerator({
  id: 'exp-bezout',
  subject: 'expertes',
  skill: 'exp-arithmetique',
  title: 'Relation de Bézout et équations diophantiennes',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 180,
  build(rng, d) {
    let a: number, b: number;
    do {
      a = rng.int(5, d === 'easy' ? 30 : 90);
      b = rng.int(3, d === 'easy' ? 25 : 70);
    } while (gcd(a, b) !== 1 || a === b);
    const [, u0, v0] = egcd(a, b);
    const c = d === 'hard' ? rng.int(2, 12) : 1;
    return {
      prompt:
        c === 1
          ? `Trouve un couple d'entiers ${m('(u ; v)')} tel que ${m(`${a}u + ${b}v = 1`)}.`
          : `Trouve une solution entière ${m('(x ; y)')} de l'équation ${m(`${a}x + ${b}y = ${c}`)}.`,
      answer: {
        kind: 'custom',
        fields: [{ label: c === 1 ? '$u$' : '$x$' }, { label: c === 1 ? '$v$' : '$y$' }],
        checker: (inp) => a * intIn(inp[0]) + b * intIn(inp[1]) === c,
      },
      answerDisplay: `Par exemple ${m(`(${u0 * c} ; ${v0 * c})`)} — toute solution vérifiant l'égalité est acceptée.`,
      hints: [`${m(`\\mathrm{PGCD}(${a} ; ${b}) = 1`)} : le théorème de Bézout garantit l'existence. Remonte l'algorithme d'Euclide.`, `Commence par ${m(`${a} = ${b} \\times ${Math.floor(a / b)} + ${a % b}`)}.`],
      solution: [
        `Algorithme d'Euclide étendu sur ${m(`(${a} ; ${b})`)}.`,
        `${m(`${a} \\times ${paren(u0)} + ${b} \\times ${paren(v0)} = 1`)}.`,
        c === 1 ? `${m(`(u ; v) = (${u0} ; ${v0})`)} convient.` : `On multiplie par ${m(`${c}`)} : ${m(`(x ; y) = (${u0 * c} ; ${v0 * c})`)}.`,
      ],
      meta: { a, b, c, canonical: [`${u0 * c}`, `${v0 * c}`] },
    };
  },
});

export const congruenceGen = defineGenerator({
  id: 'exp-congruences',
  subject: 'expertes',
  skill: 'exp-arithmetique',
  title: 'Congruences et inverse modulaire',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 150,
  build(rng, d) {
    if (d === 'hard') {
      // inverse of a modulo n
      const n = rng.pick([7, 9, 11, 13, 17, 19, 23, 26]);
      let a = rng.int(2, n - 1);
      while (gcd(a, n) !== 1) a = rng.int(2, n - 1);
      let inv = 1;
      while (mod(a * inv, n) !== 1) inv++;
      return {
        prompt: `Trouve un entier ${m('x')} tel que ${m(`${a}x \\equiv 1 \\pmod{${n}}`)}.`,
        answer: { kind: 'custom', fields: [{ label: '$x$' }], checker: (inp) => mod(a * intIn(inp[0]), n) === 1 },
        answerDisplay: m(`x \\equiv ${inv} \\pmod{${n}}`),
        hints: [`${m('x')} est un inverse de ${m(`${a}`)} modulo ${m(`${n}`)} : il existe car ${m(`\\mathrm{PGCD}(${a} ; ${n}) = 1`)}.`, `Teste ${m('x = 1, 2, 3, …')} ou utilise une relation de Bézout ${m(`${a}u + ${n}v = 1`)}.`],
        solution: [`On cherche ${m(`${a}x - 1`)} multiple de ${m(`${n}`)}.`, `${m(`${a} \\times ${inv} = ${a * inv} = ${Math.floor((a * inv) / n)} \\times ${n} + 1`)}.`, `${m(`x = ${inv}`)} (à ${m(`${n}`)} près).`],
        meta: { kind: 'inverse', a, n, inv, canonical: [`${inv}`] },
      };
    }
    // a^e mod n
    const n = rng.pick(d === 'easy' ? [3, 4, 5, 7, 9, 10] : [7, 9, 11, 13, 17]);
    const a = rng.int(2, 30);
    const e = rng.int(d === 'easy' ? 5 : 20, d === 'easy' ? 20 : 2000);
    let r = 1;
    for (let i = 0; i < e; i++) r = mod(r * a, n);
    // cycle of powers
    const cyc: number[] = [];
    let p = mod(a, n);
    for (let i = 0; i < n + 1 && !cyc.includes(p); i++) {
      cyc.push(p);
      p = mod(p * a, n);
    }
    return {
      prompt: `Détermine le reste de la division euclidienne de ${m(`${a}^{${e}}`)} par ${m(`${n}`)}.`,
      answer: { kind: 'number', value: r, tolerance: 0 },
      answerDisplay: m(`${a}^{${e}} \\equiv ${r} \\pmod{${n}}`),
      hints: ['Réduis d’abord la base modulo $n$, puis cherche une puissance congrue à 1 (cycle des restes).', `${m(`${a} \\equiv ${mod(a, n)} \\pmod{${n}}`)}.`],
      solution: [`${m(`${a} \\equiv ${mod(a, n)} \\pmod{${n}}`)}.`, `Restes successifs des puissances : ${m(cyc.join(', '))}…`, `${m(`${a}^{${e}} \\equiv ${r} \\pmod{${n}}`)} : le reste est ${m(`${r}`)}.`],
      meta: { kind: 'power', a, e, n, r },
    };
  },
});

// ---------------------------------------------------------------- nombres complexes
const cTex = (re: Frac, im: Frac) => {
  if (im.n === 0) return fr(re);
  const imAbs = frac(Math.abs(im.n), im.d);
  const imPart = F.eq(imAbs, frac(1)) ? 'i' : `${fr(imAbs)}i`;
  if (re.n === 0) return `${im.n < 0 ? '-' : ''}${imPart}`;
  return `${fr(re)} ${im.n < 0 ? '-' : '+'} ${imPart}`;
};

export const complexeCalcul = defineGenerator({
  id: 'exp-complexe-calcul',
  subject: 'expertes',
  skill: 'exp-complexes',
  title: 'Forme algébrique d’un nombre complexe',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 120,
  build(rng, d) {
    const a = rng.int(-6, 6);
    const b = rng.nonZero(-6, 6);
    const c = rng.int(-6, 6);
    const e = rng.nonZero(-6, 6);
    let re: Frac;
    let im: Frac;
    let expr: string;
    let steps: string[];
    if (d === 'hard') {
      // (a + bi)/(c + ei)
      const den = c * c + e * e;
      re = frac(a * c + b * e, den);
      im = frac(b * c - a * e, den);
      expr = `\\frac{${cTex(frac(a), frac(b))}}{${cTex(frac(c), frac(e))}}`;
      steps = [`Multiplie par le conjugué ${m(cTex(frac(c), frac(-e)))} : dénominateur ${m(`${c}^2 + ${paren(e)}^2 = ${den}`)}.`, `Numérateur : ${m(`(${cTex(frac(a), frac(b))})(${cTex(frac(c), frac(-e))}) = ${cTex(frac(a * c + b * e), frac(b * c - a * e))}`)}.`];
    } else if (d === 'medium') {
      re = frac(a * c - b * e);
      im = frac(a * e + b * c);
      expr = `(${cTex(frac(a), frac(b))})(${cTex(frac(c), frac(e))})`;
      steps = [`Développe en utilisant ${m('i^2 = -1')}.`, `${m(`${a * c} ${signed(a * e, L)}i ${signed(b * c, L)}i ${signed(-b * e, L)}`)}.`];
    } else {
      re = frac(a - c);
      im = frac(b - e);
      expr = `(${cTex(frac(a), frac(b))}) - (${cTex(frac(c), frac(e))})`;
      steps = ['Soustrais parties réelles et parties imaginaires séparément.', `${m(`(${a} - ${paren(c)}) + (${b} - ${paren(e)})i`)}.`];
    }
    return {
      prompt: `Écris ${m(`z = ${expr}`)} sous forme algébrique ${m('x + iy')}. Donne ${m('x')} et ${m('y')} (fractions acceptées).`,
      answer: {
        kind: 'fields',
        fields: [
          { label: '$x = \\mathrm{Re}(z)$', kind: 'number', value: F.val(re), tolerance: 1e-9 },
          { label: '$y = \\mathrm{Im}(z)$', kind: 'number', value: F.val(im), tolerance: 1e-9 },
        ],
      },
      answerDisplay: m(`z = ${cTex(re, im)}`),
      hints: ['Calcule comme avec des polynômes en $i$, en remplaçant $i^2$ par $-1$. Pour un quotient, multiplie par le conjugué du dénominateur.', steps[0]],
      solution: [...steps, `${m(`z = ${cTex(re, im)}`)}.`],
      meta: { kind: d, a, b, c, e, re: F.val(re), im: F.val(im) },
    };
  },
});

const ARGS: { tex: string; val: number; re: string; im: string; reV: number; imV: number }[] = [
  { tex: '\\frac{\\pi}{6}', val: Math.PI / 6, re: '\\sqrt{3}', im: '1', reV: Math.sqrt(3), imV: 1 },
  { tex: '\\frac{\\pi}{4}', val: Math.PI / 4, re: '1', im: '1', reV: 1, imV: 1 },
  { tex: '\\frac{\\pi}{3}', val: Math.PI / 3, re: '1', im: '\\sqrt{3}', reV: 1, imV: Math.sqrt(3) },
  { tex: '\\frac{2\\pi}{3}', val: (2 * Math.PI) / 3, re: '-1', im: '\\sqrt{3}', reV: -1, imV: Math.sqrt(3) },
  { tex: '\\frac{3\\pi}{4}', val: (3 * Math.PI) / 4, re: '-1', im: '1', reV: -1, imV: 1 },
  { tex: '-\\frac{\\pi}{4}', val: -Math.PI / 4, re: '1', im: '-1', reV: 1, imV: -1 },
  { tex: '-\\frac{\\pi}{3}', val: -Math.PI / 3, re: '1', im: '-\\sqrt{3}', reV: 1, imV: -Math.sqrt(3) },
  { tex: '\\pi', val: Math.PI, re: '-1', im: '0', reV: -1, imV: 0 },
  { tex: '\\frac{\\pi}{2}', val: Math.PI / 2, re: '0', im: '1', reV: 0, imV: 1 },
];

export const complexeModuleArg = defineGenerator({
  id: 'exp-complexe-module-arg',
  subject: 'expertes',
  skill: 'exp-complexes',
  title: 'Module et argument',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 120,
  build(rng, d) {
    if (d === 'easy') {
      const trip = rng.pick([
        [3, 4, 5],
        [5, 12, 13],
        [8, 15, 17],
        [6, 8, 10],
      ]);
      const re = trip[0] * rng.sign();
      const im = trip[1] * rng.sign();
      return {
        prompt: `Calcule le module de ${m(`z = ${cTex(frac(re), frac(im))}`)}.`,
        answer: { kind: 'number', value: trip[2], tolerance: 1e-9 },
        answerDisplay: m(`|z| = ${trip[2]}`),
        hints: ['$|x + iy| = \\sqrt{x^2 + y^2}$.', `${m(`|z| = \\sqrt{${paren(re)}^2 + ${paren(im)}^2}`)}.`],
        solution: [`${m(`|z|^2 = ${re * re} + ${im * im} = ${trip[2] ** 2}`)}.`, `${m(`|z| = ${trip[2]}`)}.`],
        meta: { kind: 'module', re, im, mod: trip[2] },
      };
    }
    const g = rng.pick(ARGS);
    const k = rng.int(1, 4);
    const r = k * Math.hypot(g.reV, g.imV);
    const zTex =
      g.im === '0'
        ? `${-k}`
        : g.re === '0'
          ? `${k === 1 ? '' : k}i`
          : `${k === 1 ? '' : k}(${g.re} ${g.im.startsWith('-') ? '-' : '+'} ${g.im.replace('-', '') === '1' ? '' : g.im.replace('-', '')}i)`;
    const fields = [
      { label: '$r = |z|$' },
      { label: '$\\theta = \\arg(z)$ (en radians, ex. pi/3)' },
    ];
    return {
      prompt: `Donne le module ${m('r')} et un argument ${m('\\theta')} de ${m(`z = ${zTex}`)}.`,
      answer: {
        kind: 'custom',
        fields,
        checker: (inp) => {
          const rr = parseNumberFr(inp[0]);
          const th = parseNumberFr(inp[1]);
          if (Number.isNaN(rr) || Number.isNaN(th)) throw new Error('Nombre non reconnu (ex. 2*sqrt(2), pi/4).');
          const diff = mod(th - g.val + Math.PI, 2 * Math.PI) - Math.PI;
          return Math.abs(rr - r) < 1e-6 && Math.abs(diff) < 1e-6;
        },
      },
      answerDisplay: m(`r = ${nf(Math.round(r * 1000) / 1000)}${Math.abs(r - Math.round(r)) > 1e-9 ? ' \\text{ (valeur exacte avec racine)}' : ''},\\ \\theta \\equiv ${g.tex} \\pmod{2\\pi}`),
      hints: ['$r = \\sqrt{x^2 + y^2}$, puis $\\cos\\theta = \\frac{x}{r}$ et $\\sin\\theta = \\frac{y}{r}$.', `${m(`r = ${k === 1 ? '' : k}\\sqrt{(${g.re})^2 + (${g.im})^2}`)}.`],
      solution: [`${m(`r = ${nf(Math.round(r * 1000) / 1000)}`)}.`, `${m(`\\cos\\theta = ${nf(Math.round((g.reV / Math.hypot(g.reV, g.imV)) * 1000) / 1000)}`)}, ${m(`\\sin\\theta = ${nf(Math.round((g.imV / Math.hypot(g.reV, g.imV)) * 1000) / 1000)}`)}.`, `${m(`\\theta = ${g.tex}`)} (modulo ${m('2\\pi')}).`],
      meta: { kind: 'arg', r, theta: g.val, k, reV: k * g.reV, imV: k * g.imV, canonical: [`${r}`, `${g.val}`] },
    };
  },
});

export const complexeEquation = defineGenerator({
  id: 'exp-complexe-equation',
  subject: 'expertes',
  skill: 'exp-complexes',
  title: 'Équation du second degré dans ℂ',
  formats: ['input'],
  difficulties: ['medium', 'hard'],
  targetSec: 180,
  build(rng, d) {
    // z^2 + b z + c = 0 with Δ < 0 ; roots (-b ± i sqrt(-Δ))/2
    let b: number, c: number;
    do {
      b = rng.int(-8, 8);
      c = rng.int(1, 30);
    } while (b * b - 4 * c >= 0 || (d === 'medium' && !Number.isInteger(Math.sqrt(4 * c - b * b))));
    const delta = b * b - 4 * c;
    const re = -b / 2;
    const im = Math.sqrt(-delta) / 2;
    const sq = Math.sqrt(-delta);
    const imTex = Number.isInteger(sq) ? fr(frac(sq, 2)) : `\\frac{\\sqrt{${-delta}}}{2}`;
    return {
      prompt: `Résous dans ${m('\\mathbb{C}')} l'équation ${m(`z^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}z + ${c} = 0`)}. Donne la solution de partie imaginaire positive sous la forme ${m('x + iy')} (tu peux écrire sqrt(…)).`.replace(' + 0z', ''),
      answer: {
        kind: 'fields',
        fields: [
          { label: '$x$', kind: 'number', value: re, tolerance: 1e-6 },
          { label: '$y$', kind: 'number', value: im, tolerance: 1e-6 },
        ],
      },
      answerDisplay: m(`z = ${fr(frac(-b, 2))} + ${imTex}\\,i`),
      hints: ['Calcule $\\Delta = b^2 - 4ac$ : s’il est négatif, les solutions sont $\\frac{-b \\pm i\\sqrt{-\\Delta}}{2a}$.', `${m(`\\Delta = ${paren(b)}^2 - 4 \\times ${c} = ${delta}`)}.`],
      solution: [`${m(`\\Delta = ${delta} < 0`)}.`, `${m(`z = \\frac{${-b} \\pm i\\sqrt{${-delta}}}{2}`)}.`, `Partie imaginaire positive : ${m(`z = ${fr(frac(-b, 2))} + ${imTex}\\,i`)}.`],
      meta: { b, c, re, im },
    };
  },
});

export const EXPERTES_GENERATORS = [matriceProduit, matriceInverse, grapheChemins, markov, pgcdGen, bezoutGen, congruenceGen, complexeCalcul, complexeModuleArg, complexeEquation];
