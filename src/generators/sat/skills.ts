/** College Board Question Bank taxonomy (SAT Math), so stats match the Question Bank. */

export type SatDomainId = 'algebra' | 'advanced' | 'psda' | 'geometry';

export const SAT_DOMAINS: Record<SatDomainId, string> = {
  algebra: 'Algebra',
  advanced: 'Advanced Math',
  psda: 'Problem-Solving and Data Analysis',
  geometry: 'Geometry and Trigonometry',
};

export interface SatSkill {
  id: string;
  domain: SatDomainId;
  title: string;
}

export const SAT_SKILLS: SatSkill[] = [
  { id: 'alg-linear-one', domain: 'algebra', title: 'Linear equations in one variable' },
  { id: 'alg-linear-functions', domain: 'algebra', title: 'Linear functions' },
  { id: 'alg-linear-two', domain: 'algebra', title: 'Linear equations in two variables' },
  { id: 'alg-systems', domain: 'algebra', title: 'Systems of two linear equations in two variables' },
  { id: 'alg-inequalities', domain: 'algebra', title: 'Linear inequalities in one or two variables' },
  { id: 'adv-nonlinear-functions', domain: 'advanced', title: 'Nonlinear functions' },
  { id: 'adv-nonlinear-equations', domain: 'advanced', title: 'Nonlinear equations in one variable and systems of equations in two variables' },
  { id: 'adv-equivalent', domain: 'advanced', title: 'Equivalent expressions' },
  { id: 'psda-ratios', domain: 'psda', title: 'Ratios, rates, proportional relationships, and units' },
  { id: 'psda-percentages', domain: 'psda', title: 'Percentages' },
  { id: 'psda-one-var', domain: 'psda', title: 'One-variable data: Distributions and measures of center and spread' },
  { id: 'psda-two-var', domain: 'psda', title: 'Two-variable data: Models and scatterplots' },
  { id: 'psda-probability', domain: 'psda', title: 'Probability and conditional probability' },
  { id: 'psda-inference', domain: 'psda', title: 'Inference from sample statistics and margin of error' },
  { id: 'psda-claims', domain: 'psda', title: 'Evaluating statistical claims: Observational studies and experiments' },
  { id: 'geo-area-volume', domain: 'geometry', title: 'Area and volume' },
  { id: 'geo-lines-angles', domain: 'geometry', title: 'Lines, angles, and triangles' },
  { id: 'geo-right-trig', domain: 'geometry', title: 'Right triangles and trigonometry' },
  { id: 'geo-circles', domain: 'geometry', title: 'Circles' },
];

export const SAT_SKILL_BY_ID = Object.fromEntries(SAT_SKILLS.map((s) => [s.id, s])) as Record<string, SatSkill>;

/**
 * Practice weighting from Paul's first SAT (Oct 2026): weak spots get more
 * questions. Editable here; 1 = normal.
 */
export const SAT_WEAKNESS_WEIGHT: Record<string, number> = {
  'alg-systems': 1.8,
  'adv-equivalent': 1.6,
  'adv-nonlinear-functions': 1.5,
  'adv-nonlinear-equations': 1.6,
  'psda-ratios': 1.3,
  'psda-percentages': 1.3,
  'psda-one-var': 1.3,
  'psda-two-var': 1.3,
  'psda-probability': 1.3,
  'psda-inference': 1.3,
  'psda-claims': 1.2,
  'geo-area-volume': 2,
  'geo-lines-angles': 2,
  'geo-right-trig': 2.2,
  'geo-circles': 2.2,
};
