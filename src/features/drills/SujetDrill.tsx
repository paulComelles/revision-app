import { useEffect, useState } from 'react';
import { db } from '../../db/db';
import { logFocus } from '../../db/repo';
import type { SujetContent } from '../../content/types';
import type { SubjectId } from '../../types';
import { Md } from '../../components/Md';
import { Banner, Button, inputCls } from '../../components/ui';
import { GradeButtons } from '../review/GradeButtons';

export interface DrillField {
  key: string;
  label: string;
  placeholder?: string;
  rows?: number;
}

/**
 * Timed written drill on one of Paul's imported sujets: fill the fields, then
 * self-check with a checklist (and his reference plan, if imported).
 */
export function SujetDrill({
  sujet,
  minutes,
  fields,
  checklist,
  kind,
  subject,
  onDone,
}: {
  sujet: SujetContent;
  minutes: number;
  fields: DrillField[];
  checklist: string[];
  kind: string;
  subject: SubjectId;
  onDone: () => void;
}) {
  const [start] = useState(Date.now);
  const [now, setNow] = useState(Date.now());
  const [values, setValues] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'write' | 'check' | 'done'>('write');
  const [ticks, setTicks] = useState<boolean[]>(checklist.map(() => false));
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = minutes * 60_000 - (now - start);
  const clock = `${left < 0 ? '+' : ''}${Math.floor(Math.abs(left) / 60000)}:${String(Math.floor((Math.abs(left) % 60000) / 1000)).padStart(2, '0')}`;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Md text={`**Sujet :** ${sujet.texte}`} />
        {phase === 'write' && <span className={`shrink-0 font-mono text-sm ${left < 0 ? 'text-red-500' : ''}`}>{clock}</span>}
      </div>
      {sujet.extrait && (
        <blockquote className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800/60">
          <Md text={sujet.extrait} />
          {sujet.auteur && <div className="mt-1 text-right text-xs text-slate-500">— {sujet.auteur}</div>}
        </blockquote>
      )}
      {fields.map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1 block text-sm font-medium">{f.label}</span>
          <textarea
            className={`${inputCls} text-sm`}
            rows={f.rows ?? 3}
            placeholder={f.placeholder}
            disabled={phase !== 'write'}
            value={values[f.key] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
          />
        </label>
      ))}
      {phase === 'write' && <Button onClick={() => setPhase('check')}>J’ai fini : auto-évaluation</Button>}
      {phase !== 'write' && (
        <div className="space-y-3">
          {sujet.plan && sujet.plan.length > 0 && (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
              <div className="mb-1 font-semibold">Plan de référence (ton import)</div>
              <ol className="list-decimal pl-5">
                {sujet.plan.map((p, i) => (
                  <li key={i}>
                    <Md text={p} className="[&>p]:m-0" />
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="space-y-1.5">
            {checklist.map((c, i) => (
              <label key={i} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600" checked={ticks[i]} onChange={(e) => setTicks((t) => t.map((x, j) => (j === i ? e.target.checked : x)))} />
                {c}
              </label>
            ))}
          </div>
          {phase === 'check' ? (
            <GradeButtons
              labels={{ 1: 'À reprendre', 2: 'Moyen', 3: 'Bien', 4: 'Très bien' }}
              onGrade={async (g) => {
                const end = Date.now();
                await db.drills.add({ at: end, subject, kind, refId: sujet.id, score: g, max: 4, minutes: Math.round((end - start) / 60000), notes: JSON.stringify({ values, checklist: ticks }) });
                await logFocus(subject, start, end, 'drill', kind);
                setPhase('done');
              }}
            />
          ) : (
            <>
              <Banner tone="ok">Entraînement enregistré.</Banner>
              <Button onClick={onDone}>Autre sujet →</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
