/**
 * Proofs by induction, generated from templates, written with Paul's exact
 * structure: Initialisation, Hérédité, En effet, Conclusion.
 */
import { createRng } from '../../lib/rng';
import { defineGenerator } from '../define';
import { m } from '../helpers';

export type RecSection = 'Initialisation' | 'Hérédité' | 'En effet' | 'Conclusion';

export interface RecBlank {
  /** placeholder index used in lines as [[i]] */
  id: number;
  label: string;
  /** expression in n (parser syntax) */
  expected: string;
  /** TeX shown after checking */
  tex: string;
  /** independent truth function (tests) */
  truth: (n: number) => number;
}

export interface RecProof {
  template: string;
  n0: number;
  /** TeX of P(n) */
  statement: string;
  sections: { title: RecSection; lines: string[] }[];
  blanks: RecBlank[];
  /** numeric check of the property for tests: returns true when P(n) holds */
  holds: (n: number) => boolean;
  checklist: string[];
}

export const REC_SECTIONS: RecSection[] = ['Initialisation', 'Hérédité', 'En effet', 'Conclusion'];

const conclusion = (n0: number, p: string) => `${m(`\\mathcal{P}(${n0})`)} est vraie et ${m('\\mathcal{P}')} est héréditaire, donc par récurrence, pour tout entier ${m(`n \\ge ${n0}`)}, ${m(p)}.`;

const CHECKLIST = [
  'Initialisation : j’ai calculé les DEUX membres au premier rang et conclu « P(n₀) est vraie ».',
  'Hérédité : j’ai écrit « Soit n ≥ n₀, supposons P(n) vraie » avec l’énoncé explicite.',
  'Hérédité : j’ai écrit explicitement ce que je veux montrer, P(n + 1).',
  'En effet : j’ai utilisé l’hypothèse de récurrence (et je l’ai signalé).',
  'En effet : chaque égalité/inégalité est justifiée, jusqu’à obtenir exactement P(n + 1).',
  'Conclusion : « par récurrence, pour tout n ≥ n₀ … ».',
];

export function buildProof(seed: number, difficulty: 'easy' | 'medium' | 'hard'): RecProof {
  const rng = createRng(`rec|${seed}|${difficulty}`);
  const pool = difficulty === 'easy' ? ['impairs', 'entiers', 'explicite'] : difficulty === 'medium' ? ['carres', 'geo', 'divisible'] : ['majoree', 'bernoulli', 'divisible', 'carres'];
  const t = rng.pick(pool);
  switch (t) {
    case 'impairs': {
      const P = (k: string) => `\\sum_{k=1}^{${k}} (2k - 1) = ${k === 'n' ? 'n^2' : `(${k})^2`}`;
      return {
        template: t,
        n0: 1,
        statement: P('n'),
        sections: [
          { title: 'Initialisation', lines: [`Pour ${m('n = 1')} : ${m('\\sum_{k=1}^{1}(2k-1) = 1')} et ${m('1^2 = 1')}, donc ${m('\\mathcal{P}(1)')} est vraie.`] },
          { title: 'Hérédité', lines: [`Soit ${m('n \\ge 1')}. Supposons ${m('\\mathcal{P}(n)')} vraie : ${m(P('n'))}.`, `Montrons ${m('\\mathcal{P}(n+1)')} : ${m('\\sum_{k=1}^{n+1}(2k-1) =')} [[1]].`] },
          {
            title: 'En effet',
            lines: [`${m('\\sum_{k=1}^{n+1}(2k-1) = \\sum_{k=1}^{n}(2k-1) +')} [[2]].`, `Par hypothèse de récurrence, ${m('= n^2 + 2n + 1 = (n+1)^2')}.`],
          },
          { title: 'Conclusion', lines: [conclusion(1, P('n'))] },
        ],
        blanks: [
          { id: 1, label: 'Membre de droite de P(n+1)', expected: '(n+1)^2', tex: '(n+1)^2', truth: (n) => (n + 1) ** 2 },
          { id: 2, label: 'Terme ajouté (k = n + 1)', expected: '2n+1', tex: '2(n+1) - 1 = 2n + 1', truth: (n) => 2 * (n + 1) - 1 },
        ],
        holds: (n) => Array.from({ length: n }, (_, i) => 2 * (i + 1) - 1).reduce((a, b) => a + b, 0) === n * n,
        checklist: CHECKLIST,
      };
    }
    case 'entiers': {
      const P = (k: string) => `\\sum_{k=1}^{${k}} k = \\frac{${k}(${k}+1)}{2}`;
      return {
        template: t,
        n0: 1,
        statement: P('n'),
        sections: [
          { title: 'Initialisation', lines: [`Pour ${m('n = 1')} : ${m('\\sum_{k=1}^{1} k = 1')} et ${m('\\frac{1 \\times 2}{2} = 1')}, donc ${m('\\mathcal{P}(1)')} est vraie.`] },
          { title: 'Hérédité', lines: [`Soit ${m('n \\ge 1')}. Supposons ${m('\\mathcal{P}(n)')} vraie : ${m(P('n'))}.`, `Montrons ${m('\\mathcal{P}(n+1)')} : ${m('\\sum_{k=1}^{n+1} k =')} [[1]].`] },
          {
            title: 'En effet',
            lines: [`${m('\\sum_{k=1}^{n+1} k = \\sum_{k=1}^{n} k + (n+1)')}, donc par hypothèse de récurrence ${m('= \\frac{n(n+1)}{2} + (n+1)')}.`, `${m('= (n+1)\\left(\\frac{n}{2} + 1\\right) =')} [[2]].`],
          },
          { title: 'Conclusion', lines: [conclusion(1, P('n'))] },
        ],
        blanks: [
          { id: 1, label: 'Membre de droite de P(n+1)', expected: '(n+1)(n+2)/2', tex: '\\frac{(n+1)(n+2)}{2}', truth: (n) => ((n + 1) * (n + 2)) / 2 },
          { id: 2, label: 'Forme factorisée finale', expected: '(n+1)(n+2)/2', tex: '\\frac{(n+1)(n+2)}{2}', truth: (n) => ((n + 1) * (n + 2)) / 2 },
        ],
        holds: (n) => (n * (n + 1)) / 2 === Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a + b, 0),
        checklist: CHECKLIST,
      };
    }
    case 'explicite': {
      const a = rng.int(1, 5);
      const b = rng.int(-5, 9);
      const formula = `${a === 1 ? '' : a}n^2${b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`}`;
      const P = `u_n = ${formula}`;
      return {
        template: t,
        n0: 0,
        statement: `${P} \\quad \\text{où } u_0 = ${b},\\ u_{n+1} = u_n + ${a === 1 ? '' : a}(2n+1)`,
        sections: [
          { title: 'Initialisation', lines: [`Pour ${m('n = 0')} : ${m(`u_0 = ${b}`)} et ${m(`${a} \\times 0^2 + ${b} = ${b}`)}, donc ${m('\\mathcal{P}(0)')} est vraie.`] },
          { title: 'Hérédité', lines: [`Soit ${m('n \\ge 0')}. Supposons ${m(`\\mathcal{P}(n)`)} vraie : ${m(P)}.`, `Montrons ${m('\\mathcal{P}(n+1)')} : ${m('u_{n+1} =')} [[1]].`] },
          {
            title: 'En effet',
            lines: [`${m(`u_{n+1} = u_n + ${a === 1 ? '' : a}(2n+1)`)}, donc par hypothèse de récurrence ${m(`u_{n+1} = ${formula} + ${a === 1 ? '' : a}(2n+1)`)}.`, `${m('u_{n+1} =')} [[2]] ${m(`= ${a === 1 ? '' : a}(n+1)^2${b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`}`)}.`],
          },
          { title: 'Conclusion', lines: [conclusion(0, P)] },
        ],
        blanks: [
          { id: 1, label: 'Formule au rang n + 1', expected: `${a}*(n+1)^2+(${b})`, tex: `${a === 1 ? '' : a}(n+1)^2${b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`}`, truth: (n) => a * (n + 1) ** 2 + b },
          { id: 2, label: 'Développement', expected: `${a}*n^2+${2 * a}*n+${a}+(${b})`, tex: `${a}n^2 + ${2 * a}n + ${a + b}`, truth: (n) => a * n * n + 2 * a * n + a + b },
        ],
        holds: (n) => {
          let u = b;
          for (let i = 0; i < n; i++) u = u + a * (2 * i + 1);
          return u === a * n * n + b;
        },
        checklist: CHECKLIST,
      };
    }
    case 'carres': {
      const P = (k: string) => `\\sum_{k=1}^{${k}} k^2 = \\frac{${k}(${k}+1)(2${k}+1)}{6}`;
      return {
        template: t,
        n0: 1,
        statement: P('n'),
        sections: [
          { title: 'Initialisation', lines: [`Pour ${m('n = 1')} : ${m('1^2 = 1')} et ${m('\\frac{1 \\times 2 \\times 3}{6} = 1')}, donc ${m('\\mathcal{P}(1)')} est vraie.`] },
          { title: 'Hérédité', lines: [`Soit ${m('n \\ge 1')}. Supposons ${m('\\mathcal{P}(n)')} vraie : ${m(P('n'))}.`, `Montrons ${m('\\mathcal{P}(n+1)')} : ${m('\\sum_{k=1}^{n+1} k^2 =')} [[1]].`] },
          {
            title: 'En effet',
            lines: [
              `Par hypothèse de récurrence, ${m('\\sum_{k=1}^{n+1} k^2 = \\frac{n(n+1)(2n+1)}{6} + (n+1)^2')}.`,
              `${m('= \\frac{(n+1)\\left[n(2n+1) + 6(n+1)\\right]}{6} = \\frac{(n+1)(2n^2 + 7n + 6)}{6}')}.`,
              `Or ${m('2n^2 + 7n + 6 =')} [[2]], d'où le résultat.`,
            ],
          },
          { title: 'Conclusion', lines: [conclusion(1, P('n'))] },
        ],
        blanks: [
          { id: 1, label: 'Membre de droite de P(n+1)', expected: '(n+1)(n+2)(2n+3)/6', tex: '\\frac{(n+1)(n+2)(2n+3)}{6}', truth: (n) => ((n + 1) * (n + 2) * (2 * n + 3)) / 6 },
          { id: 2, label: 'Factorisation de 2n² + 7n + 6', expected: '(n+2)(2n+3)', tex: '(n+2)(2n+3)', truth: (n) => 2 * n * n + 7 * n + 6 },
        ],
        holds: (n) => Array.from({ length: n }, (_, i) => (i + 1) ** 2).reduce((a, b) => a + b, 0) === (n * (n + 1) * (2 * n + 1)) / 6,
        checklist: CHECKLIST,
      };
    }
    case 'geo': {
      const q = rng.int(2, 5);
      const P = (k: string) => `\\sum_{k=0}^{${k}} ${q}^k = \\frac{${q}^{${k}+1} - 1}{${q - 1}}`;
      return {
        template: t,
        n0: 0,
        statement: P('n'),
        sections: [
          { title: 'Initialisation', lines: [`Pour ${m('n = 0')} : ${m(`${q}^0 = 1`)} et ${m(`\\frac{${q} - 1}{${q - 1}} = 1`)}, donc ${m('\\mathcal{P}(0)')} est vraie.`] },
          { title: 'Hérédité', lines: [`Soit ${m('n \\ge 0')}. Supposons ${m('\\mathcal{P}(n)')} vraie : ${m(P('n'))}.`, `Montrons ${m('\\mathcal{P}(n+1)')} : ${m(`\\sum_{k=0}^{n+1} ${q}^k =`)} [[1]].`] },
          {
            title: 'En effet',
            lines: [
              `Par hypothèse de récurrence, ${m(`\\sum_{k=0}^{n+1} ${q}^k = \\frac{${q}^{n+1} - 1}{${q - 1}} + ${q}^{n+1}`)}.`,
              `${m(`= \\frac{${q}^{n+1} - 1 + ${q - 1} \\times ${q}^{n+1}}{${q - 1}} = \\frac{${q} \\times ${q}^{n+1} - 1}{${q - 1}}`)}.`,
              `Or ${m(`${q} \\times ${q}^{n+1} =`)} [[2]], d'où ${m('\\mathcal{P}(n+1)')}.`,
            ],
          },
          { title: 'Conclusion', lines: [conclusion(0, P('n'))] },
        ],
        blanks: [
          { id: 1, label: 'Membre de droite de P(n+1)', expected: `(${q}^(n+2)-1)/${q - 1}`, tex: `\\frac{${q}^{n+2} - 1}{${q - 1}}`, truth: (n) => (q ** (n + 2) - 1) / (q - 1) },
          { id: 2, label: `${q} × ${q}^(n+1) s'écrit…`, expected: `${q}^(n+2)`, tex: `${q}^{n+2}`, truth: (n) => q * q ** (n + 1) },
        ],
        holds: (n) => {
          const Q = BigInt(q);
          let sum = 0n;
          for (let i = 0; i <= n; i++) sum += Q ** BigInt(i);
          return sum * (Q - 1n) === Q ** BigInt(n + 1) - 1n;
        },
        checklist: CHECKLIST,
      };
    }
    case 'divisible': {
      const a = rng.int(3, 9);
      const P = `${a}^n - 1 \\text{ est divisible par } ${a - 1}`;
      return {
        template: t,
        n0: 0,
        statement: P,
        sections: [
          { title: 'Initialisation', lines: [`Pour ${m('n = 0')} : ${m(`${a}^0 - 1 = 0`)}, qui est divisible par ${m(`${a - 1}`)}, donc ${m('\\mathcal{P}(0)')} est vraie.`] },
          {
            title: 'Hérédité',
            lines: [`Soit ${m('n \\ge 0')}. Supposons ${m('\\mathcal{P}(n)')} vraie : il existe un entier ${m('k')} tel que ${m(`${a}^n - 1 = ${a - 1}k`)}.`, `Montrons que ${m(`${a}^{n+1} - 1`)} est divisible par ${m(`${a - 1}`)}.`],
          },
          {
            title: 'En effet',
            lines: [`${m(`${a}^{n+1} - 1 = ${a} \\times ${a}^n - 1 = ${a}(${a}^n - 1) + `)}[[1]].`, `Par hypothèse de récurrence, ${m(`${a}^{n+1} - 1 = ${a} \\times ${a - 1}k + ${a - 1} = ${a - 1}(${a}k + 1)`)}, avec ${m(`${a}k + 1`)} entier.`],
          },
          { title: 'Conclusion', lines: [conclusion(0, P)] },
        ],
        blanks: [{ id: 1, label: 'Reste du calcul', expected: `${a - 1}`, tex: `${a - 1}`, truth: (n) => a ** (n + 1) - 1 - a * (a ** n - 1) }],
        holds: (n) => Number((BigInt(a) ** BigInt(n) - 1n) % BigInt(a - 1)) === 0,
        checklist: CHECKLIST,
      };
    }
    case 'majoree': {
      const qd = rng.pick([2, 3, 4]);
      const l = rng.int(2, 10);
      const r = l - l / qd; // u_{n+1} = u_n / qd + r, fixed point l
      const u0 = l - rng.int(1, 5);
      const P = `u_n < ${l}`;
      return {
        template: t,
        n0: 0,
        statement: `${P} \\quad \\text{où } u_0 = ${u0},\\ u_{n+1} = \\frac{1}{${qd}}u_n + ${Number.isInteger(r) ? r : `\\frac{${r * qd}}{${qd}}`}`,
        sections: [
          { title: 'Initialisation', lines: [`${m(`u_0 = ${u0} < ${l}`)}, donc ${m('\\mathcal{P}(0)')} est vraie.`] },
          { title: 'Hérédité', lines: [`Soit ${m('n \\ge 0')}. Supposons ${m('\\mathcal{P}(n)')} vraie : ${m(P)}.`, `Montrons ${m('\\mathcal{P}(n+1)')} : ${m(`u_{n+1} < ${l}`)}.`] },
          {
            title: 'En effet',
            lines: [`Par hypothèse de récurrence ${m(`u_n < ${l}`)}, donc ${m(`\\frac{1}{${qd}}u_n <`)} [[1]] (on multiplie par ${m(`\\frac{1}{${qd}} > 0`)}).`, `Puis ${m(`u_{n+1} = \\frac{1}{${qd}}u_n + ${Number.isInteger(r) ? r : `\\frac{${r * qd}}{${qd}}`} < \\frac{${l}}{${qd}} + ${Number.isInteger(r) ? r : `\\frac{${r * qd}}{${qd}}`} =`)} [[2]].`],
          },
          { title: 'Conclusion', lines: [conclusion(0, P)] },
        ],
        blanks: [
          { id: 1, label: 'Majorant de u_n / ' + qd, expected: `${l}/${qd}`, tex: `\\frac{${l}}{${qd}}`, truth: () => l / qd },
          { id: 2, label: 'Valeur finale', expected: `${l}`, tex: `${l}`, truth: () => l / qd + r },
        ],
        holds: (n) => {
          let u = u0;
          for (let i = 0; i < n; i++) u = u / qd + r;
          return u < l;
        },
        checklist: CHECKLIST,
      };
    }
    default: {
      // Bernoulli: (1 + a)^n >= 1 + n a for a > 0
      const a = rng.int(1, 4);
      const P = `(1 + ${a})^n \\ge 1 + ${a}n`;
      return {
        template: 'bernoulli',
        n0: 0,
        statement: P,
        sections: [
          { title: 'Initialisation', lines: [`Pour ${m('n = 0')} : ${m(`(1 + ${a})^0 = 1`)} et ${m(`1 + ${a} \\times 0 = 1`)}, donc ${m('\\mathcal{P}(0)')} est vraie.`] },
          { title: 'Hérédité', lines: [`Soit ${m('n \\ge 0')}. Supposons ${m('\\mathcal{P}(n)')} vraie : ${m(P)}.`, `Montrons ${m('\\mathcal{P}(n+1)')} : ${m(`(1 + ${a})^{n+1} \\ge`)} [[1]].`] },
          {
            title: 'En effet',
            lines: [
              `${m(`(1 + ${a})^{n+1} = (1 + ${a})^n \\times ${1 + a}`)} et, par hypothèse de récurrence (en multipliant par ${m(`${1 + a} > 0`)}), ${m(`(1 + ${a})^{n+1} \\ge (1 + ${a}n) \\times ${1 + a}`)}.`,
              `Or ${m(`(1 + ${a}n)(1 + ${a}) =`)} [[2]] ${m(`\\ge 1 + ${a}(n+1)`)} car ${m(`${a * a}n \\ge 0`)}.`,
            ],
          },
          { title: 'Conclusion', lines: [conclusion(0, P)] },
        ],
        blanks: [
          { id: 1, label: 'Membre de droite de P(n+1)', expected: `1+${a}*(n+1)`, tex: `1 + ${a}(n+1)`, truth: (n) => 1 + a * (n + 1) },
          { id: 2, label: 'Développement', expected: `1+${a}*(n+1)+${a * a}*n`, tex: `1 + ${a}(n+1) + ${a * a}n`, truth: (n) => (1 + a * n) * (1 + a) },
        ],
        holds: (n) => (1 + a) ** n >= 1 + n * a,
        checklist: CHECKLIST,
      };
    }
  }
}

/** Lines in proof order (for the reorder mode), blanks shown as "…". */
export function proofLines(p: RecProof): { section: RecSection; text: string }[] {
  return p.sections.flatMap((s) => s.lines.map((text) => ({ section: s.title, text })));
}

/** Fill-in-the-blanks version, usable in sessions like any other generator. */
export const recurrenceBlanks = defineGenerator({
  id: 'maths-recurrence',
  subject: 'maths',
  skill: 'maths-suites',
  title: 'Récurrence (compléter la preuve)',
  formats: ['input'],
  difficulties: ['easy', 'medium', 'hard'],
  targetSec: 240,
  build(rng, d) {
    const p = buildProof(rng.int(1, 2 ** 31 - 1), d);
    const body = p.sections.map((s) => `**${s.title}.** ${s.lines.join(' ').replace(/\[\[(\d+)\]\]/g, '**[$1]**')}`).join('\n\n');
    return {
      prompt: `Montre par récurrence que pour tout entier ${m(`n \\ge ${p.n0}`)} : ${m(p.statement)}.\n\nComplète les trous de la preuve (expressions en ${m('n')}).\n\n${body}`,
      answer: {
        kind: 'fields',
        fields: p.blanks.map((b) => ({ label: `[${b.id}] ${b.label}`, kind: 'expr' as const, expected: b.expected, variable: 'n', domain: [p.n0, p.n0 + 12] as [number, number], integer: true })),
      },
      answerDisplay: p.blanks.map((b) => `[${b.id}] ${m(b.tex)}`).join(' ; '),
      hints: ['Structure : Initialisation, Hérédité (hypothèse + ce qu’on veut montrer), En effet (calcul utilisant l’hypothèse), Conclusion.', 'Le premier trou est souvent l’énoncé au rang $n + 1$ : remplace $n$ par $n + 1$ partout.'],
      solution: [...p.sections.map((s) => `**${s.title}.** ${s.lines.join(' ').replace(/\[\[(\d+)\]\]/g, (_, i) => m(p.blanks.find((b) => b.id === Number(i))!.tex))}`)],
      meta: { template: p.template, n0: p.n0 },
    };
  },
});
