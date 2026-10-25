/**
 * Builds "Aujourd'hui" sessions: due reviews + weakest topic + one timed
 * exercise, weighted by weakness, subject weight and exam proximity, and
 * respecting the weekend preference. Pure and deterministic given a seed.
 */
import type { Difficulty, Format } from '../generators/types';
import type { ExamDate, Settings, SrsItem, SrsKind, SubjectId } from '../types';
import { createRng } from './rng';
import { daysUntil, DAY_MS, isWeekend } from './dates';
import type { SkillStat } from './mastery';

export interface PlannerGenerator {
  id: string;
  subject: SubjectId;
  skill: string;
  formats: Format[];
  difficulties: Difficulty[];
  targetSec: number;
  /** extra weight (SAT weak spots) */
  weight?: number;
  title: string;
  skillTitle: string;
}

export type SessionTask =
  | { kind: 'review'; itemId: string; itemKind: SrsKind; subject: SubjectId; title: string; estMin: number }
  | {
      kind: 'exercise';
      generatorId: string;
      subject: SubjectId;
      difficulty: Difficulty;
      format: Format;
      seed: number;
      title: string;
      estMin: number;
      block: 'weak' | 'quick';
    }
  | {
      kind: 'timed';
      generatorId: string;
      subject: SubjectId;
      difficulty: Difficulty;
      format: Format;
      seed: number;
      title: string;
      estMin: number;
      timeLimitSec: number;
    };

export interface PlanInput {
  now: number;
  minutes: number;
  mode: 'normal' | 'trajet';
  settings: Pick<Settings, 'dayPreference' | 'subjectWeight' | 'examDates' | 'satHardShare'>;
  dueItems: SrsItem[];
  generators: PlannerGenerator[];
  /** mastery per skill */
  skillStats: Map<string, SkillStat>;
  seed: number;
}

export interface Plan {
  tasks: SessionTask[];
  weakSkill?: { skill: string; title: string; subject: SubjectId; mastery: number };
  notes: string[];
  totalMin: number;
}

export const EST_MINUTES: Record<SrsKind, number> = {
  card: 0.5,
  exercise: 3,
  mistake: 3,
  'philo-notion': 4,
  'ses-plan': 6,
  checklist: 5,
  qb: 3,
  'hg-event': 3,
};

/** 1 when no exam is set, up to 2.5 when the exam is very close. */
export function examFactor(subject: SubjectId, examDates: ExamDate[], now: number): number {
  let best = Infinity;
  for (const e of examDates) {
    if (!e.subjects.includes(subject)) continue;
    const d = daysUntil(e.date, now);
    if (d >= 0) best = Math.min(best, d);
  }
  if (!Number.isFinite(best)) return 1;
  return 1 + 1.5 * Math.exp(-best / 45);
}

export function dayFactor(subject: SubjectId, s: PlanInput['settings'], now: number): number {
  if (s.dayPreference[subject] !== 'weekend') return 1;
  return isWeekend(now) ? 1.5 : 0;
}

export function subjectFactor(subject: SubjectId, input: PlanInput): number {
  return (input.settings.subjectWeight[subject] ?? 1) * examFactor(subject, input.settings.examDates, input.now) * dayFactor(subject, input.settings, input.now);
}

function chooseDifficulty(g: PlannerGenerator, mastery: number, hardShare: number, r: number): Difficulty {
  const ds = g.difficulties;
  if (ds.length === 1) return ds[0];
  if (g.subject === 'sat') {
    // weak skill -> more medium; strong skill -> mostly hard
    const pHard = Math.min(0.9, Math.max(0.15, hardShare * (0.4 + mastery)));
    return r < pHard && ds.includes('hard') ? 'hard' : ds.includes('medium') ? 'medium' : ds[0];
  }
  if (mastery < 0.45 && ds.includes('easy')) return 'easy';
  if (mastery > 0.75 && ds.includes('hard')) return 'hard';
  return ds.includes('medium') ? 'medium' : ds[0];
}

function chooseFormat(g: PlannerGenerator, r: number, quick: boolean): Format {
  if (g.formats.length === 1) return g.formats[0];
  // SPR is a weak spot: ~40 % SPR when both are possible (less when quick)
  if (g.formats.includes('spr') && r < (quick ? 0.3 : 0.4)) return 'spr';
  return g.formats.includes('mcq') ? 'mcq' : g.formats[0];
}

export function buildPlan(input: PlanInput): Plan {
  const rng = createRng(input.seed);
  const notes: string[] = [];
  const tasks: SessionTask[] = [];
  const budget = input.minutes;
  let used = 0;

  // ---- 1. due reviews ----
  const reviewShare = input.mode === 'trajet' ? 0.4 : 0.5;
  const reviewBudget = budget * reviewShare;
  const reviewable = input.dueItems.filter((it) => {
    if (it.suspended) return false;
    if (input.mode === 'trajet') {
      // commute: only fast items (cards, quick exercise skills, mistakes from generators)
      return it.kind === 'card' || it.kind === 'exercise';
    }
    return dayFactor(it.subject, input.settings, input.now) > 0;
  });
  const deferred = input.dueItems.length - reviewable.length;
  const scored = reviewable
    .map((it) => {
      const overdue = Math.max(0, (input.now - it.due) / DAY_MS);
      const sf = input.mode === 'trajet' ? input.settings.subjectWeight[it.subject] ?? 1 : subjectFactor(it.subject, input);
      return { it, p: (1 + Math.log1p(overdue)) * (sf || 0.1) + rng.next() * 0.01 };
    })
    .sort((a, b) => b.p - a.p);
  for (const { it } of scored) {
    const est = EST_MINUTES[it.kind];
    if (used + est > reviewBudget + 0.01) continue;
    tasks.push({ kind: 'review', itemId: it.id, itemKind: it.kind, subject: it.subject, title: it.title, estMin: est });
    used += est;
  }
  if (scored.length > tasks.length) notes.push(`${scored.length - tasks.length} révision(s) due(s) reportée(s) faute de temps.`);
  if (deferred > 0 && input.mode === 'normal') notes.push(`${deferred} révision(s) de matières « week-end » attendent samedi.`);

  // ---- 2. weakest topic ----
  const gens = input.generators.filter((g) => dayFactor(g.subject, input.settings, input.now) > 0 || input.mode === 'trajet');
  const quickOnly = input.mode === 'trajet';
  const pool = quickOnly ? gens.filter((g) => g.targetSec <= 120) : gens;
  const skills = new Map<string, PlannerGenerator[]>();
  for (const g of pool) {
    if (!skills.has(g.skill)) skills.set(g.skill, []);
    skills.get(g.skill)!.push(g);
  }
  const skillPriority = [...skills.entries()].map(([skill, list]) => {
    const st = input.skillStats.get(skill);
    const mastery = st?.mastery ?? 0.4;
    const g = list[0];
    const p = (1 - mastery) * (g.weight ?? 1) * subjectFactor(g.subject, input);
    return { skill, list, mastery, p: Math.max(0, p) + rng.next() * 0.02 };
  });
  skillPriority.sort((a, b) => b.p - a.p);

  const timedBudget = input.mode === 'trajet' ? 0 : Math.min(8, Math.max(4, budget * 0.2));
  const weakBudget = budget - used - timedBudget;
  let plan: Plan['weakSkill'];
  if (skillPriority.length && weakBudget > 1) {
    // in trajet mode, cover the 2 weakest skills to keep it varied
    const targets = quickOnly ? skillPriority.slice(0, 2) : skillPriority.slice(0, 1);
    const top = targets[0];
    plan = { skill: top.skill, title: top.list[0].skillTitle, subject: top.list[0].subject, mastery: top.mastery };
    let k = 0;
    let guard = 0;
    while (used < budget - timedBudget - 0.5 && guard++ < 40) {
      const t = targets[k % targets.length];
      const g = t.list[Math.floor(rng.next() * t.list.length)];
      const est = g.targetSec / 60;
      if (used + est > budget - timedBudget + 0.5) break;
      tasks.push({
        kind: 'exercise',
        generatorId: g.id,
        subject: g.subject,
        difficulty: chooseDifficulty(g, t.mastery, input.settings.satHardShare, rng.next()),
        format: chooseFormat(g, rng.next(), quickOnly),
        seed: rng.int(1, 2 ** 31 - 1),
        title: g.title,
        estMin: est,
        block: quickOnly ? 'quick' : 'weak',
      });
      used += est;
      k++;
    }
  }

  // ---- 3. one timed exercise (weighted random among the other weak skills) ----
  if (timedBudget > 0 && skillPriority.length) {
    const others = skillPriority.length > 1 ? skillPriority.slice(1) : skillPriority;
    const total = others.reduce((s, x) => s + x.p + 0.01, 0);
    let r = rng.next() * total;
    let chosen = others[0];
    for (const o of others) {
      r -= o.p + 0.01;
      if (r <= 0) {
        chosen = o;
        break;
      }
    }
    const g = chosen.list[Math.floor(rng.next() * chosen.list.length)];
    tasks.push({
      kind: 'timed',
      generatorId: g.id,
      subject: g.subject,
      difficulty: g.difficulties.includes('hard') ? 'hard' : g.difficulties[g.difficulties.length - 1],
      format: chooseFormat(g, rng.next(), false),
      seed: rng.int(1, 2 ** 31 - 1),
      title: g.title,
      estMin: Math.max(2, g.targetSec / 60),
      timeLimitSec: Math.round(g.targetSec),
    });
    used += Math.max(2, g.targetSec / 60);
  }

  if (tasks.length === 0) notes.push('Rien à faire pour l’instant : importe du contenu ou commence un chapitre.');
  return { tasks, weakSkill: plan, notes, totalMin: Math.round(used) };
}
