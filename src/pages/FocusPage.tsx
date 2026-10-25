import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { logFocus } from '../db/repo';
import { useSettings } from '../hooks';
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from '../types';
import { Badge, Button, Card, Chip, inputCls, PageTitle } from '../components/ui';
import { startOfDay } from '../lib/dates';

interface TimerState {
  phase: 'idle' | 'focus' | 'break';
  subject: SubjectId;
  label: string;
  /** epoch ms when the current phase ends (running) */
  endAt?: number;
  /** remaining ms while paused */
  pausedMs?: number;
  /** when the current focus block started counting (for logging) */
  segmentStart?: number;
}

const KEY = 'revision-focus-timer';

function load(): TimerState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as TimerState | null;
    if (s) return s;
  } catch {
    /* ignore */
  }
  return { phase: 'idle', subject: 'maths', label: '' };
}

function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    o.frequency.value = 880;
    o.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.35);
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* ignore */
  }
}

export function FocusPage() {
  const settings = useSettings();
  const [st, setSt] = useState<TimerState>(load);
  const [now, setNow] = useState(Date.now());
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(st)), [st]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const running = st.phase !== 'idle' && st.endAt !== undefined;
  const remaining = st.phase === 'idle' ? settings.focusMinutes * 60_000 : running ? Math.max(0, st.endAt! - now) : (st.pausedMs ?? 0);

  // phase end
  useEffect(() => {
    if (!running || remaining > 0) return;
    beep();
    if (st.phase === 'focus') {
      void logFocus(st.subject, st.segmentStart ?? now - settings.focusMinutes * 60_000, now, 'focus', st.label || undefined);
      setSt({ ...st, phase: 'break', endAt: now + settings.breakMinutes * 60_000, segmentStart: undefined, pausedMs: undefined });
    } else {
      setSt({ ...st, phase: 'idle', endAt: undefined, pausedMs: undefined });
    }
  }, [running, remaining, st, now, settings.focusMinutes, settings.breakMinutes]);

  const start = () => {
    const t = Date.now();
    setSt({ ...st, phase: 'focus', endAt: t + settings.focusMinutes * 60_000, segmentStart: t, pausedMs: undefined });
  };
  const pause = () => {
    if (!running) return;
    const t = Date.now();
    // log the focus done so far
    if (st.phase === 'focus' && st.segmentStart) void logFocus(st.subject, st.segmentStart, t, 'focus', st.label || undefined);
    setSt({ ...st, endAt: undefined, pausedMs: st.endAt! - t, segmentStart: undefined });
  };
  const resume = () => {
    const t = Date.now();
    setSt({ ...st, endAt: t + (st.pausedMs ?? 0), pausedMs: undefined, segmentStart: st.phase === 'focus' ? t : undefined });
  };
  const stop = () => {
    const t = Date.now();
    if (running && st.phase === 'focus' && st.segmentStart) void logFocus(st.subject, st.segmentStart, t, 'focus', st.label || undefined);
    setSt({ ...st, phase: 'idle', endAt: undefined, pausedMs: undefined, segmentStart: undefined });
  };

  const today = useLiveQuery(() => db.focus.where('start').above(startOfDay(Date.now())).toArray(), []) ?? [];
  const perSubject = SUBJECT_IDS.map((s) => ({ s, m: today.filter((r) => r.subject === s).reduce((a, r) => a + r.minutes, 0) })).filter((x) => x.m > 0);

  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  const total = (st.phase === 'break' ? settings.breakMinutes : settings.focusMinutes) * 60_000;

  return (
    <div className="space-y-4">
      <PageTitle sub="Pomodoro : le temps est enregistré par matière">Focus</PageTitle>
      <Card>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {SUBJECT_IDS.map((s) => (
            <Chip key={s} active={st.subject === s} onClick={() => st.phase === 'idle' && setSt({ ...st, subject: s })}>
              {SUBJECTS[s].short}
            </Chip>
          ))}
        </div>
        <input
          className={inputCls}
          placeholder="Ce que je travaille (optionnel)"
          value={st.label}
          disabled={st.phase !== 'idle'}
          onChange={(e) => setSt({ ...st, label: e.target.value })}
        />
        <div className="my-6 text-center">
          <div className="text-sm uppercase tracking-wide text-slate-500">{st.phase === 'break' ? 'Pause' : st.phase === 'focus' ? 'Concentration' : 'Prêt'}</div>
          <div className="font-mono text-6xl font-bold tabular-nums">
            {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
          </div>
          <div className="mx-auto mt-3 h-1.5 max-w-xs rounded-full bg-slate-200 dark:bg-slate-800">
            <div className={`h-1.5 rounded-full ${st.phase === 'break' ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${st.phase === 'idle' ? 0 : (1 - remaining / total) * 100}%` }} />
          </div>
        </div>
        <div className="flex justify-center gap-2">
          {st.phase === 'idle' && (
            <Button size="lg" onClick={start}>
              ▶ Démarrer {settings.focusMinutes} min
            </Button>
          )}
          {st.phase !== 'idle' && running && (
            <Button size="lg" variant="secondary" onClick={pause}>
              ⏸ Pause
            </Button>
          )}
          {st.phase !== 'idle' && !running && (
            <Button size="lg" onClick={resume}>
              ▶ Reprendre
            </Button>
          )}
          {st.phase !== 'idle' && (
            <Button size="lg" variant="ghost" onClick={stop}>
              ■ Arrêter
            </Button>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          Durées modifiables dans Réglages ({settings.focusMinutes} / {settings.breakMinutes} min).
        </p>
      </Card>
      <Card title="Aujourd’hui">
        {perSubject.length === 0 ? (
          <p className="text-sm text-slate-500">Pas encore de temps enregistré.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {perSubject.map(({ s, m }) => (
              <Badge key={s} color={SUBJECTS[s].color}>
                {SUBJECTS[s].short} · {Math.round(m)} min
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
