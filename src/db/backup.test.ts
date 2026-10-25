import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { db } from './db';
import { ensureSeeded, logMistake, recordQuestionAttempt } from './repo';
import { exportBackup, restoreBackup, validateBackup } from './backup';
import { applyImport } from './contentRepo';
import { parseImport } from '../content/import';
import { defaultChapters } from './seed';
import type { Question } from '../generators/types';

const q: Question = {
  generatorId: 'test-gen',
  seed: 1,
  difficulty: 'medium',
  format: 'spr',
  lang: 'en',
  prompt: 'p',
  answer: { kind: 'spr', values: [{ n: 1, d: 1 }] },
  answerDisplay: '1',
  hints: ['a', 'b'],
  solution: ['c'],
  targetSec: 60,
  meta: {},
};

describe('backup round trip', () => {
  it('exports and restores everything, including blobs', async () => {
    await ensureSeeded();
    await recordQuestionAttempt(
      q,
      { correct: false, timeMs: 1000, hintsUsed: 0, sawSolution: false, userAnswer: '2', grade: 1 },
      { source: 'practice', skill: 's', subject: 'sat', generatorTitle: 'T' },
    );
    await logMistake({ subject: 'maths', origin: 'manual', prompt: 'x', errorType: 'calcul', title: 'm' });
    await db.photos.put({ id: 'p1', blob: new Blob(['hello'], { type: 'text/plain' }), createdAt: 1 });
    const imp = parseImport('cartes:\n  - matiere: maths\n    recto: Q\n    verso: R\n', defaultChapters());
    await applyImport(imp.items, imp.chapters);

    const file = JSON.parse(JSON.stringify(await exportBackup()));
    const counts = { attempts: await db.attempts.count(), mistakes: await db.mistakes.count(), srs: await db.srs.count(), content: await db.content.count() };
    expect(counts.mistakes).toBe(2);
    expect(counts.srs).toBe(4); // exercise + 2 mistakes + card

    await Promise.all(db.tables.map((t) => t.clear()));
    expect(await db.attempts.count()).toBe(0);

    const v = validateBackup(file);
    expect(v.ok).toBe(true);
    if (v.ok) await restoreBackup(v.file);
    expect(await db.attempts.count()).toBe(counts.attempts);
    expect(await db.mistakes.count()).toBe(counts.mistakes);
    expect(await db.srs.count()).toBe(counts.srs);
    expect(await db.content.count()).toBe(counts.content);
    const photo = await db.photos.get('p1');
    expect(photo?.blob).toBeInstanceOf(Blob);
    expect(await photo!.blob.text()).toBe('hello');
  });

  it('rejects foreign files', () => {
    expect(validateBackup({ foo: 1 }).ok).toBe(false);
    expect(validateBackup({ app: 'revision-app', version: 1, tables: { nope: [] } }).ok).toBe(false);
  });
});
