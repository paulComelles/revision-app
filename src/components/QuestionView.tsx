import { useEffect, useMemo, useRef, useState } from 'react';
import type { Question } from '../generators/types';
import { checkQuestion, type CheckResult } from '../generators/check';
import { gradeFromOutcome, type Grade4 } from '../lib/srs';
import { parseSpr, sprAcceptedForms } from '../lib/spr';
import { exprToTex } from '../lib/expr';
import { ERROR_TYPE_IDS, ERROR_TYPES, type ErrorType } from '../types';
import { Md, Tex } from './Md';
import { Button, Chip, inputCls } from './ui';
import { FigureView } from './FigureView';

export interface QuestionOutcome {
  correct: boolean;
  timeMs: number;
  hintsUsed: number;
  sawSolution: boolean;
  userAnswer: string;
  errorType?: ErrorType;
  grade: Grade4;
  overTime: boolean;
}

const T = {
  fr: {
    submit: 'Valider',
    hint1: 'Indice 1 · notion',
    hint2: 'Indice 2 · première étape',
    hint3: 'Indice 3 · solution guidée',
    hidden: '(dernière étape masquée jusqu’à la validation)',
    correct: 'Juste !',
    wrong: 'Faux',
    answer: 'Réponse',
    solution: 'Solution',
    next: 'Continuer',
    errType: 'Type d’erreur',
    timeUp: 'Temps écoulé',
    accepted: 'Formes acceptées',
    preview: 'Lu comme',
    your: 'Ta réponse',
  },
  en: {
    submit: 'Submit',
    hint1: 'Hint 1 · concept',
    hint2: 'Hint 2 · first step',
    hint3: 'Hint 3 · worked solution',
    hidden: '(last step hidden until you submit)',
    correct: 'Correct!',
    wrong: 'Incorrect',
    answer: 'Answer',
    solution: 'Solution',
    next: 'Continue',
    errType: 'Mistake type',
    timeUp: "Time's up",
    accepted: 'Accepted entries',
    preview: 'Read as',
    your: 'Your answer',
  },
};

function fmtClock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function useElapsed(running: boolean) {
  const start = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);
  return { elapsedMs: now - start.current, startedAt: start.current };
}

interface Props {
  question: Question;
  onComplete: (o: QuestionOutcome) => void;
  /** countdown (timed exercise) */
  timeLimitSec?: number;
  /** hide hints (mock-like drills) */
  noHints?: boolean;
  compact?: boolean;
  /** label shown above the prompt */
  header?: React.ReactNode;
}

export function QuestionView({ question: q, onComplete, timeLimitSec, noHints, compact, header }: Props) {
  const t = T[q.lang];
  const [inputs, setInputs] = useState<string[]>([]);
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [message, setMessage] = useState<string | undefined>();
  const [errorType, setErrorType] = useState<ErrorType | undefined>();
  const [finalMs, setFinalMs] = useState<number | null>(null);
  const { elapsedMs } = useElapsed(result === null);
  const elapsed = finalMs ?? elapsedMs;
  const overTime = timeLimitSec !== undefined && elapsed > timeLimitSec * 1000;

  const submit = () => {
    if (result) return;
    const r = checkQuestion(q, inputs);
    if (!r.valid) {
      setMessage(r.message);
      return;
    }
    setMessage(undefined);
    setResult(r);
    setFinalMs(elapsedMs);
    if (!r.correct) {
      const guess: ErrorType = (r.distractorError as ErrorType | undefined) ?? (overTime ? 'temps' : 'methode');
      setErrorType(guess);
    }
  };

  const finish = () => {
    if (!result) return;
    const sawSolution = hints >= 3;
    const timeMs = finalMs ?? elapsedMs;
    const grade = gradeFromOutcome({
      correct: result.correct,
      hintsUsed: Math.min(hints, 2),
      sawSolution,
      timeMs,
      targetMs: (timeLimitSec ?? q.targetSec) * 1000,
    });
    onComplete({
      correct: result.correct,
      timeMs,
      hintsUsed: Math.min(hints, 2),
      sawSolution,
      userAnswer: answerText(q, inputs),
      errorType: result.correct ? undefined : errorType,
      grade: result.correct && overTime ? (Math.min(grade, 2) as Grade4) : grade,
      overTime,
    });
  };

  return (
    <div className={`space-y-4 ${compact ? 'text-[15px]' : ''}`}>
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="min-w-0 truncate">{header}</div>
        <div className={`shrink-0 font-mono ${overTime ? 'font-bold text-red-500' : ''}`}>
          {timeLimitSec !== undefined ? (overTime ? t.timeUp : fmtClock(timeLimitSec - elapsed / 1000)) : fmtClock(elapsed / 1000)}
        </div>
      </div>

      <Md text={q.prompt} className="text-base" />
      {q.figure && <FigureView figure={q.figure} />}

      <AnswerInput q={q} inputs={inputs} setInputs={setInputs} disabled={!!result} result={result} onEnter={submit} />

      {message && <p className="text-sm text-amber-600 dark:text-amber-400">{message}</p>}

      {!result && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={submit} size="lg" className="min-w-32">
            {t.submit}
          </Button>
          {!noHints && hints < 3 && (
            <Button variant="ghost" onClick={() => setHints((h) => h + 1)}>
              💡 {[t.hint1, t.hint2, t.hint3][hints]}
            </Button>
          )}
        </div>
      )}

      {!noHints && hints > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm dark:border-amber-800/60 dark:bg-amber-950/30">
          <div>
            <span className="font-semibold">💡 1.</span> <Md text={q.hints[0]} className="inline" />
          </div>
          {hints > 1 && (
            <div>
              <span className="font-semibold">💡 2.</span> <Md text={q.hints[1]} className="inline" />
            </div>
          )}
          {hints > 2 && !result && (
            <div>
              <span className="font-semibold">💡 3.</span>
              <ol className="ml-5 list-decimal">
                {q.solution.slice(0, -1).map((s, i) => (
                  <li key={i}>
                    <Md text={s} />
                  </li>
                ))}
              </ol>
              <p className="text-xs italic text-slate-500">{t.hidden}</p>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div
            className={`rounded-lg p-3 ${result.correct ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200' : 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200'}`}
          >
            <div className="font-semibold">{result.correct ? `✓ ${t.correct}` : `✗ ${t.wrong}`}</div>
            <div className="mt-1 text-sm">
              {t.answer} : <Md text={q.answerDisplay} className="inline-block align-middle" />
            </div>
            {q.answer.kind === 'spr' && (
              <div className="mt-1 text-xs opacity-80">
                {t.accepted} : {sprAcceptedForms(q.answer.values[0]).join(', ')}
              </div>
            )}
          </div>
          <details open={!result.correct} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
            <summary className="cursor-pointer font-medium">{t.solution}</summary>
            <ol className="mt-2 ml-5 list-decimal space-y-1">
              {q.solution.map((s, i) => (
                <li key={i}>
                  <Md text={s} />
                </li>
              ))}
            </ol>
          </details>
          {!result.correct && (
            <div>
              <div className="mb-1 text-sm font-medium">{t.errType}</div>
              <div className="flex flex-wrap gap-1.5">
                {ERROR_TYPE_IDS.map((e) => (
                  <Chip key={e} active={errorType === e} onClick={() => setErrorType(e)}>
                    {ERROR_TYPES[e][q.lang]}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          <Button onClick={finish} size="lg" variant={result.correct ? 'success' : 'primary'} className="w-full sm:w-auto">
            {t.next} →
          </Button>
        </div>
      )}
    </div>
  );
}

export function answerText(q: Question, inputs: string[]): string {
  if (q.answer.kind === 'mcq') {
    const i = Number(inputs[0]);
    return Number.isInteger(i) && q.answer.choices[i] ? `${String.fromCharCode(65 + i)}. ${q.answer.choices[i].text}` : '';
  }
  return inputs.join(' ; ');
}

const KEYS_EXPR = ['^', '(', ')', 'e^(', 'ln(', '√(', '/'];
const KEYS_NUM = [',', '/', '-', 'ln(', '√(', 'e^('];
const KEYS_SPR = ['/', '-', '.'];

export function AnswerInput({
  q,
  inputs,
  setInputs,
  disabled,
  result,
  onEnter,
}: {
  q: Question;
  inputs: string[];
  setInputs: (v: string[]) => void;
  disabled: boolean;
  result: CheckResult | null;
  onEnter: () => void;
}) {
  const a = q.answer;
  const set = (i: number, v: string) => {
    const next = inputs.slice();
    next[i] = v;
    setInputs(next);
  };
  if (a.kind === 'mcq') {
    const chosen = inputs[0] === undefined ? -1 : Number(inputs[0]);
    return (
      <div className="space-y-2">
        {a.choices.map((c, i) => {
          const isChosen = chosen === i;
          const showRight = result && i === a.correct;
          const showWrong = result && isChosen && i !== a.correct;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => set(0, String(i))}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                showRight
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                  : showWrong
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
                    : isChosen
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                      : 'border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${isChosen ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-400'}`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <Md text={c.text} className="min-w-0 flex-1 [&>p]:m-0" />
            </button>
          );
        })}
      </div>
    );
  }
  if (a.kind === 'spr') return <SprInput value={inputs[0] ?? ''} onChange={(v) => set(0, v)} disabled={disabled} onEnter={onEnter} />;
  if (a.kind === 'fields' || a.kind === 'custom') {
    const fields = a.fields;
    const matrix = a.kind === 'fields' && a.layout === 'matrix';
    return (
      <div className={matrix ? `inline-grid gap-2` : 'grid gap-2 sm:grid-cols-2'} style={matrix ? { gridTemplateColumns: `repeat(${a.cols ?? 2}, minmax(4rem, 6rem))` } : undefined}>
        {fields.map((f, i) => (
          <label key={i} className="block">
            {!matrix && <span className="mb-1 block text-sm"><Md text={f.label} className="inline [&>p]:inline" /></span>}
            <input
              className={`${inputCls} ${matrix ? 'text-center' : ''}`}
              value={inputs[i] ?? ''}
              disabled={disabled}
              aria-label={f.label}
              placeholder={matrix ? f.label.replace(/\$/g, '') : ''}
              inputMode="text"
              autoComplete="off"
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onEnter()}
            />
          </label>
        ))}
      </div>
    );
  }
  const isExpr = a.kind === 'expr';
  const keys = isExpr ? KEYS_EXPR.concat(a.variable) : a.kind === 'limit' ? ['+inf', '-inf', ',', '/', '-'] : KEYS_NUM;
  const value = inputs[0] ?? '';
  const preview = isExpr && value.trim() ? exprToTex(value) : null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          className={inputCls}
          value={value}
          disabled={disabled}
          placeholder={isExpr ? `ex. 2${a.variable}e^(${a.variable}) + 1` : a.kind === 'limit' ? 'ex. 3, +inf, -inf' : 'ex. 2,5 ou 5/2'}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => set(0, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        />
        {a.kind === 'number' && a.unit && <span className="shrink-0 text-sm">{a.unit}</span>}
      </div>
      {!disabled && (
        <div className="flex flex-wrap gap-1">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              className="rounded border border-slate-300 px-2.5 py-1 font-mono text-sm dark:border-slate-700"
              onClick={() => set(0, value + k)}
            >
              {k}
            </button>
          ))}
          <button type="button" className="rounded border border-slate-300 px-2.5 py-1 text-sm dark:border-slate-700" onClick={() => set(0, value.slice(0, -1))}>
            ⌫
          </button>
        </div>
      )}
      {isExpr && value.trim() && (
        <div className="text-sm text-slate-500">
          Lu comme : {preview ? <Tex tex={preview} /> : <span className="text-amber-600">expression incomplète</span>}
        </div>
      )}
    </div>
  );
}

export function SprInput({ value, onChange, disabled, onEnter }: { value: string; onChange: (v: string) => void; disabled?: boolean; onEnter?: () => void }) {
  const parsed = useMemo(() => (value.trim() ? parseSpr(value) : null), [value]);
  const max = value.trim().startsWith('-') ? 6 : 5;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          className={`${inputCls} max-w-48 font-mono text-lg tracking-wider`}
          value={value}
          disabled={disabled}
          placeholder="answer"
          autoComplete="off"
          inputMode="decimal"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        />
        <span className={`text-xs ${value.trim().length > max ? 'text-red-500' : 'text-slate-500'}`}>
          {value.trim().length}/{max}
        </span>
      </div>
      {!disabled && (
        <div className="flex gap-1">
          {KEYS_SPR.map((k) => (
            <button key={k} type="button" className="rounded border border-slate-300 px-3 py-1 font-mono dark:border-slate-700" onClick={() => onChange(value + k)}>
              {k}
            </button>
          ))}
          <button type="button" className="rounded border border-slate-300 px-3 py-1 dark:border-slate-700" onClick={() => onChange(value.slice(0, -1))}>
            ⌫
          </button>
        </div>
      )}
      {parsed && !parsed.ok && <p className="text-xs text-amber-600 dark:text-amber-400">{parsed.message}</p>}
    </div>
  );
}
