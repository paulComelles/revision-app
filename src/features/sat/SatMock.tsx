import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { logFocus, recordQuestionAttempt } from '../../db/repo';
import { SAT_GENERATORS } from '../../generators/sat';
import { buildModule, estimateBand, routeModule2, type MockItem } from '../../generators/sat/mock';
import { MOCK_CONFIG } from '../../generators/sat/mockConfig';
import { SAT_DOMAINS, SAT_SKILL_BY_ID, type SatDomainId } from '../../generators/sat/skills';
import { getGenerator } from '../../generators';
import { checkQuestion } from '../../generators/check';
import type { Question } from '../../generators/types';
import { randomSeed } from '../../lib/rng';
import { AnswerInput, answerText } from '../../components/QuestionView';
import { FigureView } from '../../components/FigureView';
import { Md } from '../../components/Md';
import { Banner, Button, Card, PageTitle } from '../../components/ui';
import { DesmosButton } from './SatHome';

interface MockState {
  phase: 'intro' | 'm1' | 'break' | 'm2' | 'done';
  seed: number;
  m1: MockItem[];
  m2: MockItem[];
  route?: 'harder' | 'easier';
  answers: Record<string, string[]>;
  marked: string[];
  moduleStart?: number;
  testStart?: number;
  current: number;
  saved?: boolean;
}

const KEY = 'revision-sat-mock';
const keyOf = (mod: 1 | 2, i: number) => `${mod}-${i}`;

function load(): MockState | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') as MockState | null;
  } catch {
    return null;
  }
}

const genQ = (it: MockItem): Question => getGenerator(it.generatorId)!.generate(it.seed, it.difficulty, it.format);

function scoreModule(items: MockItem[], mod: 1 | 2, answers: MockState['answers']) {
  return items.map((it, i) => {
    const q = genQ(it);
    const inp = answers[keyOf(mod, i)] ?? [];
    const r = inp.length ? checkQuestion(q, inp) : { valid: false, correct: false };
    return { it, q, inp, correct: r.valid && r.correct };
  });
}

export function SatMock() {
  const [st, setSt] = useState<MockState | null>(load);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (st) localStorage.setItem(KEY, JSON.stringify(st));
    else localStorage.removeItem(KEY);
  }, [st]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const history = useLiveQuery(() => db.mocks.orderBy('at').reverse().limit(5).toArray(), []) ?? [];

  const start = () => {
    const seed = randomSeed();
    setSt({ phase: 'm1', seed, m1: buildModule(SAT_GENERATORS, seed, MOCK_CONFIG.module1HardShare), m2: [], answers: {}, marked: [], moduleStart: Date.now(), testStart: Date.now(), current: 0 });
  };

  if (!st || st.phase === 'intro') {
    return (
      <div className="space-y-4">
        <PageTitle action={<DesmosButton />}>Adaptive mock test</PageTitle>
        <Card>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              {MOCK_CONFIG.modules} modules × {MOCK_CONFIG.questionsPerModule} questions, {MOCK_CONFIG.minutesPerModule} minutes each.
            </li>
            <li>About {Math.round(MOCK_CONFIG.mcqShare * 100)} % multiple choice, the rest typed (SPR).</li>
            <li>Module 2 is harder or easier depending on module 1 ({MOCK_CONFIG.harderThreshold}+ correct → harder).</li>
            <li>No hints, no feedback until the end. You can move between questions and mark them for review.</li>
            <li>Only Medium and Hard generated questions are used (no Easy level).</li>
          </ul>
          <div className="mt-3">
            <Banner tone="warn">The final score is a rough estimate band, not an official SAT score.</Banner>
          </div>
          <Button size="lg" className="mt-3" onClick={start}>
            Start module 1
          </Button>
        </Card>
        {history.length > 0 && (
          <Card title="Previous mock tests">
            <ul className="space-y-1 text-sm">
              {history.map((h) => (
                <li key={h.id}>
                  {new Date(h.at).toLocaleDateString('fr-FR')} — {h.total}/{MOCK_CONFIG.questionsPerModule * 2} correct · module 2 {h.module2Level} · estimate {h.bandLow}–{h.bandHigh}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  if (st.phase === 'break') {
    return (
      <Card>
        <h2 className="text-lg font-semibold">Module 1 submitted</h2>
        <p className="mt-1 text-sm text-slate-500">Module 2 is ready. Take a short breath, then start when you are ready.</p>
        <Button size="lg" className="mt-3" onClick={() => setSt({ ...st, phase: 'm2', moduleStart: Date.now(), current: 0 })}>
          Start module 2
        </Button>
      </Card>
    );
  }

  if (st.phase === 'done') return <MockResults st={st} onReset={() => setSt(null)} />;

  const mod: 1 | 2 = st.phase === 'm1' ? 1 : 2;
  const items = mod === 1 ? st.m1 : st.m2;
  const left = MOCK_CONFIG.minutesPerModule * 60_000 - (now - (st.moduleStart ?? now));

  const submitModule = () => {
    if (mod === 1) {
      const correct = scoreModule(st.m1, 1, st.answers).filter((r) => r.correct).length;
      const route = routeModule2(correct);
      const m2 = buildModule(SAT_GENERATORS, st.seed + 1, MOCK_CONFIG.module2HardShare[route]);
      void logFocus('sat', st.moduleStart ?? Date.now(), Date.now(), 'mock', 'SAT mock — module 1');
      setSt({ ...st, phase: 'break', route, m2, current: 0 });
    } else {
      void logFocus('sat', st.moduleStart ?? Date.now(), Date.now(), 'mock', 'SAT mock — module 2');
      setSt({ ...st, phase: 'done' });
    }
  };

  return <ModuleView key={mod} st={st} setSt={setSt} mod={mod} items={items} leftMs={left} onSubmit={submitModule} />;
}

function ModuleView({
  st,
  setSt,
  mod,
  items,
  leftMs,
  onSubmit,
}: {
  st: MockState;
  setSt: (s: MockState) => void;
  mod: 1 | 2;
  items: MockItem[];
  leftMs: number;
  onSubmit: () => void;
}) {
  const i = st.current;
  const q = useMemo(() => genQ(items[i]), [items, i]);
  const k = keyOf(mod, i);
  const timeUp = leftMs <= 0;
  useEffect(() => {
    if (timeUp) onSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);
  const mm = Math.max(0, Math.floor(leftMs / 60000));
  const ss = Math.max(0, Math.floor((leftMs % 60000) / 1000));
  const go = (j: number) => setSt({ ...st, current: j });
  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <span className="text-sm font-semibold">
          Module {mod} · {i + 1}/{items.length}
        </span>
        <span className={`font-mono text-sm ${leftMs < 5 * 60_000 ? 'text-red-500' : ''}`}>
          {mm}:{String(ss).padStart(2, '0')}
        </span>
        <DesmosButton />
      </div>
      <Card>
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{q.format === 'spr' ? 'Student-produced response' : 'Multiple choice'}</span>
          <button
            type="button"
            className={`rounded px-2 py-0.5 ${st.marked.includes(k) ? 'bg-amber-500 text-white' : 'border border-slate-300 dark:border-slate-700'}`}
            onClick={() => setSt({ ...st, marked: st.marked.includes(k) ? st.marked.filter((x) => x !== k) : [...st.marked, k] })}
          >
            🔖 Mark for review
          </button>
        </div>
        <Md text={q.prompt} />
        {q.figure && (
          <div className="my-2">
            <FigureView figure={q.figure} />
          </div>
        )}
        <div className="mt-3">
          <AnswerInput q={q} inputs={st.answers[k] ?? []} setInputs={(v) => setSt({ ...st, answers: { ...st.answers, [k]: v } })} disabled={false} result={null} onEnter={() => i < items.length - 1 && go(i + 1)} />
        </div>
      </Card>
      <div className="flex justify-between">
        <Button variant="secondary" disabled={i === 0} onClick={() => go(i - 1)}>
          ← Back
        </Button>
        {i < items.length - 1 ? (
          <Button onClick={() => go(i + 1)}>Next →</Button>
        ) : (
          <Button
            variant="success"
            onClick={() => {
              const blank = items.filter((_, j) => !(st.answers[keyOf(mod, j)] ?? []).some((x) => x?.trim())).length;
              if (confirm(blank ? `${blank} question(s) unanswered. Submit module ${mod}?` : `Submit module ${mod}?`)) onSubmit();
            }}
          >
            Submit module
          </Button>
        )}
      </div>
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-11">
        {items.map((_, j) => {
          const kk = keyOf(mod, j);
          const answered = (st.answers[kk] ?? []).some((x) => x?.trim());
          return (
            <button
              key={j}
              type="button"
              onClick={() => go(j)}
              className={`relative rounded border py-1 text-xs ${j === i ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-slate-300 dark:border-slate-700'} ${answered ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
            >
              {j + 1}
              {st.marked.includes(kk) && <span className="absolute -top-1 -right-1 text-[10px]">🔖</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MockResults({ st, onReset }: { st: MockState; onReset: () => void }) {
  const r1 = useMemo(() => scoreModule(st.m1, 1, st.answers), [st]);
  const r2 = useMemo(() => scoreModule(st.m2, 2, st.answers), [st]);
  const c1 = r1.filter((r) => r.correct).length;
  const c2 = r2.filter((r) => r.correct).length;
  const route = st.route ?? 'easier';
  const band = estimateBand(c1 + c2, route);
  const byDomain: Record<string, { correct: number; total: number }> = {};
  for (const r of [...r1, ...r2]) {
    const d = r.it.domain;
    byDomain[d] = byDomain[d] ?? { correct: 0, total: 0 };
    byDomain[d].total++;
    if (r.correct) byDomain[d].correct++;
  }
  const [saved, setSaved] = useState(!!st.saved);
  useEffect(() => {
    if (saved) return;
    setSaved(true);
    (async () => {
      await db.mocks.add({ at: Date.now(), module1Correct: c1, module2Correct: c2, module2Level: route, total: c1 + c2, bandLow: band.low, bandHigh: band.high, byDomain });
      for (const r of [...r1, ...r2]) {
        const g = getGenerator(r.it.generatorId)!;
        await recordQuestionAttempt(
          r.q,
          { correct: r.correct, timeMs: 0, hintsUsed: 0, sawSolution: false, userAnswer: answerText(r.q, r.inp), errorType: r.inp.length ? 'methode' : 'temps', grade: r.correct ? 3 : 1 },
          { source: 'mock', subject: 'sat', skill: g.skill, generatorTitle: g.title },
        );
      }
      localStorage.setItem(KEY, JSON.stringify({ ...st, saved: true }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="space-y-4">
      <PageTitle>Mock test results</PageTitle>
      <Card>
        <div className="text-3xl font-bold">
          {band.low}–{band.high}
        </div>
        <p className="text-sm text-amber-600 dark:text-amber-400">Rough estimate only — not an official SAT score.</p>
        <p className="mt-2 text-sm">
          Module 1: {c1}/{st.m1.length} · Module 2 ({route}): {c2}/{st.m2.length}
        </p>
        <ul className="mt-2 space-y-0.5 text-sm">
          {(Object.keys(byDomain) as SatDomainId[]).map((d) => (
            <li key={d}>
              {SAT_DOMAINS[d]}: {byDomain[d].correct}/{byDomain[d].total}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">Wrong answers were added to your mistakes log.</p>
        <Button className="mt-3" onClick={onReset}>
          Close
        </Button>
      </Card>
      {[...r1.map((r, i) => ({ ...r, label: `M1 · Q${i + 1}` })), ...r2.map((r, i) => ({ ...r, label: `M2 · Q${i + 1}` }))].map((r) => (
        <details key={r.label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <summary className="cursor-pointer text-sm">
            {r.correct ? '✅' : '❌'} {r.label} · {SAT_SKILL_BY_ID[getGenerator(r.it.generatorId)!.skill].title} · {r.it.difficulty}
          </summary>
          <div className="mt-2 space-y-2 text-sm">
            <Md text={r.q.prompt} />
            {r.q.figure && <FigureView figure={r.q.figure} />}
            <p>Your answer: {answerText(r.q, r.inp) || '—'}</p>
            <div>
              Answer: <Md text={r.q.answerDisplay} className="inline-block" />
            </div>
            <ol className="ml-5 list-decimal">
              {r.q.solution.map((s, i) => (
                <li key={i}>
                  <Md text={s} />
                </li>
              ))}
            </ol>
          </div>
        </details>
      ))}
    </div>
  );
}
