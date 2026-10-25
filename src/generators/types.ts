import type { ErrorType, SubjectId } from '../types';
import type { SprCorrect } from '../lib/spr';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Format = 'mcq' | 'spr' | 'input';

export interface Choice {
  /** Markdown with $TeX$ */
  text: string;
  /** for distractors: the mistake that leads to it */
  errorType?: ErrorType;
}

export type Figure =
  | { kind: 'svg'; svg: string; alt: string }
  | { kind: 'table'; headers: string[]; rows: string[][]; caption?: string };

export type AnswerSpec =
  | { kind: 'mcq'; choices: Choice[]; correct: number }
  | { kind: 'spr'; values: SprCorrect[] }
  /** French numeric answer: accepts 2,5 / 5/2 / ln(3)… within tolerance */
  | { kind: 'number'; value: number; tolerance: number; unit?: string }
  /** expression in one variable, checked at random points */
  | { kind: 'expr'; expected: string; variable: string; domain: [number, number]; mode?: 'equal' | 'antiderivative'; integer?: boolean }
  /** limit: a number or ±infinity */
  | { kind: 'limit'; value: number | 'inf' | '-inf' }
  /** several labelled fields, all must be right */
  | { kind: 'fields'; fields: FieldSpec[]; layout?: 'row' | 'matrix'; cols?: number }
  /** free-form check (several valid answers, e.g. Bézout coefficients) */
  | { kind: 'custom'; fields: { label: string }[]; checker: (inputs: string[]) => boolean };

export type FieldSpec = { label: string } & (
  | { kind: 'number'; value: number; tolerance: number }
  | { kind: 'expr'; expected: string; variable: string; domain: [number, number]; integer?: boolean }
  | { kind: 'mod'; value: number; modulus: number }
);

export interface Question {
  generatorId: string;
  seed: number;
  difficulty: Difficulty;
  format: Format;
  lang: 'fr' | 'en';
  /** Markdown-light with $inline$ and $$display$$ TeX */
  prompt: string;
  figure?: Figure;
  answer: AnswerSpec;
  /** displayed answer (Markdown + TeX), shown only after submit */
  answerDisplay: string;
  /** hint 1 = concept, hint 2 = first step (never the answer) */
  hints: [string, string];
  /** worked solution steps; the last step states the answer */
  solution: string[];
  /** target time in seconds */
  targetSec: number;
  /** raw parameters, used by unit tests to verify the answer independently */
  meta: Record<string, unknown>;
}

export interface Generator {
  id: string;
  subject: SubjectId;
  /** SAT skill id or bac chapter id */
  skill: string;
  title: string;
  formats: Format[];
  difficulties: Difficulty[];
  /** typical time in seconds (planner estimate) */
  targetSec: number;
  generate(seed: number, difficulty: Difficulty, format: Format): Question;
}

export interface GenContext {
  seed: number;
  difficulty: Difficulty;
  format: Format;
}
