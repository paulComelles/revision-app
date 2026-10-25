/** Chooses the next SAT practice question, weighted towards weak skills. */
import type { Rng } from '../../lib/rng';
import type { SkillStat } from '../../lib/mastery';
import type { Difficulty, Format, Generator } from '../types';
import { SAT_WEAKNESS_WEIGHT } from './skills';

export interface PickOptions {
  skill?: string;
  /** 'spr' = SPR trainer, 'mcq' = MCQ only, 'mixed' */
  format: 'spr' | 'mcq' | 'mixed';
  /** 'auto' adapts to mastery */
  difficulty: Difficulty | 'auto';
  hardShare: number;
}

export interface Pick {
  generatorId: string;
  seed: number;
  difficulty: Difficulty;
  format: Format;
}

export function pickSat(gens: Generator[], stats: Map<string, SkillStat>, rng: Rng, o: PickOptions): Pick {
  let pool = gens.filter((g) => g.subject === 'sat' && (!o.skill || g.skill === o.skill));
  if (o.format === 'spr') pool = pool.filter((g) => g.formats.includes('spr'));
  if (o.format === 'mcq') pool = pool.filter((g) => g.formats.includes('mcq'));
  if (!pool.length) throw new Error('pickSat: empty pool');
  // weight = weakness weight × (1.15 − mastery), mastery from stats per skill (default 0.4)
  const weights = pool.map((g) => (SAT_WEAKNESS_WEIGHT[g.skill] ?? 1) * (1.15 - (stats.get(g.skill)?.mastery ?? 0.4)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  let g = pool[pool.length - 1];
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      g = pool[i];
      break;
    }
  }
  const mastery = stats.get(g.skill)?.mastery ?? 0.4;
  const pHard = o.difficulty === 'auto' ? Math.min(0.9, Math.max(0.15, o.hardShare * (0.4 + mastery))) : o.difficulty === 'hard' ? 1 : 0;
  const difficulty: Difficulty = rng.next() < pHard && g.difficulties.includes('hard') ? 'hard' : 'medium';
  let format: Format;
  if (o.format === 'spr') format = 'spr';
  else if (o.format === 'mcq' || !g.formats.includes('spr')) format = 'mcq';
  else format = rng.next() < 0.35 ? 'spr' : 'mcq';
  return { generatorId: g.id, seed: rng.int(1, 2 ** 31 - 1), difficulty, format };
}
