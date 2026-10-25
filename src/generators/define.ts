import { createRng, type Rng } from '../lib/rng';
import type { SubjectId } from '../types';
import type { Difficulty, Format, Generator, Question } from './types';

export type Built = Omit<Question, 'generatorId' | 'seed' | 'difficulty' | 'format' | 'lang' | 'targetSec'> & { targetSec?: number };

export interface GeneratorDef {
  id: string;
  subject: SubjectId;
  skill: string;
  title: string;
  formats: Format[];
  difficulties: Difficulty[];
  targetSec: number;
  build(rng: Rng, difficulty: Difficulty, format: Format): Built;
}

/** Wrap a builder: seeding, language and metadata are handled here. */
export function defineGenerator(def: GeneratorDef): Generator {
  return {
    id: def.id,
    subject: def.subject,
    skill: def.skill,
    title: def.title,
    formats: def.formats,
    difficulties: def.difficulties,
    targetSec: def.targetSec,
    generate(seed, difficulty, format) {
      const d = def.difficulties.includes(difficulty) ? difficulty : def.difficulties[0];
      const f = def.formats.includes(format) ? format : def.formats[0];
      const rng = createRng(`${def.id}|${seed}|${d}|${f}`);
      const built = def.build(rng, d, f);
      return {
        ...built,
        targetSec: built.targetSec ?? def.targetSec,
        generatorId: def.id,
        seed,
        difficulty: d,
        format: f,
        lang: def.subject === 'sat' ? 'en' : 'fr',
      };
    },
  };
}
