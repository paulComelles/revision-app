import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { CardReview } from '../features/review/ReviewRunner';
import { Button, Card, Chip, Empty, PageTitle } from '../components/ui';
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from '../types';
import { Md } from '../components/Md';

/** Review due cards (optionally for one subject), or browse all of them. */
export function CardsPage() {
  const { subject } = useParams();
  const [filter, setFilter] = useState<SubjectId | 'all'>((subject as SubjectId) ?? 'all');
  const [mode, setMode] = useState<'due' | 'browse'>('due');
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const due = useLiveQuery(
    () =>
      db.srs
        .where('due')
        .belowOrEqual(Date.now())
        .filter((i) => i.kind === 'card' && (filter === 'all' || i.subject === filter))
        .toArray(),
    [filter],
  );
  const cards = useLiveQuery(() => db.content.where('type').equals('card').toArray(), []) ?? [];
  const queue = (due ?? []).filter((d) => !doneIds.includes(d.id));
  const current = queue[0];
  return (
    <div className="space-y-4">
      <PageTitle sub={`${queue.length} carte(s) à réviser`}>Cartes</PageTitle>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          Toutes
        </Chip>
        {SUBJECT_IDS.filter((s) => s !== 'sat').map((s) => (
          <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {SUBJECTS[s].short}
          </Chip>
        ))}
        <span className="mx-1" />
        <Chip active={mode === 'due'} onClick={() => setMode('due')}>
          Réviser
        </Chip>
        <Chip active={mode === 'browse'} onClick={() => setMode('browse')}>
          Parcourir
        </Chip>
      </div>
      {mode === 'due' ? (
        current ? (
          <Card>
            <CardReview key={current.id} item={current} onDone={() => setDoneIds((l) => [...l, current.id])} />
          </Card>
        ) : (
          <Empty>
            Aucune carte due. {cards.length === 0 && 'Importe des cartes depuis la page Importer.'}
            {doneIds.length > 0 && (
              <div className="mt-2">
                <Button size="sm" variant="secondary" onClick={() => setDoneIds([])}>
                  Recharger
                </Button>
              </div>
            )}
          </Empty>
        )
      ) : (
        <div className="space-y-2">
          {cards
            .filter((c) => c.type === 'card' && (filter === 'all' || c.subject === filter))
            .map((c) =>
              c.type === 'card' ? (
                <details key={c.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <summary className="cursor-pointer">
                    <Md text={c.front} className="inline-block align-top [&>p]:m-0" />
                  </summary>
                  <Md text={c.back} className="mt-2 text-sm" />
                </details>
              ) : null,
            )}
        </div>
      )}
    </div>
  );
}
