import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { defaultSettings } from './db/seed';
import type { Chapter, Settings, SubjectId } from './types';

export function useSettings(): Settings {
  const s = useLiveQuery(() => db.settings.get('settings'), []);
  return { ...defaultSettings(), ...(s ?? {}) };
}

export function useChapters(subject?: SubjectId): Chapter[] {
  return (
    useLiveQuery(
      () => (subject ? db.chapters.where('subject').equals(subject).sortBy('order') : db.chapters.orderBy('id').toArray()),
      [subject],
    ) ?? []
  );
}
