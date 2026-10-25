import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/db';
import { useSettings } from '../hooks';
import { GENERATORS } from '../generators';
import { SAT_DOMAINS, SAT_SKILLS } from '../generators/sat/skills';
import { groupStats, MASTERY_RAMP, masteryColor } from '../lib/mastery';
import { retrievability } from '../lib/srs';
import { DAY_MS, dayKey, daysUntil, startOfDay, startOfWeek } from '../lib/dates';
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from '../types';
import { BarList, LineChart } from '../components/charts';
import { Card, Chip, PageTitle, Stat } from '../components/ui';
import { skillTitle } from '../catalog';

export function DashboardPage() {
  const settings = useSettings();
  const nav = useNavigate();
  const data = useLiveQuery(async () => {
    const since = Date.now() - 70 * DAY_MS;
    const [attempts, focus, srs, chapters, mistakes, reviews] = await Promise.all([
      db.attempts.where('at').above(since).toArray(),
      db.focus.where('start').above(since).toArray(),
      db.srs.toArray(),
      db.chapters.toArray(),
      db.mistakes.toArray(),
      db.reviewLogs.where('at').above(since).toArray(),
    ]);
    return { attempts, focus, srs, chapters, mistakes, reviews };
  }, []);
  const [trendSubject, setTrendSubject] = useState<SubjectId | 'all'>('all');
  const [heatSubject, setHeatSubject] = useState<SubjectId>('sat');
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const now = Date.now();
  const derived = useMemo(() => {
    if (!data) return null;
    const week0 = startOfWeek(now);
    const week1 = week0 - 7 * DAY_MS;
    const inRange = (t: number, a: number, b: number) => t >= a && t < b;
    const sumMin = (a: number, b: number) => data.focus.filter((f) => inRange(f.start, a, b)).reduce((s, f) => s + f.minutes, 0);
    const att = (a: number, b: number) => data.attempts.filter((x) => inRange(x.at, a, b));
    const thisW = att(week0, now + 1);
    const lastW = att(week1, week0);
    // active days
    const active = new Set<string>();
    for (const x of data.attempts) active.add(dayKey(x.at));
    for (const x of data.focus) active.add(dayKey(x.start));
    for (const x of data.reviews) active.add(dayKey(x.at));
    // gentle streak: consecutive active days ending today (or yesterday if today is not started yet)
    let streak = 0;
    let d = startOfDay(now);
    if (!active.has(dayKey(d))) d -= DAY_MS;
    while (active.has(dayKey(d)) && streak < 400) {
      streak++;
      d -= DAY_MS;
    }
    const last7 = Array.from({ length: 7 }, (_, i) => dayKey(now - i * DAY_MS)).filter((k) => active.has(k)).length;
    // study time per subject (7 days)
    const timeRows = SUBJECT_IDS.map((s) => ({
      label: SUBJECTS[s].short,
      value: data.focus.filter((f) => f.subject === s && f.start > now - 7 * DAY_MS).reduce((a, f) => a + f.minutes, 0),
      color: SUBJECTS[s].color,
    }));
    // trends (8 weeks)
    const weeks = Array.from({ length: 8 }, (_, i) => week0 - (7 - i) * 7 * DAY_MS);
    const filtered = data.attempts.filter((a) => trendSubject === 'all' || a.subject === trendSubject);
    const acc = weeks.map((w) => {
      const l = filtered.filter((a) => inRange(a.at, w, w + 7 * DAY_MS));
      return { label: new Date(w).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }), value: l.length ? (100 * l.filter((a) => a.correct).length) / l.length : null };
    });
    const speed = weeks.map((w, i) => {
      const l = filtered.filter((a) => inRange(a.at, w, w + 7 * DAY_MS));
      return { label: acc[i].label, value: l.length ? l.reduce((s, a) => s + a.timeMs, 0) / l.length / 1000 : null };
    });
    return {
      thisMin: sumMin(week0, now + 1),
      lastMin: sumMin(week1, week0),
      thisW,
      lastW,
      streak,
      last7,
      timeRows,
      acc,
      speed,
      newMistakes: data.mistakes.filter((m) => m.createdAt >= week0).length,
      resolved: data.mistakes.filter((m) => m.resolved).length,
      genStats: groupStats(data.attempts, (a) => a.generatorId, now),
    };
  }, [data, now, trendSubject]);

  if (!data || !derived) return <p className="text-sm text-slate-500">Chargement…</p>;
  const pct = (l: { correct: boolean }[]) => (l.length ? `${Math.round((100 * l.filter((a) => a.correct).length) / l.length)} %` : '—');

  const exams = settings.examDates.map((e) => ({ ...e, days: daysUntil(e.date, now) })).filter((e) => e.days >= 0).sort((a, b) => a.days - b.days);

  // heatmap rows
  type Row = { key: string; title: string; cells: { key: string; title: string; m?: number; to?: string }[] };
  let rows: Row[] = [];
  const gm = (id: string) => derived.genStats.get(id);
  if (heatSubject === 'sat') {
    rows = SAT_SKILLS.map((s) => ({
      key: s.id,
      title: `${SAT_DOMAINS[s.domain].split(' ')[0]} · ${s.title}`,
      cells: GENERATORS.filter((g) => g.skill === s.id).map((g) => ({ key: g.id, title: g.title, m: gm(g.id)?.mastery, to: `/pratique/${g.id}` })),
    }));
  } else if (heatSubject === 'maths' || heatSubject === 'expertes') {
    rows = data.chapters
      .filter((c) => c.subject === heatSubject)
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        key: c.id,
        title: c.title,
        cells: GENERATORS.filter((g) => g.skill === c.id).map((g) => ({ key: g.id, title: g.title, m: gm(g.id)?.mastery, to: `/pratique/${g.id}` })),
      }));
  } else {
    // content subjects: mastery = mean recall probability of the chapter's items
    const chapters = data.chapters.filter((c) => c.subject === heatSubject).sort((a, b) => a.order - b.order);
    rows = [
      {
        key: heatSubject,
        title: SUBJECTS[heatSubject].label,
        cells: chapters.map((c) => {
          const items = data.srs.filter((i) => i.chapterId === c.id && i.srs.reps > 0);
          const m = items.length ? items.reduce((s, i) => s + retrievability(i.srs, now, settings), 0) / items.length : undefined;
          return { key: c.id, title: c.title, m };
        }),
      },
    ];
    if (heatSubject === 'ses') {
      rows.push({
        key: 'ses-calc',
        title: skillTitle('ses-calc'),
        cells: GENERATORS.filter((g) => g.skill === 'ses-calc').map((g) => ({ key: g.id, title: g.title, m: gm(g.id)?.mastery, to: `/pratique/${g.id}` })),
      });
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle sub="Tout est calculé sur ton appareil">Tableau de bord</PageTitle>

      {exams.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {exams.map((e) => (
            <Stat key={e.id} label={e.label} value={`J−${e.days}`} sub={new Date(e.date).toLocaleDateString('fr-FR')} />
          ))}
        </div>
      )}

      <Card title="Cette semaine">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Temps" value={`${Math.round(derived.thisMin)} min`} sub={`sem. dernière : ${Math.round(derived.lastMin)} min`} />
          <Stat label="Questions" value={derived.thisW.length} sub={`réussite ${pct(derived.thisW)}`} />
          <Stat label="Régularité" value={`${derived.last7}/7 jours`} sub={derived.streak > 1 ? `${derived.streak} jours de suite` : 'chaque jour compte'} />
          <Stat label="Erreurs" value={`+${derived.newMistakes}`} sub={`${derived.resolved} résolues au total`} />
        </div>
      </Card>

      <Card title="Temps d’étude par matière (7 jours)">
        <BarList rows={derived.timeRows} unit=" min" />
      </Card>

      <Card title="Tendances (8 semaines)">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Chip active={trendSubject === 'all'} onClick={() => setTrendSubject('all')}>
            Tout
          </Chip>
          {SUBJECT_IDS.map((s) => (
            <Chip key={s} active={trendSubject === s} onClick={() => setTrendSubject(s)}>
              {SUBJECTS[s].short}
            </Chip>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs text-slate-500">Réussite (%)</div>
            <LineChart points={derived.acc} yMin={0} yMax={100} format={(v) => `${Math.round(v)}`} />
          </div>
          <div>
            <div className="mb-1 text-xs text-slate-500">Temps moyen par question (s)</div>
            <LineChart points={derived.speed} />
          </div>
        </div>
      </Card>

      <Card title="Carte de maîtrise">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {SUBJECT_IDS.map((s) => (
            <Chip key={s} active={heatSubject === s} onClick={() => setHeatSubject(s)}>
              {SUBJECTS[s].short}
            </Chip>
          ))}
        </div>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.key}>
              <div className="mb-1 text-xs text-slate-600 dark:text-slate-300">{r.title}</div>
              {r.cells.length === 0 ? (
                <div className="text-xs text-slate-400">—</div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {r.cells.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      title={`${c.title} : ${c.m === undefined ? 'pas encore de données' : `${Math.round(c.m * 100)} %`}`}
                      onClick={() => c.to && nav(c.to)}
                      className="h-7 w-7 rounded border-2 border-white dark:border-slate-900"
                      style={{ backgroundColor: masteryColor(c.m, dark) }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span>faible</span>
          {(dark ? [...MASTERY_RAMP].reverse() : MASTERY_RAMP).map((c) => (
            <span key={c} className="h-3 w-5 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>maîtrisé</span>
          <span className="ml-2 h-3 w-5 rounded-sm" style={{ backgroundColor: masteryColor(undefined) }} />
          <span>pas de données</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Touche une case pour t’entraîner sur ce point (exercices générés).</p>
      </Card>
    </div>
  );
}
