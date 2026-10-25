import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../../db/db';
import { gradeItem } from '../../db/repo';
import type { PhiloNotionContent, ReferenceContent, SujetContent } from '../../content/types';
import { useSettings } from '../../hooks';
import { retrievability } from '../../lib/srs';
import { masteryColor } from '../../lib/mastery';
import { randomSeed, createRng } from '../../lib/rng';
import { Md } from '../../components/Md';
import { Badge, Button, Card, Chip, Empty, inputCls, PageTitle } from '../../components/ui';
import { GradeButtons } from '../review/GradeButtons';
import type { ReviewProps } from '../review/registry';
import { SujetDrill, type DrillField } from '../drills/SujetDrill';

function usePhiloData() {
  return useLiveQuery(async () => {
    const [chapters, content, srs] = await Promise.all([
      db.chapters.where('subject').equals('philo').sortBy('order'),
      db.content.where('subject').equals('philo').toArray(),
      db.srs.where('kind').equals('philo-notion').toArray(),
    ]);
    return {
      chapters,
      notions: content.filter((c): c is PhiloNotionContent => c.type === 'philo_notion'),
      refs: content.filter((c): c is ReferenceContent => c.type === 'reference'),
      sujets: content.filter((c): c is SujetContent => c.type === 'sujet'),
      srs,
    };
  }, []);
}

const shortName = (t: string) => t.replace(/^(L’|L'|Le |La |Les )/, '');

export function PhiloHome() {
  const data = usePhiloData();
  const settings = useSettings();
  const nav = useNavigate();
  const dark = document.documentElement.classList.contains('dark');
  if (!data) return null;
  const n = data.chapters.length;
  const W = 380;
  const H = 330;
  const R = 112;
  const pos = data.chapters.map((_, i) => [W / 2 + R * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n), H / 2 + R * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n)] as const);
  const idx = new Map(data.chapters.map((c, i) => [c.id, i]));
  const edges = new Set<string>();
  for (const no of data.notions)
    for (const l of no.liees ?? []) {
      const a = idx.get(no.chapterId);
      const b = idx.get(l);
      if (a !== undefined && b !== undefined && a !== b) edges.add(a < b ? `${a}-${b}` : `${b}-${a}`);
    }
  const mastery = (id: string) => {
    const it = data.srs.find((s) => s.refId === id);
    return it && it.srs.reps > 0 ? retrievability(it.srs, Date.now(), settings) : undefined;
  };
  const tools = [
    { to: '/philo/dissertation', icon: '✍️', label: 'Dissertation (10–15 min)', desc: 'Définitions, problématique, plan en 3 parties' },
    { to: '/philo/explication', icon: '📜', label: 'Explication de texte', desc: 'Thèse, problème, mouvements, enjeu' },
    { to: '/blurting?subject=philo', icon: '🧠', label: 'Blurting', desc: 'Tout écrire de mémoire puis comparer' },
    { to: '/cartes/philo', icon: '🃏', label: 'Cartes', desc: 'Tes cartes de philo' },
  ];
  return (
    <div className="space-y-4">
      <PageTitle sub="Les 17 notions du programme — ton contenu importé, tes références, les liens entre notions">Philosophie</PageTitle>
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
      <Card title="Carte des notions">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-md text-slate-700 dark:text-slate-200" role="img" aria-label="Carte des 17 notions et de leurs liens">
          {[...edges].map((e) => {
            const [a, b] = e.split('-').map(Number);
            return <line key={e} x1={pos[a][0]} y1={pos[a][1]} x2={pos[b][0]} y2={pos[b][1]} stroke="currentColor" strokeOpacity={0.35} strokeWidth={1.4} />;
          })}
          {data.chapters.map((c, i) => {
            const has = data.notions.some((x) => x.chapterId === c.id);
            const [x, y] = pos[i];
            const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
            const lx = W / 2 + (R + 16) * Math.cos(ang);
            const ly = H / 2 + (R + 16) * Math.sin(ang);
            const anchor = Math.abs(Math.cos(ang)) < 0.3 ? 'middle' : Math.cos(ang) > 0 ? 'start' : 'end';
            return (
              <g key={c.id} className="cursor-pointer" onClick={() => nav(`/philo/notion/${c.id}`)}>
                <circle cx={x} cy={y} r={11} fill={masteryColor(mastery(c.id), dark)} stroke="currentColor" strokeOpacity={has ? 0.9 : 0.25} strokeWidth={has ? 2 : 1} strokeDasharray={has ? undefined : '3 2'} />
                <text x={lx} y={ly + (Math.abs(Math.cos(ang)) < 0.3 ? 8 * Math.sign(Math.sin(ang)) : 0)} fontSize={10.5} textAnchor={anchor} dominantBaseline="middle" fill="currentColor">
                  {shortName(c.title)}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-xs text-slate-500">Contour plein = contenu importé ; couleur = probabilité de rappel (FSRS) ; traits = notions liées (champ « liees » de ton import).</p>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.chapters.map((c) => {
          const refs = data.refs.filter((r) => r.chapterIds.includes(c.id)).length;
          const has = data.notions.some((x) => x.chapterId === c.id);
          return (
            <Link key={c.id} to={`/philo/notion/${c.id}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: masteryColor(mastery(c.id), dark) }} />
              <span className="flex-1">{c.title}</span>
              {!has && <span className="text-xs text-slate-400">vide</span>}
              {refs > 0 && <Badge>{refs} réf.</Badge>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function NotionPage() {
  const { id = '' } = useParams();
  const data = usePhiloData();
  const [reviewing, setReviewing] = useState(false);
  if (!data) return null;
  const ch = data.chapters.find((c) => c.id === id);
  if (!ch) return <p>Notion introuvable.</p>;
  const notions = data.notions.filter((x) => x.chapterId === id);
  const refs = data.refs.filter((r) => r.chapterIds.includes(id));
  const linked = new Set<string>();
  for (const no of data.notions) {
    if (no.chapterId === id) (no.liees ?? []).forEach((l) => linked.add(l));
    if ((no.liees ?? []).includes(id)) linked.add(no.chapterId);
  }
  const sujets = data.sujets.filter((s) => s.notions?.includes(id) || s.chapterId === id);
  const item = data.srs.find((s) => s.refId === id);
  return (
    <div className="space-y-4">
      <PageTitle sub={!ch.verified ? 'Intitulé à vérifier' : undefined}>{ch.title}</PageTitle>
      {item && !reviewing && (
        <Button onClick={() => setReviewing(true)}>Réviser cette notion maintenant</Button>
      )}
      {item && reviewing && (
        <Card>
          <NotionRecall chapterTitle={ch.title} notions={notions} refs={refs} onGrade={async (g) => {
            await gradeItem(item.id, g);
            setReviewing(false);
          }} />
        </Card>
      )}
      {notions.length === 0 ? (
        <Empty>
          Pas encore de contenu pour cette notion. Importe ton cours (section <code>notions_philo</code>) dans <Link to="/import" className="underline">Importer</Link>.
        </Empty>
      ) : (
        notions.map((no) => (
          <Card key={no.id}>
            <Md text={no.contenu} />
          </Card>
        ))
      )}
      {linked.size > 0 && (
        <Card title="Notions liées">
          <div className="flex flex-wrap gap-1.5">
            {[...linked].map((l) => (
              <Link key={l} to={`/philo/notion/${l}`} className="rounded-full border border-slate-300 px-3 py-1 text-sm dark:border-slate-700">
                {data.chapters.find((c) => c.id === l)?.title ?? l}
              </Link>
            ))}
          </div>
        </Card>
      )}
      <Card title={`Références · ${refs.length}`}>
        {refs.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune référence importée.</p>
        ) : (
          <ul className="space-y-2">
            {refs.map((r) => (
              <li key={r.id} className="text-sm">
                <span className="font-semibold">{r.auteur}</span>
                {r.oeuvre && <span className="italic">, {r.oeuvre}</span>}
                {r.kind && <Badge className="ml-1">{r.kind}</Badge>}
                <Md text={r.texte} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      {sujets.length > 0 && (
        <Card title="Sujets liés">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {sujets.map((s) => (
              <li key={s.id}>
                <Md text={s.texte} className="[&>p]:m-0" />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/** Recall a notion: write the key ideas and references from memory, then compare. */
function NotionRecall({ chapterTitle, notions, refs, onGrade }: { chapterTitle: string; notions: PhiloNotionContent[]; refs: ReferenceContent[]; onGrade: (g: 1 | 2 | 3 | 4) => void }) {
  const [text, setText] = useState('');
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm">
        <strong>{chapterTitle}</strong> — écris de mémoire : problèmes, distinctions, références (auteurs, œuvres), exemples, liens avec d’autres notions.
      </p>
      <textarea className={`${inputCls} min-h-32 text-sm`} value={text} onChange={(e) => setText(e.target.value)} disabled={shown} />
      {!shown ? (
        <Button onClick={() => setShown(true)}>Comparer avec mon cours</Button>
      ) : (
        <>
          <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800/60">
            {notions.map((n) => (
              <Md key={n.id} text={n.contenu} />
            ))}
            {refs.map((r) => (
              <div key={r.id}>
                <strong>{r.auteur}</strong> — <Md text={r.texte} className="inline [&>p]:inline" />
              </div>
            ))}
            {notions.length === 0 && refs.length === 0 && <p>Aucun contenu importé pour cette notion.</p>}
          </div>
          <GradeButtons onGrade={onGrade} />
        </>
      )}
    </div>
  );
}

export function PhiloNotionReview({ item, onDone }: ReviewProps) {
  const data = usePhiloData();
  if (!data) return null;
  const ch = data.chapters.find((c) => c.id === item.refId);
  return (
    <NotionRecall
      chapterTitle={ch?.title ?? item.title}
      notions={data.notions.filter((x) => x.chapterId === item.refId)}
      refs={data.refs.filter((r) => r.chapterIds.includes(item.refId))}
      onGrade={async (g) => {
        await gradeItem(item.id, g);
        onDone(g >= 3);
      }}
    />
  );
}

const DISSERT_FIELDS: DrillField[] = [
  { key: 'defs', label: 'Définitions des termes du sujet', placeholder: 'Chaque terme important, défini avec précision', rows: 4 },
  { key: 'pb', label: 'Problématique', placeholder: 'La tension / le paradoxe que le sujet soulève, sous forme de question', rows: 3 },
  { key: 'p1', label: 'I.', placeholder: 'Idée directrice + argument + référence', rows: 3 },
  { key: 'p2', label: 'II.', placeholder: 'Idée directrice + argument + référence', rows: 3 },
  { key: 'p3', label: 'III.', placeholder: 'Idée directrice + argument + référence', rows: 3 },
];

const DISSERT_CHECK = [
  'Chaque terme important du sujet est défini (et ses sens possibles distingués).',
  'La problématique fait apparaître une vraie tension (pas une simple reformulation).',
  'Le plan progresse (chaque partie dépasse ou nuance la précédente).',
  'Chaque partie a une idée directrice claire, un argument et une référence ou un exemple.',
  'Le III répond vraiment à la problématique.',
];

const EXPL_FIELDS: DrillField[] = [
  { key: 'theme', label: 'Thème et thèse de l’auteur', rows: 3 },
  { key: 'pb', label: 'Problème auquel répond le texte', rows: 3 },
  { key: 'mvts', label: 'Mouvements du texte (découpage avec lignes / étapes)', rows: 4 },
  { key: 'enjeu', label: 'Enjeu', rows: 2 },
];

const EXPL_CHECK = [
  'La thèse est formulée en une phrase, fidèle au texte.',
  'Le problème est formulé comme une question (avec la position adverse possible).',
  'Le découpage suit la logique de l’argumentation (connecteurs repérés).',
  'Chaque mouvement est résumé par sa fonction (définir, objecter, conclure…).',
  'L’enjeu dit pourquoi la question est importante.',
];

function useSujets(kind: 'dissertation' | 'explication' | 'plan', subject: 'philo' | 'hg') {
  return (useLiveQuery(() => db.content.where('type').equals('sujet').toArray(), []) ?? []).filter((s): s is SujetContent => s.type === 'sujet' && s.kind === kind && s.subject === subject);
}

export function DrillPicker({ kind, subject, title, sub, fields, checklist, minutesOptions }: { kind: 'dissertation' | 'explication' | 'plan'; subject: 'philo' | 'hg'; title: string; sub: string; fields: DrillField[]; checklist: string[]; minutesOptions: number[] }) {
  const sujets = useSujets(kind, subject);
  const [minutes, setMinutes] = useState(minutesOptions[1] ?? minutesOptions[0]);
  const [seed, setSeed] = useState<number | null>(null);
  const sujet = useMemo(() => (seed !== null && sujets.length ? createRng(seed).pick(sujets) : null), [seed, sujets]);
  return (
    <div className="space-y-4">
      <PageTitle sub={sub}>{title}</PageTitle>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm">Durée :</span>
        {minutesOptions.map((m_) => (
          <Chip key={m_} active={minutes === m_} onClick={() => setMinutes(m_)}>
            {m_} min
          </Chip>
        ))}
      </div>
      {sujets.length === 0 ? (
        <Empty>
          Aucun sujet de type « {kind} » importé{subject === 'hg' ? ' en HG' : ''}. Ajoute-les (section <code>sujets</code>) dans <Link to="/import" className="underline">Importer</Link>.
        </Empty>
      ) : sujet ? (
        <Card>
          <SujetDrill key={seed} sujet={sujet} minutes={minutes} fields={fields} checklist={checklist} kind={`${subject}-${kind}`} subject={subject} onDone={() => setSeed(randomSeed())} />
        </Card>
      ) : (
        <Button size="lg" onClick={() => setSeed(randomSeed())}>
          Tirer un sujet au hasard ({sujets.length} disponibles)
        </Button>
      )}
    </div>
  );
}

export function DissertationPage() {
  return <DrillPicker kind="dissertation" subject="philo" title="Dissertation" sub="Sujet tiré au hasard dans ta liste → définitions, problématique, plan en 3 parties" fields={DISSERT_FIELDS} checklist={DISSERT_CHECK} minutesOptions={[10, 15, 20]} />;
}

export function ExplicationPage() {
  return <DrillPicker kind="explication" subject="philo" title="Explication de texte" sub="Structure : thèse, problème, mouvements, enjeu" fields={EXPL_FIELDS} checklist={EXPL_CHECK} minutesOptions={[10, 15, 20]} />;
}
