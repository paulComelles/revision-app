/**
 * Seeded pseudo-random generator (mulberry32). Every generated question is
 * reproducible from (generatorId, seed, difficulty).
 */
export interface Rng {
  /** float in [0, 1) */
  next(): number;
  /** integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** integer in [min, max] inclusive, never 0 */
  nonZero(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  bool(p?: number): boolean;
  sign(): 1 | -1;
  /** pick k distinct elements */
  sample<T>(arr: readonly T[], k: number): T[];
}

export function hashString(s: string): number {
  // FNV-1a 32 bits
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRng(seed: number | string): Rng {
  let a = (typeof seed === 'string' ? hashString(seed) : seed >>> 0) || 0x9e3779b9;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => {
    if (max < min) throw new Error(`rng.int: empty range [${min}, ${max}]`);
    return min + Math.floor(next() * (max - min + 1));
  };
  const rng: Rng = {
    next,
    int,
    nonZero(min, max) {
      for (let i = 0; i < 1000; i++) {
        const v = int(min, max);
        if (v !== 0) return v;
      }
      throw new Error('rng.nonZero: no non-zero value');
    },
    pick(arr) {
      if (arr.length === 0) throw new Error('rng.pick: empty array');
      return arr[Math.floor(next() * arr.length)];
    },
    shuffle(arr) {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    bool(p = 0.5) {
      return next() < p;
    },
    sign() {
      return next() < 0.5 ? -1 : 1;
    },
    sample(arr, k) {
      return rng.shuffle(arr).slice(0, k);
    },
  };
  return rng;
}

/** A fresh random seed (not reproducible itself, but stored with the question). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
