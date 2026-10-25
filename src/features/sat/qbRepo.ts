import { db } from '../../db/db';
import { deleteMistake, gradeItem, logMistake, mistakeItemId, uid, updateMistakeStreak } from '../../db/repo';
import { SAT_SKILL_BY_ID } from '../../generators/sat/skills';
import type { ErrorType, QbEntry, QbResult } from '../../types';

export function qbLabel(e: QbEntry): string {
  return `${e.pdf}${e.number !== undefined ? ` #${e.number}` : ''}${e.questionId ? ` · ID ${e.questionId}` : ''}`;
}

export async function addQbEntries(entries: Omit<QbEntry, 'id' | 'createdAt' | 'history'>[]): Promise<void> {
  const now = Date.now();
  const rows: QbEntry[] = entries.map((e) => ({ ...e, id: uid('qb'), createdAt: now, history: e.result === 'todo' ? [] : [{ at: now, result: e.result }] }));
  await db.qb.bulkPut(rows);
  for (const r of rows) if (r.result === 'wrong') await ensureQbMistake(r, r.errorType ?? 'methode');
}

/** A wrong Question Bank answer becomes a mistake (scheduled for re-attempts). */
async function ensureQbMistake(e: QbEntry, errorType: ErrorType): Promise<void> {
  const existing = await db.mistakes.filter((m) => m.qbId === e.id).first();
  if (existing) {
    await db.mistakes.update(existing.id, { resolved: false, reviewStreak: 0, errorType });
    return;
  }
  await logMistake({
    subject: 'sat',
    skill: e.skill || undefined,
    origin: 'manual',
    prompt: `**College Board Question Bank** — ${qbLabel(e)}\n\nSkill: ${SAT_SKILL_BY_ID[e.skill]?.title ?? 'not set'} · ${e.difficulty}.\n\nRe-attempt this question from your PDF without looking at the answer.${e.note ? `\n\nNote: ${e.note}` : ''}`,
    errorType,
    note: e.note,
    qbId: e.id,
    title: `QB ${qbLabel(e)}`,
  });
}

export async function setQbResult(e: QbEntry, result: QbResult, errorType?: ErrorType): Promise<void> {
  const now = Date.now();
  await db.qb.update(e.id, { result, errorType: result === 'wrong' ? (errorType ?? e.errorType ?? 'methode') : e.errorType, history: [...e.history, { at: now, result }] });
  if (result === 'wrong') await ensureQbMistake({ ...e, result }, errorType ?? e.errorType ?? 'methode');
}

/** Called from a mistake review of a QB question. */
export async function recordQbReattempt(qbId: string, mistakeId: string, correct: boolean): Promise<void> {
  const e = await db.qb.get(qbId);
  const now = Date.now();
  if (e) await db.qb.update(qbId, { result: correct ? 'right' : 'wrong', history: [...e.history, { at: now, result: correct ? 'right' : 'wrong' }] });
  await gradeItem(mistakeItemId(mistakeId), correct ? 3 : 1, now);
  await updateMistakeStreak(mistakeId, correct);
}

export async function deleteQbEntry(id: string): Promise<void> {
  const m = await db.mistakes.filter((x) => x.qbId === id).first();
  if (m) await deleteMistake(m.id);
  await db.qb.delete(id);
}
