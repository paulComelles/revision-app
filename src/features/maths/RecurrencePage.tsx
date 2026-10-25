import { useMemo, useState } from 'react';
import { buildProof, proofLines, recurrenceBlanks, type RecProof } from '../../generators/maths/recurrence';
import { recordQuestionAttempt } from '../../db/repo';
import { createRng, randomSeed } from '../../lib/rng';
import { Md } from '../../components/Md';
import { Banner, Button, Card, Chip, inputCls, PageTitle } from '../../components/ui';
import { ExerciseRunner } from '../review/ExerciseRunner';
import { GradeButtons } from '../review/GradeButtons';
import type { Grade4 } from '../../lib/srs';

type Mode = 'order' | 'blanks' | 'write';
type Diff = 'easy' | 'medium' | 'hard';

const showBlanks = (s: string) => s.replace(/\[\[(\d+)\]\]/g, '▢');
const fillBlanks = (s: string, p: RecProof) => s.replace(/\[\[(\d+)\]\]/g, (_, i) => `$${p.blanks.find((b) => b.id === Number(i))!.tex}$`);

async function record(seed: number, d: Diff, correct: boolean, grade: Grade4, startedAt: number, userAnswer: string) {
  const q = recurrenceBlanks.generate(seed, d, 'input');
  await recordQuestionAttempt(
    q,
    { correct, timeMs: Date.now() - startedAt, hintsUsed: 0, sawSolution: false, userAnswer, errorType: correct ? undefined : 'methode', grade },
    { source: 'practice', subject: 'maths', skill: 'maths-suites', chapterId: 'maths-suites', generatorTitle: recurrenceBlanks.title },
  );
}

export function RecurrencePage() {
  const [mode, setMode] = useState<Mode>('order');
  const [diff, setDiff] = useState<Diff>('easy');
  const [seed, setSeed] = useState(randomSeed);
  const next = () => setSeed(randomSeed());
  return (
    <div className="space-y-3">
      <PageTitle sub="Initialisation · Hérédité · En effet · Conclusion">Récurrence</PageTitle>
      <div className="flex flex-wrap gap-1.5">
        {(['order', 'blanks', 'write'] as Mode[]).map((m_) => (
          <Chip key={m_} active={mode === m_} onClick={() => setMode(m_)}>
            {{ order: 'Remettre dans l’ordre', blanks: 'Compléter les trous', write: 'Rédiger seul' }[m_]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(['easy', 'medium', 'hard'] as Diff[]).map((d) => (
          <Chip
            key={d}
            active={diff === d}
            onClick={() => {
              setDiff(d);
              next();
            }}
          >
            {{ easy: 'Facile', medium: 'Moyen', hard: 'Difficile' }[d]}
          </Chip>
        ))}
      </div>
      <Card>
        {mode === 'order' && <OrderMode key={`${seed}-${diff}`} seed={seed} diff={diff} onNext={next} />}
        {mode === 'blanks' && (
          <ExerciseRunner key={`${seed}-${diff}`} spec={{ generatorId: 'maths-recurrence', seed, difficulty: diff, format: 'input' }} source="practice" onDone={next} />
        )}
        {mode === 'write' && <WriteMode key={`${seed}-${diff}`} seed={seed} diff={diff} onNext={next} />}
      </Card>
    </div>
  );
}

function OrderMode({ seed, diff, onNext }: { seed: number; diff: Diff; onNext: () => void }) {
  const proof = useMemo(() => buildProof(seed, diff), [seed, diff]);
  const lines = useMemo(() => proofLines(proof), [proof]);
  const shuffled = useMemo(() => createRng(seed).shuffle(lines.map((_, i) => i)), [lines, seed]);
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [start] = useState(Date.now);
  const correct = picked.every((v, i) => v === i) && picked.length === lines.length;
  const check = async () => {
    setChecked(true);
    await record(seed, diff, correct, correct ? 3 : 1, start, picked.join(','));
  };
  return (
    <div className="space-y-3">
      <Md text={`Montre par récurrence que pour tout entier $n \\ge ${proof.n0}$ : $${proof.statement}$.`} />
      <p className="text-sm text-slate-500">Touche les lignes dans l’ordre de la preuve.</p>
      <ol className="space-y-1.5">
        {picked.map((i, k) => (
          <li
            key={i}
            className={`rounded-lg border p-2 text-sm ${checked ? (i === k ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30') : 'border-blue-400'}`}
          >
            <span className="mr-1 text-xs font-semibold text-slate-500">{checked ? lines[i].section : `${k + 1}.`}</span>
            <Md text={showBlanks(lines[i].text)} className="inline [&>p]:inline" />
          </li>
        ))}
      </ol>
      {!checked && (
        <div className="space-y-1.5">
          {shuffled
            .filter((i) => !picked.includes(i))
            .map((i) => (
              <button key={i} type="button" onClick={() => setPicked((p) => [...p, i])} className="block w-full rounded-lg border border-slate-300 p-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <Md text={showBlanks(lines[i].text)} className="[&>p]:m-0" />
              </button>
            ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!checked && (
          <>
            <Button onClick={check} disabled={picked.length !== lines.length}>
              Vérifier
            </Button>
            <Button variant="ghost" onClick={() => setPicked((p) => p.slice(0, -1))} disabled={!picked.length}>
              ↶ Annuler
            </Button>
          </>
        )}
        {checked && (
          <>
            <Banner tone={correct ? 'ok' : 'error'}>{correct ? 'Bon ordre ✓' : 'Ordre incorrect : voici la preuve complète.'}</Banner>
            <Button onClick={onNext}>Nouvelle preuve →</Button>
          </>
        )}
      </div>
      {checked && !correct && <ModelProof proof={proof} />}
    </div>
  );
}

function ModelProof({ proof }: { proof: RecProof }) {
  return (
    <div className="space-y-2 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800/60">
      {proof.sections.map((s) => (
        <div key={s.title}>
          <div className="font-semibold">{s.title}</div>
          {s.lines.map((l, i) => (
            <Md key={i} text={fillBlanks(l, proof)} />
          ))}
        </div>
      ))}
    </div>
  );
}

function WriteMode({ seed, diff, onNext }: { seed: number; diff: Diff; onNext: () => void }) {
  const proof = useMemo(() => buildProof(seed, diff), [seed, diff]);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'write' | 'check' | 'done'>('write');
  const [ticks, setTicks] = useState<boolean[]>(() => proof.checklist.map(() => false));
  const [start] = useState(Date.now);
  return (
    <div className="space-y-3">
      <Md text={`Montre par récurrence que pour tout entier $n \\ge ${proof.n0}$ : $${proof.statement}$.`} />
      <textarea
        className={`${inputCls} min-h-48 text-sm`}
        placeholder={'Initialisation : …\nHérédité : …\nEn effet : …\nConclusion : …'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={phase !== 'write'}
      />
      {phase === 'write' && <Button onClick={() => setPhase('check')}>J’ai fini : comparer</Button>}
      {phase !== 'write' && (
        <>
          <ModelProof proof={proof} />
          <div className="space-y-1.5">
            <div className="text-sm font-semibold">Auto-vérification</div>
            {proof.checklist.map((c, i) => (
              <label key={i} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600" checked={ticks[i]} onChange={(e) => setTicks((t) => t.map((x, j) => (j === i ? e.target.checked : x)))} />
                {c}
              </label>
            ))}
          </div>
          {phase === 'check' ? (
            <>
              <p className="text-sm">Ta preuve était :</p>
              <GradeButtons
                onGrade={async (g) => {
                  await record(seed, diff, g >= 3, g, start, text.slice(0, 500));
                  setPhase('done');
                }}
                labels={{ 1: 'Ratée', 2: 'Bancale', 3: 'Correcte', 4: 'Parfaite' }}
              />
            </>
          ) : (
            <Button onClick={onNext}>Nouvelle preuve →</Button>
          )}
        </>
      )}
    </div>
  );
}
