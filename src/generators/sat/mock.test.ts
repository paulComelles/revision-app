import { describe, expect, it } from 'vitest';
import { apportion, buildModule, estimateBand, routeModule2 } from './mock';
import { MOCK_CONFIG } from './mockConfig';
import { SAT_GENERATORS } from './index';
import { SAT_SKILL_BY_ID } from './skills';

describe('mock test', () => {
  it('apportions exactly n items', () => {
    expect(Object.values(apportion(22, MOCK_CONFIG.domainShare)).reduce((a, b) => a + b, 0)).toBe(22);
    expect(apportion(22, MOCK_CONFIG.domainShare)).toEqual({ algebra: 8, advanced: 8, psda: 3, geometry: 3 });
  });

  it('builds modules with the configured size, format and domain split', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const mod = buildModule(SAT_GENERATORS, seed, 0.4);
      expect(mod).toHaveLength(MOCK_CONFIG.questionsPerModule);
      const spr = mod.filter((i) => i.format === 'spr').length;
      expect(spr).toBe(Math.round(22 * (1 - MOCK_CONFIG.mcqShare)));
      const dom = (d: string) => mod.filter((i) => SAT_SKILL_BY_ID[SAT_GENERATORS.find((g) => g.id === i.generatorId)!.skill].domain === d).length;
      expect(dom('algebra')).toBe(8);
      expect(dom('geometry')).toBe(3);
      // every question generates and is answerable in its format
      for (const it of mod) {
        const g = SAT_GENERATORS.find((x) => x.id === it.generatorId)!;
        expect(g.formats).toContain(it.format);
        expect(g.generate(it.seed, it.difficulty, it.format).format).toBe(it.format);
      }
    }
  });

  it('module 2 is harder after a strong module 1', () => {
    expect(routeModule2(MOCK_CONFIG.harderThreshold)).toBe('harder');
    expect(routeModule2(MOCK_CONFIG.harderThreshold - 1)).toBe('easier');
    const hard = buildModule(SAT_GENERATORS, 7, MOCK_CONFIG.module2HardShare.harder).filter((i) => i.difficulty === 'hard').length;
    const easy = buildModule(SAT_GENERATORS, 7, MOCK_CONFIG.module2HardShare.easier).filter((i) => i.difficulty === 'hard').length;
    expect(hard).toBeGreaterThan(easy);
  });

  it('score bands are monotonic, bounded and the harder route scores higher', () => {
    let prev = 0;
    for (let c = 0; c <= 44; c++) {
      const b = estimateBand(c, 'harder');
      expect(b.low).toBeGreaterThanOrEqual(200);
      expect(b.high).toBeLessThanOrEqual(800);
      expect(b.center).toBeGreaterThanOrEqual(prev);
      prev = b.center;
      expect(b.center).toBeGreaterThanOrEqual(estimateBand(c, 'easier').center);
    }
  });
});
