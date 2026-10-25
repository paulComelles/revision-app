import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../../db/db';
import { gradeItem, logFocus } from '../../db/repo';
import type { ChecklistContent } from '../../content/types';
import { gradeFromShare, suggestRecalled } from '../../lib/recall';
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from '../../types';
import { Md } from '../../components/Md';
import { Banner, Button, Card, Chip, Empty, inputCls, PageTitle } from '../../components/ui';
import type { ReviewProps } from '../review/registry';

/** Write everything you remember, then compare with the key-points checklist. */
export function BlurtDrill({ checklist, minutes, onDone }: { checklist: ChecklistContent; minutes: number; onDone: (grade: 1 | 2 | 3 | 4) => void }) {
  const [start] = useState(Date.now);
  const [now, setNow] = useState(Date.now());
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'write' | 'compare'>('write');
  const [ticks, setTicks] = useState<boolean[]>([]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = minutes * 60_000 - (now - start);
  useEffect(() => {
    if (left <= 0 && phase === 'write') {
      setTicks(suggestRecalled(checklist.points, text));
      setPhase('compare');
    }
  }, [left, phase, checklist.points, text]);
  const recalled = ticks.filter(Boolean).length;
  const finish = async () => {
    const share = checklist.points.length ? recalled / checklist.points.length : 0;
    const grade = gradeFromShare(share);
    const end = Date.now();
    await db.blurts.add({
      at: end,
      subject: checklist.subject,
      chapterId: checklist.chapterId ?? '',
      checklistId: checklist.id,
      text,
      recalled: checklist.points.filter((_, i) => ticks[i]),
      total: checklist.points.length,
      selfGrade: grade,
      minutes: Math.round(((end - start) / 60000) * 10) / 10,
    });
    await gradeItem(`check:${checklist.id}`, grade, end);
    await logFocus(checklist.subject, start, end, 'drill', 'Blurting');
    onDone(grade);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{checklist.title}</div>
        {phase === 'write' && (
          <span className={`font-mono text-sm ${left < 30_000 ? 'text-red-500' : ''}`}>
            {Math.floor(Math.max(0, left) / 60000)}:{String(Math.floor((Math.max(0, left) % 60000) / 1000)).padStart(2, '0')}
          </span>
        )}
      </div>
      <textarea
        className={`${inputCls} min-h-56 text-sm`}
        placeholder="Écris TOUT ce dont tu te souviens sur ce chapitre : définitions, mécanismes, exemples, formules…"
        value={text}
        disabled={phase !== 'write'}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      {phase === 'write' ? (
        <Button
          onClick={() => {
            setTicks(suggestRecalled(checklist.points, text));
            setPhase('compare');
          }}
        >
          J’ai fini : comparer
        </Button>
      ) : (
        <>
          <p className="text-sm text-slate-500">Coche les points que tu as vraiment retrouvés (pré-cochés par une recherche de mots-clés : vérifie-les).</p>
          <ul className="space-y-1.5">
            {checklist.points.map((p, i) => (
              <li key={i}>
                <label className={`flex items-start gap-2 rounded-lg border p-2 text-sm ${ticks[i] ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-800'}`}>
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600" checked={!!ticks[i]} onChange={(e) => setTicks((t) => checklist.points.map((_, j) => (j === i ? e.target.checked : !!t[j])))} />
                  <Md text={p} className="[&>p]:m-0" />
                </label>
              </li>
            ))}
          </ul>
          <p className="text-sm font-semibold">
            {recalled}/{checklist.points.length} points retrouvés
          </p>
          <Button onClick={finish}>Enregistrer</Button>
        </>
      )}
    </div>
  );
}

export function BlurtingPage() {
  const [params] = useSearchParams();
  const [subject, setSubject] = useState<SubjectId | 'all'>((params.get('subject') as SubjectId) ?? 'all');
  const [minutes, setMinutes] = useState(5);
  const [active, setActive] = useState<ChecklistContent | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const listsQ = useLiveQuery(() => db.content.where('type').equals('checklist').toArray(), []);
  const lists = useMemo(() => (listsQ ?? []) as ChecklistContent[], [listsQ]);
  const chapters = useLiveQuery(() => db.chapters.toArray(), []) ?? [];
  const history = useLiveQuery(() => db.blurts.orderBy('at').reverse().limit(10).toArray(), []) ?? [];
  const shown = useMemo(() => lists.filter((l) => subject === 'all' || l.subject === subject), [lists, subject]);
  if (active)
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
          ← Listes
        </Button>
        <Card>
          <BlurtDrill
            checklist={active}
            minutes={minutes}
            onDone={(g) => {
              setResult(`${active.title} : ${['', 'à revoir', 'difficile', 'bien', 'très bien'][g]}.`);
              setActive(null);
            }}
          />
        </Card>
      </div>
    );
  return (
    <div className="space-y-4">
      <PageTitle sub="Écris tout ce dont tu te souviens en X minutes, puis compare avec la liste des points clés">Blurting</PageTitle>
      {result && <Banner tone="ok">Enregistré — {result}</Banner>}
      <div className="flex flex-wrap gap-1.5">
        <Chip active={subject === 'all'} onClick={() => setSubject('all')}>
          Tout
        </Chip>
        {SUBJECT_IDS.filter((s) => s !== 'sat').map((s) => (
          <Chip key={s} active={subject === s} onClick={() => setSubject(s)}>
            {SUBJECTS[s].short}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm">Durée :</span>
        {[3, 5, 10, 15].map((m_) => (
          <Chip key={m_} active={minutes === m_} onClick={() => setMinutes(m_)}>
            {m_} min
          </Chip>
        ))}
      </div>
      {shown.length === 0 ? (
        <Empty>
          Aucune liste de points clés. Importe-les (section <code>points_cles</code>) dans <Link to="/import" className="underline">Importer</Link>.
        </Empty>
      ) : (
        <div className="space-y-2">
          {shown.map((l) => (
            <button key={l.id} type="button" onClick={() => setActive(l)} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm font-medium">{l.title}</div>
              <div className="text-xs text-slate-500">
                {SUBJECTS[l.subject].short} · {chapters.find((c) => c.id === l.chapterId)?.title ?? '—'} · {l.points.length} points
              </div>
            </button>
          ))}
        </div>
      )}
      {history.length > 0 && (
        <Card title="Derniers blurtings">
          <ul className="space-y-1 text-sm">
            {history.map((h) => (
              <li key={h.id}>
                {new Date(h.at).toLocaleDateString('fr-FR')} — {lists.find((l) => l.id === h.checklistId)?.title ?? '?'} : {h.recalled.length}/{h.total}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/** SRS review of a checklist: a short (3 min) blurt. */
export function ChecklistReview({ item, onDone }: ReviewProps) {
  const list = useLiveQuery(() => db.content.get(item.refId), [item.refId]);
  if (list === undefined) return null;
  if (!list || list.type !== 'checklist') return <p className="text-sm">Liste supprimée.</p>;
  return <BlurtDrill checklist={list} minutes={3} onDone={(g) => onDone(g >= 3)} />;
}
