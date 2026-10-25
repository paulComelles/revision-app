import type { Chapter, Settings, SubjectId } from '../types';

/**
 * Chapter scaffold taken from the structure of the official Terminale
 * programmes. Everything here is "à vérifier" (verified: false) and editable in
 * Réglages → Chapitres. No course content is included.
 */
type ChapterSeed = [id: string, title: string, status?: Chapter['status']];

const MATHS: ChapterSeed[] = [
  ['maths-combinatoire', 'Combinatoire et dénombrement'],
  ['maths-suites', 'Suites et récurrence'],
  ['maths-limites', 'Limites de fonctions'],
  ['maths-continuite', 'Continuité et TVI'],
  ['maths-derivation', 'Dérivation et convexité', 'current'],
  ['maths-explog', 'Exponentielle et logarithme'],
  ['maths-trigo', 'Fonctions sinus et cosinus'],
  ['maths-integrales', 'Primitives et intégrales'],
  ['maths-equadiff', 'Équations différentielles'],
  ['maths-espace', 'Géométrie dans l’espace'],
  ['maths-binomiale', 'Loi binomiale'],
  ['maths-va', 'Sommes de variables aléatoires, concentration'],
];

const EXPERTES: ChapterSeed[] = [
  ['exp-matrices', 'Matrices et graphes', 'current'],
  ['exp-markov', 'Chaînes de Markov'],
  ['exp-arithmetique', 'Arithmétique'],
  ['exp-complexes', 'Nombres complexes'],
];

const SES: ChapterSeed[] = [
  ['ses-croissance', 'Quels sont les sources et les défis de la croissance économique ?'],
  ['ses-commerce', 'Quels sont les fondements du commerce international et de l’internationalisation de la production ?'],
  ['ses-chomage', 'Comment lutter contre le chômage ?'],
  ['ses-crises', 'Comment expliquer les crises financières et réguler le système financier ?'],
  ['ses-europe', 'Quelles politiques économiques dans le cadre européen ?'],
  ['ses-structure', 'Comment est structurée la société française actuelle ?'],
  ['ses-ecole', 'Quelle est l’action de l’École sur les destins individuels et sur l’évolution de la société ?'],
  ['ses-mobilite', 'Quels sont les caractéristiques contemporaines et les facteurs de la mobilité sociale ?'],
  ['ses-travail', 'Quelles mutations du travail et de l’emploi ?'],
  ['ses-engagement', 'Comment expliquer l’engagement politique dans les sociétés démocratiques ?'],
  ['ses-justice', 'Quelles inégalités sont compatibles avec les différentes conceptions de la justice sociale ?'],
  ['ses-environnement', 'Quelle action publique pour l’environnement ?'],
];

export const PHILO_NOTIONS: ChapterSeed[] = [
  ['philo-art', 'L’art'],
  ['philo-bonheur', 'Le bonheur'],
  ['philo-conscience', 'La conscience'],
  ['philo-devoir', 'Le devoir'],
  ['philo-etat', 'L’État'],
  ['philo-inconscient', 'L’inconscient'],
  ['philo-justice', 'La justice'],
  ['philo-langage', 'Le langage'],
  ['philo-liberte', 'La liberté'],
  ['philo-nature', 'La nature'],
  ['philo-raison', 'La raison'],
  ['philo-religion', 'La religion'],
  ['philo-science', 'La science'],
  ['philo-technique', 'La technique'],
  ['philo-temps', 'Le temps'],
  ['philo-travail', 'Le travail'],
  ['philo-verite', 'La vérité'],
];

const HG: ChapterSeed[] = [
  ['hg-h1', 'Histoire — Thème 1 : Fragilités des démocraties, totalitarismes et Seconde Guerre mondiale'],
  ['hg-h2', 'Histoire — Thème 2 : La multiplication des acteurs internationaux dans un monde bipolaire'],
  ['hg-h3', 'Histoire — Thème 3 : Les remises en cause économiques, politiques et sociales des années 1970 à 1991'],
  ['hg-h4', 'Histoire — Thème 4 : Le monde, l’Europe et la France depuis les années 1990'],
  ['hg-g1', 'Géographie — Thème 1 : Mers et océans, au cœur de la mondialisation'],
  ['hg-g2', 'Géographie — Thème 2 : Dynamiques territoriales, coopérations et tensions dans la mondialisation'],
  ['hg-g3', 'Géographie — Thème 3 : L’Union européenne dans la mondialisation'],
  ['hg-g4', 'Géographie — Thème conclusif : La France dans la mondialisation'],
];

function build(subject: SubjectId, seeds: ChapterSeed[], extra: Partial<Chapter> = {}): Chapter[] {
  return seeds.map(([id, title, status], i) => ({
    id,
    subject,
    title,
    order: i,
    status: status ?? 'todo',
    verified: false,
    ...extra,
  }));
}

export function defaultChapters(): Chapter[] {
  return [
    ...build('maths', MATHS),
    ...build('expertes', EXPERTES),
    ...build('ses', SES, { onBac: null }),
    // all 17 notions are always "in progress": the whole year is spent on them
    ...build('philo', PHILO_NOTIONS, { status: 'current' }),
    ...build('hg', HG),
  ];
}

export function defaultSettings(): Settings {
  return {
    id: 'settings',
    sessionMinutes: 30,
    dayPreference: { maths: 'any', expertes: 'any', ses: 'weekend', philo: 'weekend', hg: 'weekend', sat: 'any' },
    subjectWeight: { maths: 1.2, expertes: 1.2, ses: 1, philo: 1, hg: 0.4, sat: 1.3 },
    examDates: [],
    theme: 'dark',
    desiredRetention: 0.9,
    maxIntervalDays: 45,
    focusMinutes: 25,
    breakMinutes: 5,
    dailyGoalMinutes: 30,
    satHardShare: 0.6,
  };
}
