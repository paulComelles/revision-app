/** Glue between generators, chapters and the planner. */
import { GENERATORS, getGenerator } from './generators';
import type { Generator } from './generators/types';
import { SAT_SKILL_BY_ID, SAT_WEAKNESS_WEIGHT } from './generators/sat/skills';
import { defaultChapters } from './db/seed';
import type { PlannerGenerator } from './lib/planner';
import type { Chapter, SubjectId } from './types';

const DEFAULT_TITLES = new Map(defaultChapters().map((c) => [c.id, c.title]));

/** Extra (non-chapter) skills used by generators. */
export const EXTRA_SKILLS: Record<string, { title: string; subject: SubjectId }> = {
  'ses-calc': { title: 'Calculs EC2 (savoir-faire)', subject: 'ses' },
};

export function skillTitle(skill: string, chapters?: Chapter[]): string {
  return (
    SAT_SKILL_BY_ID[skill]?.title ??
    EXTRA_SKILLS[skill]?.title ??
    chapters?.find((c) => c.id === skill)?.title ??
    DEFAULT_TITLES.get(skill) ??
    skill
  );
}

/** chapter id a generator belongs to (bac maths), undefined for SAT */
export function chapterOf(g: Generator): string | undefined {
  return g.subject === 'maths' || g.subject === 'expertes' ? g.skill : undefined;
}

export function isGeneratorActive(g: Generator, chapters: Chapter[]): boolean {
  if (g.subject === 'maths' || g.subject === 'expertes') {
    const ch = chapters.find((c) => c.id === g.skill);
    return !!ch && ch.status !== 'todo';
  }
  return true;
}

export function plannerGenerators(chapters: Chapter[]): PlannerGenerator[] {
  return GENERATORS.filter((g) => isGeneratorActive(g, chapters)).map((g) => ({
    id: g.id,
    subject: g.subject,
    skill: g.skill,
    formats: g.formats,
    difficulties: g.difficulties,
    targetSec: g.targetSec,
    weight: g.subject === 'sat' ? SAT_WEAKNESS_WEIGHT[g.skill] ?? 1 : 1,
    title: g.title,
    skillTitle: skillTitle(g.skill, chapters),
  }));
}

export function generatorContext(generatorId: string, chapters?: Chapter[]) {
  const g = getGenerator(generatorId);
  if (!g) return undefined;
  return { g, subject: g.subject, skill: g.skill, chapterId: chapterOf(g), title: g.title, skillTitle: skillTitle(g.skill, chapters) };
}
