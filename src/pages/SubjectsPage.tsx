import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useChapters } from '../hooks';
import { GENERATORS } from '../generators';
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from '../types';
import { SUBJECT_TOOLS } from '../tools';
import { Badge, Card, PageTitle } from '../components/ui';
import { groupStats, masteryColor } from '../lib/mastery';
import { EXTRA_SKILLS } from '../catalog';
import { SatHome } from '../features/sat/SatHome';
import { SesHome } from '../features/ses/SesHome';

const STATUS_LABEL = { todo: 'pas commencé', current: 'en cours', done: 'vu' } as const;

export function SubjectsPage() {
  return (
    <div className="space-y-4">
      <PageTitle>Matières</PageTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {SUBJECT_IDS.map((s) => (
          <Link key={s} to={`/matiere/${s}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SUBJECTS[s].color }} />
              <span className="font-semibold">{SUBJECTS[s].label}</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {SUBJECT_TOOLS.filter((t) => t.subject === s)
                .map((t) => t.label)
                .join(' · ') || 'Chapitres, cartes'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SubjectPage() {
  const { subject = 'maths' } = useParams();
  const s = subject as SubjectId;
  const chapters = useChapters(s);
  const stats = useLiveQuery(async () => groupStats(await db.attempts.where('subject').equals(s).toArray(), (a) => a.generatorId, Date.now()), [s]);
  const cardCount = useLiveQuery(() => db.content.where({ type: 'card', subject: s }).count(), [s]) ?? 0;
  const dark = document.documentElement.classList.contains('dark');
  if (!SUBJECTS[s]) return <p>Matière inconnue.</p>;
  if (s === 'sat') return <SatHome />;
  if (s === 'ses') return <SesHome />;
  const tools = SUBJECT_TOOLS.filter((t) => t.subject === s);
  const gens = GENERATORS.filter((g) => g.subject === s);
  const extra = Object.entries(EXTRA_SKILLS).filter(([, v]) => v.subject === s);
  return (
    <div className="space-y-4">
      <PageTitle sub={SUBJECTS[s].lang === 'en' ? 'Section in English' : undefined}>{SUBJECTS[s].label}</PageTitle>
      {tools.length > 0 && (
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
      )}
      <Link to={`/cartes/${s}`} className="block rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        🃏 Cartes de la matière · {cardCount}
      </Link>
      {chapters.map((c) => {
          const cg = gens.filter((g) => g.skill === c.id);
          return (
            <Card key={c.id} className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.title}</span>
                <Badge>{STATUS_LABEL[c.status]}</Badge>
                {!c.verified && <span className="text-xs text-amber-600">à vérifier</span>}
                {c.subject === 'ses' && c.onBac && <Badge>au bac</Badge>}
              </div>
              {cg.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cg.map((g) => (
                    <Link key={g.id} to={`/pratique/${g.id}`} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: masteryColor(stats?.get(g.id)?.mastery, dark) }} />
                      {g.title}
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      {extra.map(([skill, v]) => (
        <Card key={skill} title={v.title} className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {gens
              .filter((g) => g.skill === skill)
              .map((g) => (
                <Link key={g.id} to={`/pratique/${g.id}`} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: masteryColor(stats?.get(g.id)?.mastery, dark) }} />
                  {g.title}
                </Link>
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
