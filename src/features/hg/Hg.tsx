import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { gradeItem } from '../../db/repo';
import type { HgEventContent } from '../../content/types';
import { createRng, randomSeed } from '../../lib/rng';
import { Md } from '../../components/Md';
import { Banner, Button, Card, Chip, Empty, inputCls, PageTitle } from '../../components/ui';
import type { ReviewProps } from '../review/registry';
import { DrillPicker } from '../philo/Philo';

const yearOf = (e: HgEventContent) => Math.trunc(e.sortKey);


function useEvents(chapterId: string) {
  return (useLiveQuery(() => db.content.where('type').equals('hg_event').toArray(), []) ?? []).filter(
    (e): e is HgEventContent => e.type === 'hg_event' && (chapterId === 'all' || e.chapterId === chapterId),
  );
}

function pickEvents(all: HgEventContent[], seed: number, n: number) {
  const rng = createRng(seed);
  // prefer distinct dates
  const byKey = new Map<number, HgEventContent>();
  for (const e of rng.shuffle(all)) if (!byKey.has(e.sortKey)) byKey.set(e.sortKey, e);
  return rng.shuffle([...byKey.values()]).slice(0, n);
}

export function OrderGame({ events, onDone }: { events: HgEventContent[]; onDone: (mistakes: number) => void }) {
  const [picked, setPicked] = useState<HgEventContent[]>([]);
  const [checked, setChecked] = useState(false);
  const sorted = [...events].sort((a, b) => a.sortKey - b.sortKey);
  const mistakes = picked.filter((e, i) => e.sortKey !== sorted[i].sortKey).length;
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500">Touche les événements du plus ancien au plus récent.</p>
      <ol className="space-y-1.5">
        {picked.map((e, i) => (
          <li key={e.id} className={`rounded-lg border p-2 text-sm ${checked ? (e.sortKey === sorted[i].sortKey ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30') : 'border-blue-400'}`}>
            <span className="mr-2 text-xs font-semibold text-slate-500">{checked ? e.date : `${i + 1}.`}</span>
            {e.label}
          </li>
        ))}
      </ol>
      {!checked &&
        events
          .filter((e) => !picked.includes(e))
          .map((e) => (
            <button key={e.id} type="button" className="block w-full rounded-lg border border-slate-300 p-2 text-left text-sm dark:border-slate-700" onClick={() => setPicked((p) => [...p, e])}>
              {e.label}
            </button>
          ))}
      <div className="flex gap-2">
        {!checked ? (
          <>
            <Button disabled={picked.length !== events.length} onClick={() => setChecked(true)}>
              Vérifier
            </Button>
            <Button variant="ghost" disabled={!picked.length} onClick={() => setPicked((p) => p.slice(0, -1))}>
              ↶ Annuler
            </Button>
          </>
        ) : (
          <>
            <Banner tone={mistakes ? 'error' : 'ok'}>{mistakes ? `${mistakes} erreur(s). Ordre correct : ${sorted.map((e) => `${e.date} ${e.label}`).join(' → ')}` : 'Ordre correct ✓'}</Banner>
            <Button onClick={() => onDone(mistakes)}>Continuer</Button>
          </>
        )}
      </div>
    </div>
  );
}

function Timeline({ events }: { events: HgEventContent[] }) {
  const sorted = [...events].sort((a, b) => a.sortKey - b.sortKey);
  const min = sorted[0].sortKey;
  const max = sorted[sorted.length - 1].sortKey;
  const span = max - min || 1;
  const W = 340;
  const x = (k: number) => 20 + ((k - min) / span) * (W - 40);
  return (
    <svg viewBox={`0 0 ${W} ${40 + sorted.length * 22}`} className="w-full text-slate-700 dark:text-slate-200">
      <line x1={20} y1={20} x2={W - 20} y2={20} stroke="currentColor" strokeWidth={2} />
      {sorted.map((e, i) => (
        <g key={e.id}>
          <circle cx={x(e.sortKey)} cy={20} r={4} fill="#3987e5" />
          <line x1={x(e.sortKey)} y1={20} x2={x(e.sortKey)} y2={34 + i * 22} stroke="currentColor" strokeOpacity={0.3} />
          <text x={Math.min(x(e.sortKey), W - 150)} y={40 + i * 22} fontSize={10.5} fill="currentColor">
            {e.date} — {e.label.slice(0, 32)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PlaceGame({ events, onDone }: { events: HgEventContent[]; onDone: (mistakes: number) => void }) {
  const [years, setYears] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const ok = (e: HgEventContent) => Number((years[e.id] ?? '').trim()) === yearOf(e);
  const mistakes = events.filter((e) => !ok(e)).length;
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500">Donne l’année de chaque événement (année négative = avant J.-C.).</p>
      {events.map((e) => (
        <div key={e.id} className="flex items-center gap-2 text-sm">
          <span className="flex-1">{e.label}</span>
          <input className={`${inputCls} w-24`} inputMode="numeric" value={years[e.id] ?? ''} disabled={checked} onChange={(x) => setYears((y) => ({ ...y, [e.id]: x.target.value }))} />
          {checked && <span className={ok(e) ? 'text-emerald-600' : 'text-red-500'}>{ok(e) ? '✓' : e.date}</span>}
        </div>
      ))}
      {checked && <Timeline events={events} />}
      {!checked ? (
        <Button onClick={() => setChecked(true)}>Vérifier</Button>
      ) : (
        <Button onClick={() => onDone(mistakes)}>Continuer</Button>
      )}
    </div>
  );
}

export function ChronoPage() {
  const chapters = useLiveQuery(() => db.chapters.where('subject').equals('hg').sortBy('order'), []) ?? [];
  const [chapterId, setChapterId] = useState('all');
  const [mode, setMode] = useState<'order' | 'place'>('order');
  const [seed, setSeed] = useState(randomSeed);
  const [score, setScore] = useState({ rounds: 0, perfect: 0 });
  const all = useEvents(chapterId);
  const events = useMemo(() => pickEvents(all, seed, 5), [all, seed]);
  return (
    <div className="space-y-4">
      <PageTitle sub={`${score.perfect}/${score.rounds} manches sans faute`}>Chronologie</PageTitle>
      <select className={inputCls} value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
        <option value="all">Tous les chapitres</option>
        {chapters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <div className="flex gap-1.5">
        <Chip active={mode === 'order'} onClick={() => setMode('order')}>
          Remettre dans l’ordre
        </Chip>
        <Chip active={mode === 'place'} onClick={() => setMode('place')}>
          Placer sur la frise
        </Chip>
      </div>
      {events.length < 3 ? (
        <Empty>
          Il faut au moins 3 événements (dates différentes). Importe-les (section <code>evenements_hg</code>) dans <Link to="/import" className="underline">Importer</Link>.
        </Empty>
      ) : (
        <Card>
          {mode === 'order' ? (
            <OrderGame
              key={`${seed}-o`}
              events={events}
              onDone={(m) => {
                setScore((s) => ({ rounds: s.rounds + 1, perfect: s.perfect + (m ? 0 : 1) }));
                setSeed(randomSeed());
              }}
            />
          ) : (
            <PlaceGame
              key={`${seed}-p`}
              events={events}
              onDone={(m) => {
                setScore((s) => ({ rounds: s.rounds + 1, perfect: s.perfect + (m ? 0 : 1) }));
                setSeed(randomSeed());
              }}
            />
          )}
        </Card>
      )}
    </div>
  );
}

export function HgChronoReview({ item, onDone }: ReviewProps) {
  const all = useEvents(item.refId);
  const [seed] = useState(randomSeed);
  const events = useMemo(() => pickEvents(all, seed, 5), [all, seed]);
  if (events.length < 2) return <p className="text-sm">Pas assez d’événements.</p>;
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{item.title}</div>
      <OrderGame
        events={events}
        onDone={async (m) => {
          const g = m === 0 ? 3 : m <= 2 ? 2 : 1;
          await gradeItem(item.id, g);
          onDone(m === 0);
        }}
      />
    </div>
  );
}

const PLAN_FIELDS = [
  { key: 'intro', label: 'Introduction : bornes, définitions, problématique', rows: 3 },
  { key: 'p1', label: 'I.', placeholder: 'Titre de partie + sous-parties (A, B…) + exemples/dates', rows: 3 },
  { key: 'p2', label: 'II.', rows: 3 },
  { key: 'p3', label: 'III.', rows: 3 },
];

const PLAN_CHECK = [
  'L’introduction pose les bornes chronologiques / spatiales et définit les termes.',
  'La problématique est une question à laquelle le plan répond.',
  'Les parties ont des titres qui répondent au sujet (pas de catalogue).',
  'Chaque partie mobilise des dates, acteurs ou exemples précis de ton cours.',
  'Le plan suit une logique (chronologique ou thématique) annoncée.',
];

export function HgPlanPage() {
  return <DrillPicker kind="plan" subject="hg" title="Plan (HG)" sub="Sujet tiré au hasard dans tes imports → intro + plan détaillé" fields={PLAN_FIELDS} checklist={PLAN_CHECK} minutesOptions={[10, 15, 20]} />;
}

export function HgHome() {
  const counts = useLiveQuery(async () => {
    const c = await db.content.where('subject').equals('hg').toArray();
    return { events: c.filter((x) => x.type === 'hg_event').length, cards: c.filter((x) => x.type === 'card').length, sujets: c.filter((x) => x.type === 'sujet').length };
  }, []);
  const tools = [
    { to: '/hg/chrono', icon: '🕰️', label: 'Chronologie', desc: `Remettre dans l’ordre, placer sur la frise · ${counts?.events ?? 0} événements` },
    { to: '/cartes/hg', icon: '🃏', label: 'Cartes notions', desc: `${counts?.cards ?? 0} cartes` },
    { to: '/hg/plan', icon: '🗺️', label: 'Plan', desc: `Construire un plan · ${counts?.sujets ?? 0} sujets` },
    { to: '/blurting?subject=hg', icon: '🧠', label: 'Blurting', desc: 'Tout écrire de mémoire puis comparer' },
  ];
  return (
    <div className="space-y-4">
      <PageTitle sub="Contrôle continu — priorité basse par défaut (réglable)">Histoire-Géographie</PageTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {tools.map((t) => (
          <Link key={t.to} to={t.to} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xl" aria-hidden>
              {t.icon}
            </span>
            <span>
              <span className="block font-medium">{t.label}</span>
              <span className="block text-xs text-slate-500">{t.desc}</span>
            </span>
          </Link>
        ))}
      </div>
      <Md text="Tout le contenu (événements, notions, sujets) vient de tes imports." className="text-xs text-slate-500" />
    </div>
  );
}
