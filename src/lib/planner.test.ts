import { describe, expect, it } from 'vitest';
import { buildPlan, examFactor, type PlanInput, type PlannerGenerator } from './planner';
import { defaultSettings } from '../db/seed';
import { newSrsState } from './srs';
import type { SrsItem } from '../types';
import type { SkillStat } from './mastery';

const WED = new Date(2026, 9, 28, 18).getTime(); // a Wednesday
const SAT = new Date(2026, 9, 31, 10).getTime(); // a Saturday

const gens: PlannerGenerator[] = [
  { id: 'g-sys', subject: 'sat', skill: 'alg-systems', formats: ['mcq', 'spr'], difficulties: ['medium', 'hard'], targetSec: 90, title: 'Systems', skillTitle: 'Systems' },
  { id: 'g-circ', subject: 'sat', skill: 'geo-circles', formats: ['mcq', 'spr'], difficulties: ['medium', 'hard'], targetSec: 100, title: 'Circles', skillTitle: 'Circles' },
  { id: 'g-der', subject: 'maths', skill: 'maths-derivation', formats: ['input'], difficulties: ['easy', 'medium', 'hard'], targetSec: 180, title: 'Dérivées', skillTitle: 'Dérivation' },
  { id: 'g-ses', subject: 'ses', skill: 'ses-calc', formats: ['input'], difficulties: ['medium'], targetSec: 120, title: 'Taux', skillTitle: 'Calculs SES' },
];

function item(id: string, subject: SrsItem['subject'], kind: SrsItem['kind'], dueOffsetDays: number, now: number): SrsItem {
  const due = now - dueOffsetDays * 86_400_000;
  return { id, kind, subject, refId: id, title: id, srs: { ...newSrsState(due), due }, due, createdAt: 0 };
}

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    now: WED,
    minutes: 30,
    mode: 'normal',
    settings: defaultSettings(),
    dueItems: [],
    generators: gens,
    skillStats: new Map(),
    seed: 1,
    ...over,
  };
}

const stat = (key: string, mastery: number): [string, SkillStat] => [key, { key, mastery, attempts: 10, correct: 5, weight: 5, avgTimeMs: 0, lastAt: 0 }];

describe('planner', () => {
  it('fits the time budget', () => {
    for (const minutes of [15, 30, 45]) {
      const due = Array.from({ length: 40 }, (_, i) => item(`c${i}`, 'maths', 'card', 1, WED));
      const plan = buildPlan(input({ minutes, dueItems: due }));
      const total = plan.tasks.reduce((s, t) => s + t.estMin, 0);
      expect(total).toBeLessThanOrEqual(minutes + 1);
      expect(total).toBeGreaterThan(minutes * 0.6);
    }
  });
  it('includes due reviews, a weak-topic block and one timed exercise', () => {
    const plan = buildPlan(input({ dueItems: [item('a', 'maths', 'card', 2, WED), item('b', 'sat', 'exercise', 1, WED)] }));
    expect(plan.tasks.some((t) => t.kind === 'review')).toBe(true);
    expect(plan.tasks.some((t) => t.kind === 'exercise' && t.block === 'weak')).toBe(true);
    expect(plan.tasks.filter((t) => t.kind === 'timed')).toHaveLength(1);
  });
  it('targets the weakest skill', () => {
    const skillStats = new Map([stat('alg-systems', 0.9), stat('geo-circles', 0.1), stat('maths-derivation', 0.9)]);
    const plan = buildPlan(input({ skillStats }));
    expect(plan.weakSkill?.skill).toBe('geo-circles');
  });
  it('keeps weekend subjects for the weekend', () => {
    const due = [item('p', 'philo', 'philo-notion', 1, WED), item('s', 'ses', 'ses-plan', 1, WED)];
    const skillStats = new Map([stat('ses-calc', 0), stat('alg-systems', 0.9), stat('geo-circles', 0.9), stat('maths-derivation', 0.9)]);
    const weekday = buildPlan(input({ dueItems: due, skillStats }));
    expect(weekday.tasks.some((t) => t.subject === 'philo' || t.subject === 'ses')).toBe(false);
    const due2 = [item('p', 'philo', 'philo-notion', 1, SAT), item('s', 'ses', 'ses-plan', 1, SAT)];
    const weekend = buildPlan(input({ now: SAT, dueItems: due2, skillStats }));
    expect(weekend.tasks.some((t) => t.subject === 'philo')).toBe(true);
    expect(weekend.weakSkill?.skill).toBe('ses-calc');
  });
  it('exam proximity increases the weight', () => {
    const exams = [{ id: 'e', label: 'Bac maths', date: '2026-11-05', subjects: ['maths' as const] }];
    expect(examFactor('maths', exams, WED)).toBeGreaterThan(2);
    expect(examFactor('sat', exams, WED)).toBe(1);
    expect(examFactor('maths', [{ ...exams[0], date: '2027-06-15' }], WED)).toBeLessThan(1.1);
  });
  it('trajet mode is 10 minutes of quick items only', () => {
    const due = [item('c', 'philo', 'card', 1, WED), item('n', 'philo', 'philo-notion', 1, WED)];
    const plan = buildPlan(input({ mode: 'trajet', minutes: 10, dueItems: due }));
    expect(plan.tasks.some((t) => t.kind === 'timed')).toBe(false);
    expect(plan.tasks.some((t) => t.kind === 'review' && t.itemKind === 'philo-notion')).toBe(false);
    for (const t of plan.tasks) if (t.kind === 'exercise') expect(t.estMin).toBeLessThanOrEqual(2);
    expect(plan.tasks.reduce((s, t) => s + t.estMin, 0)).toBeLessThanOrEqual(11);
  });
  it('is deterministic for a seed', () => {
    expect(buildPlan(input({ seed: 42 }))).toEqual(buildPlan(input({ seed: 42 })));
  });
});
