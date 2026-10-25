/** Persistence operations (all IndexedDB writes go through here). */
import { db } from './db';
import { defaultChapters, defaultSettings } from './seed';
import { newSrsState, review, type Grade4 } from '../lib/srs';
import type { Attempt, ErrorType, Mistake, Settings, SrsItem, SrsKind, SubjectId } from '../types';
import type { Question } from '../generators/types';

let seeded: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seeded) {
    seeded = db.transaction('rw', db.settings, db.chapters, async () => {
      if (!(await db.settings.get('settings'))) await db.settings.put(defaultSettings());
      if ((await db.chapters.count()) === 0) await db.chapters.bulkPut(defaultChapters());
    });
  }
  return seeded;
}

export async function getSettings(): Promise<Settings> {
  return { ...defaultSettings(), ...((await db.settings.get('settings')) ?? {}) };
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings();
  await db.settings.put({ ...cur, ...patch, id: 'settings' });
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Create the SRS item if missing (idempotent). */
export async function ensureSrsItem(
  id: string,
  data: { kind: SrsKind; subject: SubjectId; refId: string; title: string; chapterId?: string },
  now = Date.now(),
): Promise<SrsItem> {
  const existing = await db.srs.get(id);
  if (existing) return existing;
  const srs = newSrsState(now);
  const item: SrsItem = { id, ...data, srs, due: srs.due, createdAt: now };
  await db.srs.put(item);
  return item;
}

export async function gradeItem(id: string, grade: Grade4, now = Date.now()): Promise<void> {
  const settings = await getSettings();
  const item = await db.srs.get(id);
  if (!item) return;
  const next = review(item.srs, grade, now, settings);
  await db.srs.update(id, { srs: next, due: next.due });
  await db.reviewLogs.add({ itemId: id, at: now, rating: grade, subject: item.subject });
}

export const exerciseItemId = (generatorId: string) => `ex:${generatorId}`;
export const mistakeItemId = (mistakeId: string) => `mis:${mistakeId}`;

export interface AttemptContext {
  source: Attempt['source'];
  chapterId?: string;
  skill: string;
  subject: SubjectId;
  generatorTitle: string;
  timed?: boolean;
  /** when reviewing a mistake: its id */
  mistakeId?: string;
}

/**
 * Record an answered generated question: attempt row, SRS update for the
 * generator skill, automatic mistake logging when wrong.
 * Returns the created mistake id (if any).
 */
export async function recordQuestionAttempt(
  q: Question,
  o: { correct: boolean; timeMs: number; hintsUsed: number; sawSolution: boolean; userAnswer: string; errorType?: ErrorType; grade: Grade4 },
  ctx: AttemptContext,
): Promise<string | undefined> {
  const now = Date.now();
  await db.attempts.add({
    at: now,
    subject: ctx.subject,
    chapterId: ctx.chapterId,
    skill: ctx.skill,
    generatorId: q.generatorId,
    seed: q.seed,
    difficulty: q.difficulty,
    format: q.format,
    correct: o.correct,
    timeMs: o.timeMs,
    hintsUsed: o.hintsUsed + (o.sawSolution ? 1 : 0),
    source: ctx.source,
    timed: ctx.timed,
  });
  // the generator itself is a spaced-repetition item ("keep the skill alive")
  if (ctx.source !== 'mock') {
    await ensureSrsItem(exerciseItemId(q.generatorId), {
      kind: 'exercise',
      subject: ctx.subject,
      refId: q.generatorId,
      title: ctx.generatorTitle,
      chapterId: ctx.chapterId,
    });
    await gradeItem(exerciseItemId(q.generatorId), o.grade, now);
  }
  if (ctx.mistakeId) {
    await gradeItem(mistakeItemId(ctx.mistakeId), o.grade, now);
    await updateMistakeStreak(ctx.mistakeId, o.correct && !o.sawSolution);
    return undefined;
  }
  if (!o.correct) {
    return logMistake({
      subject: ctx.subject,
      chapterId: ctx.chapterId,
      skill: ctx.skill,
      origin: 'auto',
      generatorId: q.generatorId,
      seed: q.seed,
      difficulty: q.difficulty,
      format: q.format,
      prompt: q.prompt,
      userAnswer: o.userAnswer,
      correctAnswer: q.answerDisplay,
      errorType: o.errorType ?? 'methode',
      title: ctx.generatorTitle,
    });
  }
  return undefined;
}

export async function logMistake(m: Omit<Mistake, 'id' | 'createdAt' | 'resolved'> & { title: string }): Promise<string> {
  const id = uid('m');
  const { title, ...rest } = m;
  await db.mistakes.put({ ...rest, id, createdAt: Date.now(), resolved: false });
  await ensureSrsItem(mistakeItemId(id), { kind: 'mistake', subject: m.subject, refId: id, title: `Erreur — ${title}`, chapterId: m.chapterId });
  return id;
}

/** A mistake is resolved after two successful reviews in a row. */
export async function updateMistakeStreak(id: string, success: boolean): Promise<void> {
  const m = await db.mistakes.get(id);
  if (!m) return;
  const streak = success ? (m.reviewStreak ?? 0) + 1 : 0;
  await db.mistakes.update(id, { reviewStreak: streak, resolved: streak >= 2 });
}

export async function deleteMistake(id: string): Promise<void> {
  const m = await db.mistakes.get(id);
  if (m?.photoId) await db.photos.delete(m.photoId);
  await db.mistakes.delete(id);
  await db.srs.delete(mistakeItemId(id));
}

export async function logFocus(subject: SubjectId, start: number, end: number, kind: 'focus' | 'session' | 'trajet' | 'mock' | 'drill', label?: string) {
  const minutes = Math.round(((end - start) / 60000) * 10) / 10;
  if (minutes < 0.5) return;
  await db.focus.add({ subject, start, end, minutes, kind, label });
}
