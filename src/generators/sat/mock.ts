/** Adaptive mock test assembly and (rough) scoring. Pure and seeded. */
import { createRng } from '../../lib/rng';
import type { Difficulty, Format, Generator } from '../types';
import { MOCK_CONFIG } from './mockConfig';
import { SAT_SKILL_BY_ID, type SatDomainId } from './skills';

export interface MockItem {
  generatorId: string;
  seed: number;
  difficulty: Difficulty;
  format: Format;
  domain: SatDomainId;
}

/** Largest-remainder apportionment of n items over shares. */
export function apportion<K extends string>(n: number, shares: Record<K, number>): Record<K, number> {
  const keys = Object.keys(shares) as K[];
  const total = keys.reduce((s, k) => s + shares[k], 0);
  const raw = keys.map((k) => ({ k, x: (n * shares[k]) / total }));
  const out = Object.fromEntries(raw.map((r) => [r.k, Math.floor(r.x)])) as Record<K, number>;
  let left = n - raw.reduce((s, r) => s + Math.floor(r.x), 0);
  for (const r of raw.sort((a, b) => b.x - Math.floor(b.x) - (a.x - Math.floor(a.x)))) {
    if (left <= 0) break;
    out[r.k]++;
    left--;
  }
  return out;
}

export function buildModule(generators: Generator[], seed: number, hardShare: number): MockItem[] {
  const rng = createRng(`mock|${seed}|${hardShare}`);
  const n = MOCK_CONFIG.questionsPerModule;
  const perDomain = apportion(n, MOCK_CONFIG.domainShare);
  const items: Omit<MockItem, 'format'>[] = [];
  for (const domain of Object.keys(perDomain) as SatDomainId[]) {
    const pool = generators.filter((g) => g.subject === 'sat' && SAT_SKILL_BY_ID[g.skill]?.domain === domain);
    // spread over skills first, then generators
    const skills = rng.shuffle([...new Set(pool.map((g) => g.skill))]);
    for (let i = 0; i < perDomain[domain]; i++) {
      const skill = skills[i % skills.length];
      const g = rng.pick(pool.filter((x) => x.skill === skill));
      items.push({ generatorId: g.id, seed: rng.int(1, 2 ** 31 - 1), difficulty: rng.next() < hardShare ? 'hard' : 'medium', domain });
    }
  }
  // formats: exactly round(n * (1 - mcqShare)) SPR among SPR-capable items
  const nSpr = Math.round(n * (1 - MOCK_CONFIG.mcqShare));
  const byId = new Map(generators.map((g) => [g.id, g]));
  const sprCapable = rng.shuffle(items.map((_, i) => i).filter((i) => byId.get(items[i].generatorId)!.formats.includes('spr')));
  const sprSet = new Set(sprCapable.slice(0, nSpr));
  const withFormat: MockItem[] = items.map((it, i) => ({ ...it, format: sprSet.has(i) ? 'spr' : 'mcq' }));
  // SAT orders questions roughly by difficulty
  return rng.shuffle(withFormat).sort((a, b) => (a.difficulty === b.difficulty ? 0 : a.difficulty === 'medium' ? -1 : 1));
}

export function routeModule2(module1Correct: number): 'harder' | 'easier' {
  return module1Correct >= MOCK_CONFIG.harderThreshold ? 'harder' : 'easier';
}

export function estimateBand(totalCorrect: number, route: 'harder' | 'easier'): { low: number; high: number; center: number } {
  const mdl = MOCK_CONFIG.scoreModel[route];
  const center = Math.min(mdl.cap, mdl.base + mdl.perCorrect * totalCorrect);
  const round10 = (x: number) => Math.round(x / 10) * 10;
  const low = Math.max(200, round10(center - MOCK_CONFIG.scoreModel.halfWidth));
  const high = Math.min(800, round10(center + MOCK_CONFIG.scoreModel.halfWidth));
  return { low, high, center: round10(center) };
}
