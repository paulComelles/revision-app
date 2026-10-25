import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettings } from '../hooks';
import { makePlan, PLAN_KEY, usePlanData } from '../features/session/usePlanData';
import { Badge, Banner, Button, Card, Chip, LinkButton, PageTitle } from '../components/ui';
import { SUBJECTS } from '../types';
import { daysUntil, dayKey, startOfWeek } from '../lib/dates';
import { hashString } from '../lib/rng';
import { db } from '../db/db';
import type { SessionTask } from '../lib/planner';

function taskLabel(t: SessionTask): string {
  if (t.kind === 'review') return t.title;
  if (t.kind === 'timed') return `⏱️ ${t.title} (${t.timeLimitSec < 120 ? `${t.timeLimitSec} s` : `${Math.round(t.timeLimitSec / 60)} min`})`;
  return t.title;
}

export function TodayPage() {
  const settings = useSettings();
  const data = usePlanData();
  const nav = useNavigate();
  const [minutes, setMinutes] = useState<number | null>(null);
  const [regen, setRegen] = useState(0);
  const mins = minutes ?? settings.sessionMinutes;
  const today = dayKey(Date.now());
  const plan = useMemo(
    () => (data ? makePlan(data, settings, mins, 'normal', hashString(`${today}|${mins}|${regen}`)) : null),
    [data, settings, mins, regen, today],
  );
  const weekMinutes = useLiveQuery(async () => {
    const rows = await db.focus.where('start').above(startOfWeek(Date.now())).toArray();
    return Math.round(rows.reduce((s, r) => s + r.minutes, 0));
  }, []);

  const exams = settings.examDates
    .map((e) => ({ ...e, days: daysUntil(e.date, Date.now()) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  const start = () => {
    if (!plan) return;
    sessionStorage.setItem(PLAN_KEY, JSON.stringify({ plan, createdAt: Date.now() }));
    nav('/session');
  };

  const groups = plan
    ? [
        { title: 'Révisions dues', tasks: plan.tasks.filter((t) => t.kind === 'review') },
        { title: plan.weakSkill ? `Point faible : ${plan.weakSkill.title}` : 'Point faible', tasks: plan.tasks.filter((t) => t.kind === 'exercise') },
        { title: 'Exercice chronométré', tasks: plan.tasks.filter((t) => t.kind === 'timed') },
      ]
    : [];

  return (
    <div className="space-y-4">
      <PageTitle sub={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}>Aujourd’hui</PageTitle>

      {exams.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {exams.map((e) => (
            <div key={e.id} className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800/70">
              <div className="font-bold">J−{e.days}</div>
              <div className="text-xs text-slate-500">{e.label}</div>
            </div>
          ))}
        </div>
      )}

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Durée :</span>
          {[15, 30, 45].map((m) => (
            <Chip key={m} active={mins === m} onClick={() => setMinutes(m)}>
              {m} min
            </Chip>
          ))}
        </div>
        {!plan ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : (
          <div className="space-y-3">
            {groups.map(
              (g) =>
                g.tasks.length > 0 && (
                  <div key={g.title}>
                    <div className="mb-1 text-sm font-semibold">
                      {g.title} <span className="font-normal text-slate-500">· {g.tasks.length}</span>
                    </div>
                    <ul className="space-y-1">
                      {g.tasks.slice(0, 6).map((t, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Badge color={SUBJECTS[t.subject].color}>{SUBJECTS[t.subject].short}</Badge>
                          <span className="truncate">{taskLabel(t)}</span>
                        </li>
                      ))}
                      {g.tasks.length > 6 && <li className="text-xs text-slate-500">+ {g.tasks.length - 6} autres</li>}
                    </ul>
                  </div>
                ),
            )}
            {plan.notes.map((n) => (
              <p key={n} className="text-xs text-slate-500">
                {n}
              </p>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="lg" onClick={start} disabled={plan.tasks.length === 0}>
                ▶ Commencer ({plan.totalMin} min)
              </Button>
              <Button variant="ghost" onClick={() => setRegen((r) => r + 1)}>
                ↻ Autre tirage
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <LinkButton to="/trajet" variant="secondary" className="py-4 text-base">
          🚆 Mode trajet · 10 min
        </LinkButton>
        <LinkButton to="/focus" variant="secondary" className="py-4 text-base">
          ⏱️ Focus
        </LinkButton>
      </div>

      <Card>
        <div className="flex items-center justify-between text-sm">
          <span>Cette semaine</span>
          <span className="font-semibold">{weekMinutes ?? 0} min</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {data ? `${data.due.length} élément(s) à réviser aujourd’hui` : ''} · objectif {settings.dailyGoalMinutes} min/jour
        </div>
      </Card>

      {data && data.attempts.length > 20 && (!settings.lastBackupAt || Date.now() - settings.lastBackupAt > 7 * 86_400_000) && (
        <Banner tone="warn">
          Pense à exporter une sauvegarde (Réglages → Sauvegarde) : tes données ne vivent que dans ce navigateur.
        </Banner>
      )}

      {settings.examDates.length === 0 && (
        <Banner>
          Ajoute tes dates d’examen dans <a className="underline" href="#/reglages">Réglages</a> : les matières proches de l’examen passent en priorité.
        </Banner>
      )}
    </div>
  );
}
