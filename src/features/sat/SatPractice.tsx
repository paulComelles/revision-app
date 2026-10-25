import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../db/db';
import { useSettings } from '../../hooks';
import { groupStats } from '../../lib/mastery';
import { createRng, randomSeed } from '../../lib/rng';
import { SAT_GENERATORS } from '../../generators/sat';
import { pickSat, type Pick } from '../../generators/sat/picker';
import { SAT_SKILL_BY_ID, SAT_SKILLS } from '../../generators/sat/skills';
import type { Difficulty } from '../../generators/types';
import { ExerciseRunner } from '../review/ExerciseRunner';
import { Button, Card, Chip, inputCls, PageTitle } from '../../components/ui';
import { DesmosButton } from './SatHome';
import { checkSpr, sprAcceptedForms } from '../../lib/spr';
import { frac, type Frac } from '../../lib/fraction';
import { Md } from '../../components/Md';

type Fmt = 'mixed' | 'mcq' | 'spr';

export function SatPractice({ sprTrainer = false }: { sprTrainer?: boolean }) {
  const [params, setParams] = useSearchParams();
  const settings = useSettings();
  const skill = params.get('skill') ?? '';
  const [fmt, setFmt] = useState<Fmt>(sprTrainer ? 'spr' : 'mixed');
  const [diff, setDiff] = useState<Difficulty | 'auto'>('auto');
  const [count, setCount] = useState({ done: 0, ok: 0 });
  const [nonce, setNonce] = useState(0);
  const [drill, setDrill] = useState(false);
  const attempts = useLiveQuery(() => db.attempts.where('subject').equals('sat').toArray(), []);
  // freeze stats per question so the pick doesn't change while answering
  const pick: Pick | null = useMemo(() => {
    if (!attempts) return null;
    const stats = groupStats(attempts, (a) => a.skill, Date.now());
    return pickSat(SAT_GENERATORS, stats, createRng(randomSeed()), { skill: skill || undefined, format: fmt, difficulty: diff, hardShare: settings.satHardShare });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, skill, fmt, diff, attempts === undefined]);
  const next = () => {
    setNonce((n) => n + 1);
    window.scrollTo({ top: 0 });
  };
  const sprSkills = SAT_SKILLS.filter((s) => SAT_GENERATORS.some((g) => g.skill === s.id && (fmt !== 'spr' || g.formats.includes('spr'))));
  return (
    <div className="space-y-3">
      <PageTitle sub={`${count.ok}/${count.done} correct this round`} action={<DesmosButton />}>
        {sprTrainer ? 'SPR trainer' : skill ? SAT_SKILL_BY_ID[skill]?.title : 'Adaptive practice'}
      </PageTitle>
      {sprTrainer && <SprRules drill={drill} setDrill={setDrill} />}
      {!drill && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {!sprTrainer &&
              (['mixed', 'mcq', 'spr'] as Fmt[]).map((f) => (
                <Chip key={f} active={fmt === f} onClick={() => setFmt(f)}>
                  {{ mixed: 'Mixed', mcq: 'Multiple choice', spr: 'SPR' }[f]}
                </Chip>
              ))}
            {(['auto', 'medium', 'hard'] as const).map((d) => (
              <Chip key={d} active={diff === d} onClick={() => setDiff(d)}>
                {{ auto: 'Auto level', medium: 'Medium', hard: 'Hard' }[d]}
              </Chip>
            ))}
          </div>
          <select className={`${inputCls} text-sm`} value={skill} onChange={(e) => setParams(e.target.value ? { skill: e.target.value } : {})}>
            <option value="">All skills (weighted to weak spots)</option>
            {sprSkills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <Card>
            {pick ? (
              <ExerciseRunner
                key={`${nonce}-${pick.generatorId}-${pick.seed}`}
                spec={pick}
                source={sprTrainer ? 'spr' : 'practice'}
                onDone={(o) => {
                  setCount((c) => ({ done: c.done + 1, ok: c.ok + (o.correct ? 1 : 0) }));
                  next();
                }}
              />
            ) : (
              <p className="text-sm text-slate-500">Loading…</p>
            )}
          </Card>
          <Button variant="ghost" size="sm" onClick={next}>
            Skip this question
          </Button>
        </>
      )}
    </div>
  );
}

const DRILL_VALUES: Frac[] = [frac(2, 3), frac(-1, 3), frac(7, 2), frac(1, 8), frac(100, 7), frac(-5, 4), frac(11, 6), frac(3, 40), frac(2500, 3), frac(-17, 9), frac(1, 16), frac(45, 7)];

function SprRules({ drill, setDrill }: { drill: boolean; setDrill: (v: boolean) => void }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * DRILL_VALUES.length));
  const [input, setInput] = useState('');
  const [res, setRes] = useState<null | { ok: boolean; msg?: string }>(null);
  const v = DRILL_VALUES[i];
  const decimalOnly = i % 2 === 1;
  return (
    <Card>
      <details>
        <summary className="cursor-pointer font-medium">SPR entry rules (digital SAT)</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Enter only one answer, even if several are correct.</li>
          <li>Up to 5 characters for a positive answer, 6 for a negative one (the minus sign counts).</li>
          <li>A fraction that doesn't fit must be entered as a decimal.</li>
          <li>A decimal that doesn't fit: truncate or round at the 4th digit — fill the space (2/3 → .6666, .6667, 0.666, 0.667; not 0.66).</li>
          <li>Mixed numbers: 3 1/2 → 7/2 or 3.5.</li>
          <li>No %, comma or $ symbols.</li>
        </ul>
      </details>
      <div className="mt-3 flex gap-2">
        <Chip active={!drill} onClick={() => setDrill(false)}>
          Questions
        </Chip>
        <Chip active={drill} onClick={() => setDrill(true)}>
          Entry-rules drill
        </Chip>
      </div>
      {drill && (
        <div className="mt-3 space-y-2">
          <Md text={`Enter the value $${v.n < 0 ? '-' : ''}\\frac{${Math.abs(v.n)}}{${v.d}}$ as a valid SPR answer${decimalOnly ? ' **using a decimal**' : ''}.`} />
          <div className="flex gap-2">
            <input className={`${inputCls} max-w-40 font-mono`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="answer" />
            <Button
              onClick={() => {
                const r = checkSpr(input, v);
                const isDecimal = /\./.test(input) && !input.includes('/');
                if (!r.valid) setRes({ ok: false, msg: r.message });
                else if (decimalOnly && !isDecimal) setRes({ ok: false, msg: 'Use a decimal this time.' });
                else setRes({ ok: r.correct, msg: r.correct ? undefined : 'Not accepted: a decimal must fill all available characters (truncate or round).' });
              }}
            >
              Check
            </Button>
          </div>
          {res && (
            <p className={`text-sm ${res.ok ? 'text-emerald-600' : 'text-red-500'}`}>
              {res.ok ? '✓ Accepted.' : `✗ ${res.msg ?? ''}`} Accepted entries: {sprAcceptedForms(v).join(', ')}
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setI((x) => (x + 1 + Math.floor(Math.random() * (DRILL_VALUES.length - 1))) % DRILL_VALUES.length);
              setInput('');
              setRes(null);
            }}
          >
            Next value
          </Button>
        </div>
      )}
    </Card>
  );
}
