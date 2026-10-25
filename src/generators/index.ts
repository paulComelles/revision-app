import type { Generator } from './types';
import { SAT_GENERATORS } from './sat';
import { MATHS_GENERATORS } from './maths';
import { SES_GENERATORS } from './ses';

export const GENERATORS: Generator[] = [...SAT_GENERATORS, ...MATHS_GENERATORS, ...SES_GENERATORS];

const BY_ID = new Map(GENERATORS.map((g) => [g.id, g]));

export function getGenerator(id: string): Generator | undefined {
  return BY_ID.get(id);
}

export function generatorsForSkill(skill: string): Generator[] {
  return GENERATORS.filter((g) => g.skill === skill);
}
