import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { gradeItem } from '../../db/repo';
import type { SesPlanContent } from '../../content/types';
import { createRng, randomSeed } from '../../lib/rng';
import type { Grade4 } from '../../lib/srs';
import { Md } from '../../components/Md';
import { Banner, Button, Card, Chip, Empty, inputCls, PageTitle } from '../../components/ui';
import { GradeButtons } from '../review/GradeButtons';
import type { ReviewProps } from '../review/registry';

export const planTitle = (p: SesPlanContent) => `EC1 N°${p.numero} — Objectif ${p.objectifNumero}`;

/** All the fields of a plan, in the order of Paul's fiche. */
export function planFields(p: SesPlanContent): { key: string; label: string; value: string }[] {
  return [
    { key: 'intro', label: 'Intro (définitions)', value: p.intro },
    ...p.arguments.flatMap((a, i) => [
      { key: `a${i}`, label: `Arg ${i + 1} — A (Affirmation)`, value: a.affirmation },
      { key: `e${i}`, label: `Arg ${i + 1} — E (Explication)`, value: a.explication },
      { key: `i${i}`, label: `Arg ${i + 1} — I (Illustration)`, value: a.illustration },
    ]),
    { key: 'conclusion', label: 'Conclusion', value: p.conclusion },
  ];
}

export function PlanHeader({ p }: { p: SesPlanContent }) {
  return (
    <div className="space-y-1">
      <div className="text-lg font-bold">{planTitle(p)}</div>
      <div className="text-sm">
        <span className="font-semibold">Objectif :</span> <Md text={p.objectif} className="inline [&>p]:inline" />
      </div>
      <div className="text-sm">
        <span className="font-semibold">Sujet :</span> <Md text={p.sujet} className="inline [&>p]:inline" />
      </div>
    </div>
  );
}

function gradeFromRatio(r: number): Grade4 {
  return r >= 0.9 ? 4 : r >= 0.7 ? 3 : r >= 0.4 ? 2 : 1;
}

/** Rebuild (all fields blank) or gap-fill (some fields blank), then compare and self-check. */
export function PlanDrill({ plan, mode, onDone, seed }: { plan: SesPlanContent; mode: 'rebuild' | 'gaps'; onDone: (grade: Grade4) => void; seed: number }) {
  const fields = planFields(plan);
  const hidden = useMemo(() => {
    if (mode === 'rebuild') return new Set(fields.map((f) => f.key));
    const rng = createRng(seed);
    return new Set(rng.sample(fields.map((f) => f.key), Math.max(2, Math.round(fields.length * 0.4))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id, mode, seed]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const hiddenList = fields.filter((f) => hidden.has(f.key));
  const score = hiddenList.filter((f) => ok[f.key]).length;
  return (
    <div className="space-y-3">
      <PlanHeader p={plan} />
      {fields.map((f) => (
        <div key={f.key} className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
          <div className="mb-1 text-xs font-semibold text-slate-500">{f.label}</div>
          {hidden.has(f.key) ? (
            <>
              <textarea
                className={`${inputCls} text-sm`}
                rows={2}
                value={answers[f.key] ?? ''}
                disabled={revealed}
                placeholder="De mémoire…"
                onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
              />
              {revealed && (
                <div className="mt-2 rounded bg-emerald-50 p-2 text-sm dark:bg-emerald-950/30">
                  <div className="text-xs text-slate-500">Ta fiche :</div>
                  <Md text={f.value} />
                  <div className="mt-1 flex gap-1">
                    <Chip active={ok[f.key] === true} onClick={() => setOk((o) => ({ ...o, [f.key]: true }))}>
                      ✓ L’essentiel y est
                    </Chip>
                    <Chip active={ok[f.key] === false} onClick={() => setOk((o) => ({ ...o, [f.key]: false }))}>
                      ✗ Manquant / faux
                    </Chip>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Md text={f.value} className="text-sm" />
          )}
        </div>
      ))}
      {!revealed ? (
        <Button onClick={() => setRevealed(true)}>Comparer avec ma fiche</Button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm">
            {score}/{hiddenList.length} parties retrouvées (auto-évaluation).
          </p>
          <Button disabled={Object.keys(ok).length < hiddenList.length} onClick={() => onDone(gradeFromRatio(hiddenList.length ? score / hiddenList.length : 1))}>
            Enregistrer
          </Button>
          {Object.keys(ok).length < hiddenList.length && <p className="text-xs text-slate-500">Évalue chaque partie (✓ / ✗) pour enregistrer.</p>}
        </div>
      )}
    </div>
  );
}

/** Review of an SRS 'ses-plan' item inside a session: gap-fill mode. */
export function SesPlanReview({ item, onDone }: ReviewProps) {
  const plan = useLiveQuery(() => db.content.get(item.refId), [item.refId]);
  const [seed] = useState(randomSeed);
  if (plan === undefined) return null;
  if (!plan || plan.type !== 'ses_plan')
    return (
      <div className="space-y-2">
        <p className="text-sm">Plan introuvable (supprimé ?).</p>
        <GradeButtons state={item.srs} onGrade={async (g) => { await gradeItem(item.id, g); onDone(g >= 3); }} />
      </div>
    );
  return (
    <PlanDrill
      plan={plan}
      mode="gaps"
      seed={seed}
      onDone={async (g) => {
        await gradeItem(item.id, g);
        await db.drills.add({ at: Date.now(), subject: 'ses', kind: 'ec1-gaps', refId: plan.id, score: g });
        onDone(g >= 3);
      }}
    />
  );
}

export function Ec1Page() {
  const plans = (useLiveQuery(() => db.content.where('type').equals('ses_plan').toArray(), []) ?? []) as SesPlanContent[];
  const chapters = useLiveQuery(() => db.chapters.where('subject').equals('ses').sortBy('order'), []) ?? [];
  const [mode, setMode] = useState<'list' | 'match'>('list');
  const [active, setActive] = useState<{ plan: SesPlanContent; mode: 'rebuild' | 'gaps'; seed: number } | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  if (active) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
          ← Plans
        </Button>
        <Card>
          <PlanDrill
            plan={active.plan}
            mode={active.mode}
            seed={active.seed}
            onDone={async (g) => {
              await gradeItem(`ec1:${active.plan.id}`, g);
              await db.drills.add({ at: Date.now(), subject: 'ses', kind: active.mode === 'rebuild' ? 'ec1-rebuild' : 'ec1-gaps', refId: active.plan.id, score: g });
              setSaved(`${planTitle(active.plan)} : enregistré (${['', 'à revoir', 'difficile', 'bien', 'très bien'][g]}).`);
              setActive(null);
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle sub="Tes fiches : titre, Objectif, Sujet, Intro, Arg 1–3 (A / E / I), Conclusion">Plans EC1</PageTitle>
      {saved && <Banner tone="ok">{saved}</Banner>}
      <div className="flex gap-1.5">
        <Chip active={mode === 'list'} onClick={() => setMode('list')}>
          Mes plans · {plans.length}
        </Chip>
        <Chip active={mode === 'match'} onClick={() => setMode('match')}>
          Quel argument pour quel sujet ?
        </Chip>
      </div>
      {plans.length === 0 ? (
        <Empty>
          Aucun plan EC1 importé. Ajoute tes fiches (section <code>plans_ec1</code>) dans <Link to="/import" className="underline">Importer</Link>.
        </Empty>
      ) : mode === 'match' ? (
        <MatchGame plans={plans} />
      ) : (
        chapters
          .map((c) => ({ c, list: plans.filter((p) => p.chapterId === c.id) }))
          .concat([{ c: { id: '', title: 'Sans chapitre' } as never, list: plans.filter((p) => !p.chapterId) }])
          .filter((g) => g.list.length)
          .map(({ c, list }) => (
            <Card key={c.id || 'none'} title={c.title}>
              <ul className="space-y-2">
                {list.map((p) => (
                  <li key={p.id} className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                    <div className="text-sm font-medium">{planTitle(p)}</div>
                    <Md text={p.sujet} className="text-xs text-slate-500" />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => setActive({ plan: p, mode: 'rebuild', seed: randomSeed() })}>
                        Reconstruire
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setActive({ plan: p, mode: 'gaps', seed: randomSeed() })}>
                        Compléter les trous
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))
      )}
    </div>
  );
}

function MatchGame({ plans }: { plans: SesPlanContent[] }) {
  const [seed, setSeed] = useState(randomSeed);
  const round = useMemo(() => {
    const rng = createRng(seed);
    const chosen = rng.sample(plans, Math.min(3, plans.length));
    const cards = rng.shuffle(chosen.flatMap((p) => p.arguments.map((a, i) => ({ id: `${p.id}-${i}`, text: a.affirmation, planId: p.id }))));
    return { chosen, cards };
  }, [plans, seed]);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  if (plans.length < 2) return <Empty>Il faut au moins 2 plans importés pour ce jeu.</Empty>;
  const correct = round.cards.filter((c) => assign[c.id] === c.planId).length;
  const done = Object.keys(assign).length === round.cards.length;
  return (
    <Card>
      <p className="mb-2 text-sm text-slate-500">Touche une affirmation, puis le sujet auquel elle répond.</p>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {round.chosen.map((p, k) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              if (selected && !checked) {
                setAssign((a) => ({ ...a, [selected]: p.id }));
                setSelected(null);
              }
            }}
            className={`rounded-lg border p-2 text-left text-sm ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-300 dark:border-slate-700'}`}
          >
            <div className="text-xs font-bold">Sujet {k + 1}</div>
            <Md text={p.sujet} className="[&>p]:m-0" />
          </button>
        ))}
      </div>
      <ul className="space-y-1.5">
        {round.cards.map((c) => {
          const a = assign[c.id];
          const idx = round.chosen.findIndex((p) => p.id === a);
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={checked}
                onClick={() => setSelected(selected === c.id ? null : c.id)}
                className={`w-full rounded-lg border p-2 text-left text-sm ${selected === c.id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-800'} ${checked ? (a === c.planId ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30') : ''}`}
              >
                <span className="mr-2 inline-block w-14 text-xs font-semibold text-slate-500">{idx >= 0 ? `→ Sujet ${idx + 1}` : '—'}</span>
                <Md text={c.text} className="inline [&>p]:inline" />
                {checked && a !== c.planId && <span className="ml-2 text-xs text-emerald-600">(Sujet {round.chosen.findIndex((p) => p.id === c.planId) + 1})</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex gap-2">
        {!checked ? (
          <Button
            disabled={!done}
            onClick={async () => {
              setChecked(true);
              await db.drills.add({ at: Date.now(), subject: 'ses', kind: 'ec1-match', score: correct, max: round.cards.length });
            }}
          >
            Vérifier
          </Button>
        ) : (
          <>
            <span className="self-center text-sm font-semibold">
              {correct}/{round.cards.length}
            </span>
            <Button
              onClick={() => {
                setSeed(randomSeed());
                setAssign({});
                setChecked(false);
              }}
            >
              Nouvelle manche
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
