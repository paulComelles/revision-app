import { db } from './db';
import { ensureSrsItem } from './repo';
import type { ContentItem } from '../content/types';
import type { Chapter } from '../types';

/** SRS item id for a content item, or null when the item is not reviewed by itself. */
export function srsIdFor(item: ContentItem): { id: string; kind: 'card' | 'checklist' | 'ses-plan' | 'philo-notion' | 'hg-event'; title: string } | null {
  switch (item.type) {
    case 'card':
      return { id: `card:${item.id}`, kind: 'card', title: item.front.slice(0, 80) };
    case 'checklist':
      return { id: `check:${item.id}`, kind: 'checklist', title: `Points clés — ${item.title}` };
    case 'ses_plan':
      return { id: `ec1:${item.id}`, kind: 'ses-plan', title: `EC1 N°${item.numero} — Objectif ${item.objectifNumero}` };
    case 'philo_notion':
      return { id: `philo:${item.chapterId}`, kind: 'philo-notion', title: `Notion — ${item.chapterId}` };
    case 'hg_event':
      return { id: `hgchrono:${item.chapterId ?? 'all'}`, kind: 'hg-event', title: 'Chronologie HG' };
    default:
      return null;
  }
}

export async function applyImport(items: ContentItem[], chapters: Chapter[]): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;
  const chapterTitles = new Map((await db.chapters.toArray()).concat(chapters).map((c) => [c.id, c.title]));
  await db.transaction('rw', db.content, db.chapters, db.srs, async () => {
    if (chapters.length) await db.chapters.bulkPut(chapters);
    for (const it of items) {
      const exists = await db.content.get(it.id);
      if (exists) updated++;
      else added++;
      await db.content.put(it);
      const s = srsIdFor(it);
      if (s) {
        let title = s.title;
        if (it.type === 'philo_notion') title = `Notion — ${chapterTitles.get(it.chapterId) ?? it.chapterId}`;
        if (it.type === 'hg_event') title = `Chronologie — ${it.chapterId ? chapterTitles.get(it.chapterId) ?? '' : 'tous chapitres'}`;
        const chapterId = 'chapterId' in it ? it.chapterId : undefined;
        await ensureSrsItem(s.id, { kind: s.kind, subject: it.subject, refId: it.type === 'philo_notion' || it.type === 'hg_event' ? chapterId ?? 'all' : it.id, title, chapterId });
      }
    }
  });
  return { added, updated };
}

export async function deleteContent(id: string): Promise<void> {
  const it = await db.content.get(id);
  if (!it) return;
  await db.content.delete(id);
  const s = srsIdFor(it);
  if (!s) return;
  // shared items (philo notion / hg chronology) are only removed when nothing else uses them
  if (it.type === 'philo_notion') {
    const others = await db.content.where({ type: 'philo_notion', chapterId: it.chapterId }).count();
    if (others > 0) return;
  }
  if (it.type === 'hg_event') {
    const others = (await db.content.where('type').equals('hg_event').toArray()).filter((x) => 'chapterId' in x && x.chapterId === it.chapterId).length;
    if (others > 0) return;
  }
  await db.srs.delete(s.id);
}
