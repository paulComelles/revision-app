import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import { logFocus } from '../../db/repo';
import type { DossierContent } from '../../content/types';
import { Md } from '../../components/Md';
import { Banner, Button, Card, Chip, Empty, inputCls, PageTitle } from '../../components/ui';
import { GradeButtons } from '../review/GradeButtons';

interface Idea {
  id: string;
  doc: number | null;
  text: string;
  data: string;
  para: 0 | 1 | 2 | 3;
}

interface Draft {
  ideas: Idea[];
  titles: [string, string, string];
  intro: string;
  conclusion: string;
  startedAt: number;
  minutes: number;
}

const CHECK = [
  'Tous les documents sont exploités (au moins une idée chacun).',
  'Chaque paragraphe a une idée directrice qui répond au sujet.',
  'Chaque idée est illustrée par une donnée précise d’un document (chiffre cité avec la source).',
  'Intro : accroche, définitions des termes du sujet, problématique, annonce du plan.',
  'Conclusion : réponse claire au sujet (bilan des 3 paragraphes).',
];

const KEY = (id: string) => `revision-rdd-${id}`;
const uidLocal = () => Math.random().toString(36).slice(2, 9);

export function RddPage() {
  const dossiers = (useLiveQuery(() => db.content.where('type').equals('dossier').toArray(), []) ?? []) as DossierContent[];
  const [active, setActive] = useState<DossierContent | null>(null);
  const [minutes, setMinutes] = useState(15);
  if (active) return <RddDrill dossier={active} minutes={minutes} onExit={() => setActive(null)} />;
  return (
    <div className="space-y-4">
      <PageTitle sub="Raisonnement s’appuyant sur un dossier documentaire : brouillon chronométré, idées → 3 paragraphes, intro et conclusion">RDD</PageTitle>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm">Temps de préparation :</span>
        {[10, 15, 20, 30].map((m_) => (
          <Chip key={m_} active={minutes === m_} onClick={() => setMinutes(m_)}>
            {m_} min
          </Chip>
        ))}
      </div>
      {dossiers.length === 0 ? (
        <Empty>
          Aucun dossier importé. Ajoute un sujet et ses documents (section <code>dossiers_rdd</code>) dans <Link className="underline" to="/import">Importer</Link>.
        </Empty>
      ) : (
        dossiers.map((d) => (
          <Card key={d.id}>
            <Md text={`**${d.sujet}**`} />
            <p className="text-xs text-slate-500">{d.documents.length} document(s)</p>
            <Button className="mt-2" size="sm" onClick={() => setActive(d)}>
              Commencer
            </Button>
          </Card>
        ))
      )}
    </div>
  );
}

function RddDrill({ dossier, minutes, onExit }: { dossier: DossierContent; minutes: number; onExit: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY(dossier.id)) ?? 'null') as Draft | null;
      if (saved) return saved;
    } catch {
      /* ignore */
    }
    return {
      ideas: dossier.documents.map((_, i) => ({ id: uidLocal(), doc: i, text: '', data: '', para: 0 })),
      titles: ['', '', ''],
      intro: '',
      conclusion: '',
      startedAt: Date.now(),
      minutes,
    };
  });
  const [step, setStep] = useState<'docs' | 'plan' | 'write' | 'check'>('docs');
  const [now, setNow] = useState(Date.now());
  const [ticks, setTicks] = useState<boolean[]>(CHECK.map(() => false));
  const [done, setDone] = useState(false);
  useEffect(() => localStorage.setItem(KEY(dossier.id), JSON.stringify(draft)), [draft, dossier.id]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = draft.minutes * 60_000 - (now - draft.startedAt);
  const setIdea = (id: string, patch: Partial<Idea>) => setDraft((d) => ({ ...d, ideas: d.ideas.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const clock = `${left < 0 ? '+' : ''}${Math.floor(Math.abs(left) / 60000)}:${String(Math.floor((Math.abs(left) % 60000) / 1000)).padStart(2, '0')}`;

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <Button variant="ghost" size="sm" onClick={onExit}>
          ← Dossiers
        </Button>
        <span className={`font-mono text-sm ${left < 0 ? 'text-red-500' : ''}`}>{left < 0 ? `Temps dépassé ${clock}` : clock}</span>
      </div>
      <Card>
        <Md text={`**Sujet :** ${dossier.sujet}`} />
      </Card>
      <div className="flex flex-wrap gap-1.5">
        {(['docs', 'plan', 'write', 'check'] as const).map((s, i) => (
          <Chip key={s} active={step === s} onClick={() => setStep(s)}>
            {i + 1}. {{ docs: 'Brouillon', plan: 'Plan', write: 'Intro / conclusion', check: 'Bilan' }[s]}
          </Chip>
        ))}
      </div>

      {step === 'docs' && (
        <div className="space-y-3">
          {dossier.documents.map((doc, i) => (
            <Card key={i} title={`${doc.titre}`}>
              <Md text={doc.contenu} className="text-sm" />
              {doc.source && <p className="mt-1 text-xs text-slate-500">Source : {doc.source}</p>}
              {draft.ideas
                .filter((x) => x.doc === i)
                .map((idea) => (
                  <div key={idea.id} className="mt-2 grid gap-2 sm:grid-cols-2">
                    <textarea className={`${inputCls} text-sm`} rows={2} placeholder="Idée principale du document" value={idea.text} onChange={(e) => setIdea(idea.id, { text: e.target.value })} />
                    <textarea className={`${inputCls} text-sm`} rows={2} placeholder="Donnée / exemple à citer" value={idea.data} onChange={(e) => setIdea(idea.id, { data: e.target.value })} />
                  </div>
                ))}
              <Button size="sm" variant="ghost" className="mt-1" onClick={() => setDraft((d) => ({ ...d, ideas: [...d.ideas, { id: uidLocal(), doc: i, text: '', data: '', para: 0 }] }))}>
                + autre idée
              </Button>
            </Card>
          ))}
          <Card title="Connaissances personnelles">
            {draft.ideas
              .filter((x) => x.doc === null)
              .map((idea) => (
                <textarea key={idea.id} className={`${inputCls} mb-2 text-sm`} rows={2} placeholder="Idée tirée du cours" value={idea.text} onChange={(e) => setIdea(idea.id, { text: e.target.value })} />
              ))}
            <Button size="sm" variant="ghost" onClick={() => setDraft((d) => ({ ...d, ideas: [...d.ideas, { id: uidLocal(), doc: null, text: '', data: '', para: 0 }] }))}>
              + idée de cours
            </Button>
          </Card>
          <Button onClick={() => setStep('plan')}>Étape suivante : le plan →</Button>
        </div>
      )}

      {step === 'plan' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Range chaque idée dans un paragraphe (touche 1, 2 ou 3), puis donne une idée directrice à chaque paragraphe.</p>
          {draft.ideas
            .filter((x) => x.text.trim())
            .map((idea) => (
              <div key={idea.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-slate-500">{idea.doc === null ? 'Cours' : dossier.documents[idea.doc]?.titre} · </span>
                  {idea.text}
                </div>
                <div className="flex shrink-0 gap-1">
                  {([1, 2, 3] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setIdea(idea.id, { para: idea.para === p ? 0 : p })}
                      className={`h-8 w-8 rounded ${idea.para === p ? 'bg-blue-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {draft.ideas.every((x) => !x.text.trim()) && <Banner tone="warn">Écris d’abord des idées dans le brouillon.</Banner>}
          {([0, 1, 2] as const).map((k) => (
            <Card key={k} title={`Paragraphe ${k + 1}`}>
              <input
                className={inputCls}
                placeholder="Idée directrice du paragraphe"
                value={draft.titles[k]}
                onChange={(e) => setDraft((d) => ({ ...d, titles: d.titles.map((t, j) => (j === k ? e.target.value : t)) as Draft['titles'] }))}
              />
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
                {draft.ideas
                  .filter((x) => x.para === k + 1)
                  .map((x) => (
                    <li key={x.id}>
                      {x.text} {x.data && <span className="text-slate-500">— {x.data}</span>}
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
          <Button onClick={() => setStep('write')}>Étape suivante : intro et conclusion →</Button>
        </div>
      )}

      {step === 'write' && (
        <div className="space-y-3">
          <Card title="Introduction">
            <textarea className={`${inputCls} text-sm`} rows={6} placeholder="Accroche, définitions, problématique, annonce du plan" value={draft.intro} onChange={(e) => setDraft((d) => ({ ...d, intro: e.target.value }))} />
          </Card>
          <Card title="Conclusion">
            <textarea className={`${inputCls} text-sm`} rows={4} placeholder="Réponse au sujet" value={draft.conclusion} onChange={(e) => setDraft((d) => ({ ...d, conclusion: e.target.value }))} />
          </Card>
          <Button onClick={() => setStep('check')}>Faire le bilan →</Button>
        </div>
      )}

      {step === 'check' && (
        <Card title="Auto-évaluation">
          <div className="space-y-1.5">
            {CHECK.map((c, i) => (
              <label key={i} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600" checked={ticks[i]} onChange={(e) => setTicks((t) => t.map((x, j) => (j === i ? e.target.checked : x)))} />
                {c}
              </label>
            ))}
          </div>
          {!done ? (
            <div className="mt-3">
              <GradeButtons
                labels={{ 1: 'À reprendre', 2: 'Moyen', 3: 'Bien', 4: 'Très bien' }}
                onGrade={async (g) => {
                  const end = Date.now();
                  await db.drills.add({ at: end, subject: 'ses', kind: 'rdd', refId: dossier.id, score: g, max: 4, minutes: Math.round((end - draft.startedAt) / 60000), notes: JSON.stringify({ ...draft, checklist: ticks }) });
                  await logFocus('ses', draft.startedAt, end, 'drill', 'RDD');
                  localStorage.removeItem(KEY(dossier.id));
                  setDone(true);
                }}
              />
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <Banner tone="ok">Entraînement enregistré.</Banner>
              <Button onClick={onExit}>Retour aux dossiers</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
