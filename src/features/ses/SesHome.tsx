import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { SES_GENERATORS } from '../../generators/ses';
import { retrievability } from '../../lib/srs';
import { masteryColor } from '../../lib/mastery';
import { useSettings } from '../../hooks';
import { randomSeed } from '../../lib/rng';
import type { ChapterStatus } from '../../types';
import { Badge, Banner, Button, Card, PageTitle, Toggle } from '../../components/ui';
import { ExerciseRunner } from '../review/ExerciseRunner';

const STATUS: Record<ChapterStatus, string> = { todo: 'pas commencé', current: 'en cours', done: 'vu' };

export function SesHome() {
  const settings = useSettings();
  const data = useLiveQuery(async () => {
    const [chapters, content, srs] = await Promise.all([db.chapters.where('subject').equals('ses').sortBy('order'), db.content.where('subject').equals('ses').toArray(), db.srs.where('subject').equals('ses').toArray()]);
    return { chapters, content, srs };
  }, []);
  const dark = document.documentElement.classList.contains('dark');
  const tools = [
    { to: '/ses/ec1', icon: '🧱', label: 'Plans EC1', desc: 'Reconstruire, compléter, apparier arguments et sujets' },
    { to: '/ses/ec2', icon: '🧮', label: 'Calculs EC2', desc: 'Taux, CM, indices, parts, points, TVAM, phrases' },
    { to: '/ses/rdd', icon: '🗂️', label: 'RDD', desc: 'Brouillon chronométré et plan en 3 paragraphes' },
    { to: '/blurting?subject=ses', icon: '🧠', label: 'Blurting', desc: 'Tout écrire de mémoire puis comparer' },
    { to: '/cartes/ses', icon: '🃏', label: 'Cartes', desc: 'Tes cartes de SES' },
  ];
  const onBac = data?.chapters.filter((c) => c.onBac).length ?? 0;
  return (
    <div className="space-y-4">
      <PageTitle sub={settings.dayPreference.ses === 'weekend' ? 'Matière « week-end » dans la session du jour' : undefined}>SES</PageTitle>
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
      <Card title="Suivi des 12 chapitres">
        <Banner tone={onBac === 9 ? 'ok' : 'warn'}>{onBac}/9 chapitres cochés « au bac » (à vérifier dans la note de service officielle).</Banner>
        <ul className="mt-3 space-y-2">
          {data?.chapters.map((c, i) => {
            const items = data.srs.filter((s) => s.chapterId === c.id && s.srs.reps > 0);
            const m = items.length ? items.reduce((s, it) => s + retrievability(it.srs, Date.now(), settings), 0) / items.length : undefined;
            const plans = data.content.filter((x) => x.type === 'ses_plan' && x.chapterId === c.id).length;
            const cards = data.content.filter((x) => x.type === 'card' && x.chapterId === c.id).length;
            const checks = data.content.filter((x) => x.type === 'checklist' && x.chapterId === c.id).length;
            return (
              <li key={c.id} className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: masteryColor(m, dark) }} title={m === undefined ? 'pas encore révisé' : `${Math.round(m * 100)} %`} />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="mr-1 text-xs text-slate-500">{i + 1}.</span>
                    {c.title}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-5 text-xs">
                  <Toggle checked={!!c.onBac} onChange={(v) => db.chapters.update(c.id, { onBac: v })} label="au bac" />
                  <select
                    className="rounded border border-slate-300 bg-transparent px-1 py-0.5 dark:border-slate-700"
                    value={c.status}
                    onChange={(e) => db.chapters.update(c.id, { status: e.target.value as ChapterStatus })}
                  >
                    {(Object.keys(STATUS) as ChapterStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS[s]}
                      </option>
                    ))}
                  </select>
                  <Badge>{plans} plan(s)</Badge>
                  <Badge>{cards} carte(s)</Badge>
                  <Badge>{checks} liste(s)</Badge>
                  {!c.verified && <span className="text-amber-600">à vérifier</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

/** Mixed practice over several generators. */
export function MixedPractice({ generatorIds, title, sub }: { generatorIds: string[]; title: string; sub?: string }) {
  const [state, setState] = useState(() => ({ seed: randomSeed(), id: generatorIds[Math.floor(Math.random() * generatorIds.length)] }));
  const [count, setCount] = useState({ done: 0, ok: 0 });
  const g = SES_GENERATORS.find((x) => x.id === state.id);
  const next = () => setState({ seed: randomSeed(), id: generatorIds[Math.floor(Math.random() * generatorIds.length)] });
  return (
    <div className="space-y-3">
      <PageTitle sub={`${sub ?? ''} · ${count.ok}/${count.done} réussis`}>{title}</PageTitle>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {generatorIds.map((id) => (
          <Link key={id} to={`/pratique/${id}`} className="rounded-full border border-slate-300 px-2 py-0.5 dark:border-slate-700">
            {SES_GENERATORS.find((x) => x.id === id)?.title}
          </Link>
        ))}
      </div>
      <Card>
        {g && (
          <ExerciseRunner
            key={`${state.id}-${state.seed}`}
            spec={{ generatorId: g.id, seed: state.seed, difficulty: (['easy', 'medium', 'hard'] as const)[state.seed % 3], format: g.formats.includes('input') ? 'input' : g.formats[0] }}
            source="practice"
            onDone={(o) => {
              setCount((c) => ({ done: c.done + 1, ok: c.ok + (o.correct ? 1 : 0) }));
              next();
            }}
          />
        )}
      </Card>
      <Button variant="ghost" size="sm" onClick={next}>
        Passer
      </Button>
    </div>
  );
}

export function SesCalcPage() {
  return <MixedPractice generatorIds={SES_GENERATORS.map((g) => g.id)} title="Calculs EC2" sub="Données fictives, correction automatique" />;
}
