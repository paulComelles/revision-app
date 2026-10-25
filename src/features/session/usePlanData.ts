import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { groupStats } from '../../lib/mastery';
import { DAY_MS } from '../../lib/dates';
import { buildPlan, type Plan } from '../../lib/planner';
import { plannerGenerators } from '../../catalog';
import type { Settings } from '../../types';

/** Live data needed by the planner; undefined while loading. */
export function usePlanData() {
  return useLiveQuery(async () => {
    const now = Date.now();
    const [due, attempts, chapters] = await Promise.all([
      db.srs.where('due').belowOrEqual(now).toArray(),
      db.attempts.where('at').above(now - 120 * DAY_MS).toArray(),
      db.chapters.toArray(),
    ]);
    return { due, attempts, chapters, loadedAt: now };
  }, []);
}

export function makePlan(data: NonNullable<ReturnType<typeof usePlanData>>, settings: Settings, minutes: number, mode: 'normal' | 'trajet', seed: number): Plan {
  const now = Date.now();
  return buildPlan({
    now,
    minutes,
    mode,
    settings,
    dueItems: data.due.filter((d) => !d.suspended),
    generators: plannerGenerators(data.chapters),
    skillStats: groupStats(data.attempts, (a) => a.skill, now),
    seed,
  });
}

export const PLAN_KEY = 'revision-current-plan';
