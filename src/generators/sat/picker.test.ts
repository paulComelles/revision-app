import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/rng';
import { pickSat } from './picker';
import { SAT_GENERATORS } from './index';
import type { SkillStat } from '../../lib/mastery';

const st = (key: string, mastery: number): [string, SkillStat] => [key, { key, mastery, attempts: 20, correct: 10, weight: 10, avgTimeMs: 0, lastAt: 0 }];

describe('pickSat', () => {
  it('SPR trainer only gives SPR questions', () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) expect(pickSat(SAT_GENERATORS, new Map(), rng, { format: 'spr', difficulty: 'auto', hardShare: 0.6 }).format).toBe('spr');
  });
  it('favors weak skills', () => {
    const rng = createRng(2);
    const stats = new Map(SAT_GENERATORS.map((g) => st(g.skill, 0.95)));
    stats.set('geo-circles', st('geo-circles', 0.05)[1]);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const p = pickSat(SAT_GENERATORS, stats, rng, { format: 'mixed', difficulty: 'auto', hardShare: 0.6 });
      const skill = SAT_GENERATORS.find((g) => g.id === p.generatorId)!.skill;
      counts[skill] = (counts[skill] ?? 0) + 1;
    }
    const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    expect(max).toBe('geo-circles');
  });
  it('respects a fixed skill and difficulty', () => {
    const rng = createRng(3);
    for (let i = 0; i < 50; i++) {
      const p = pickSat(SAT_GENERATORS, new Map(), rng, { skill: 'alg-systems', format: 'mixed', difficulty: 'hard', hardShare: 0.5 });
      expect(p.generatorId.startsWith('sat-systems')).toBe(true);
      expect(p.difficulty).toBe('hard');
    }
  });
});
