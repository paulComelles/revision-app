import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/db';
import { logFocus } from '../db/repo';
import { useSettings } from '../hooks';
import { makePlan, PLAN_KEY, usePlanData } from '../features/session/usePlanData';
import { ReviewRunner } from '../features/review/ReviewRunner';
import { ExerciseRunner } from '../features/review/ExerciseRunner';
import type { Plan, SessionTask } from '../lib/planner';
import { Button, Card, Progress } from '../components/ui';
import { randomSeed } from '../lib/rng';

function loadStoredPlan(): Plan | null {
  try {
    const raw = sessionStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const { plan, createdAt } = JSON.parse(raw) as { plan: Plan; createdAt: number };
    // a plan is valid for the day it was built
    if (Date.now() - createdAt > 12 * 3600_000) return null;
    return plan;
  } catch {
    return null;
  }
}

export function SessionPage({ trajet = false }: { trajet?: boolean }) {
  const settings = useSettings();
  const data = usePlanData();
  const nav = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(() => (trajet ? null : loadStoredPlan()));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ task: SessionTask; correct: boolean | null }[]>([]);
  const taskStart = useRef(Date.now());

  useEffect(() => {
    if (trajet && !plan && data) setPlan(makePlan(data, settings, 10, 'trajet', randomSeed()));
  }, [trajet, plan, data, settings]);

  if (!plan) {
    if (!trajet)
      return (
        <Card>
          <p className="mb-3 text-sm">Aucune session en cours.</p>
          <Button onClick={() => nav('/')}>Préparer la session du jour</Button>
        </Card>
      );
    return <p className="text-sm text-slate-500">Préparation du mode trajet…</p>;
  }

  const done = index >= plan.tasks.length;
  const task = plan.tasks[index];

  const next = (correct: boolean | null) => {
    const t = plan.tasks[index];
    const end = Date.now();
    void logFocus(t.subject, taskStart.current, end, trajet ? 'trajet' : 'session', t.title);
    taskStart.current = end;
    setResults((r) => [...r, { task: t, correct }]);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  };

  if (done) {
    const answered = results.filter((r) => r.correct !== null);
    const ok = answered.filter((r) => r.correct).length;
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">{trajet ? 'Trajet terminé 🚆' : 'Session terminée 🎉'}</h1>
        <Card>
          <p className="text-lg">
            {ok} / {answered.length} réussis
          </p>
          <p className="text-sm text-slate-500">{results.filter((r) => r.correct === null).length} élément(s) passé(s)</p>
          <ul className="mt-3 space-y-1 text-sm">
            {results.map((r, i) => (
              <li key={i}>
                {r.correct === null ? '⏭️' : r.correct ? '✅' : '❌'} {r.task.title}
              </li>
            ))}
          </ul>
        </Card>
        <div className="flex gap-2">
          <Button onClick={() => nav('/')}>Retour</Button>
          <Button variant="secondary" onClick={() => nav('/erreurs')}>
            Carnet d’erreurs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Progress value={index / plan.tasks.length} />
        <span className="shrink-0 text-xs text-slate-500">
          {index + 1}/{plan.tasks.length}
        </span>
        <Button variant="ghost" size="sm" onClick={() => next(null)}>
          Passer
        </Button>
      </div>
      <Card className={trajet ? 'p-3' : ''}>
        <TaskView key={index} task={task} onDone={next} compact={trajet} />
      </Card>
      <Button variant="ghost" size="sm" onClick={() => nav('/')}>
        ✕ Quitter la session
      </Button>
    </div>
  );
}

function TaskView({ task, onDone, compact }: { task: SessionTask; onDone: (correct: boolean | null) => void; compact?: boolean }) {
  const item = useLiveQuery(async () => (task.kind === 'review' ? ((await db.srs.get(task.itemId)) ?? null) : null), [task]);
  // freeze the item at the moment it was loaded (grading changes it)
  const [frozen, setFrozen] = useState<typeof item>(undefined);
  useEffect(() => {
    if (item !== undefined && frozen === undefined) setFrozen(item);
  }, [item, frozen]);
  if (task.kind === 'review') {
    if (frozen === undefined) return null;
    if (!frozen) return <Button onClick={() => onDone(null)}>Élément supprimé — suivant</Button>;
    return <ReviewRunner item={frozen} onDone={onDone} compact={compact} />;
  }
  return (
    <ExerciseRunner
      spec={{ generatorId: task.generatorId, seed: task.seed, difficulty: task.difficulty, format: task.format }}
      source={compact ? 'trajet' : 'session'}
      timeLimitSec={task.kind === 'timed' ? task.timeLimitSec : undefined}
      compact={compact}
      label={task.kind === 'timed' ? `Chronométré · ${task.title}` : undefined}
      onDone={(o) => onDone(o.correct)}
    />
  );
}
