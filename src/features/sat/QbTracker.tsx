import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { SAT_SKILLS, SAT_SKILL_BY_ID } from '../../generators/sat/skills';
import { ERROR_TYPE_IDS, ERROR_TYPES, type ErrorType, type QbEntry, type QbResult } from '../../types';
import { Banner, Button, Card, Chip, Field, inputCls, PageTitle } from '../../components/ui';
import { addQbEntries, deleteQbEntry, setQbResult } from './qbRepo';

const RESULT_LABEL: Record<QbResult, string> = { right: '✓ Right', wrong: '✗ Wrong', reviewed: '👁 Reviewed', todo: '· To do' };
type Diff = QbEntry['difficulty'];

export function QbTracker() {
  const entriesQ = useLiveQuery(() => db.qb.orderBy('pdf').toArray(), []);
  const entries = useMemo(() => entriesQ ?? [], [entriesQ]);
  const [tab, setTab] = useState<'list' | 'add' | 'bulk' | 'stats'>('list');
  const pdfs = [...new Set(entries.map((e) => e.pdf))];
  return (
    <div className="space-y-4">
      <PageTitle sub="Log the questions from your College Board Question Bank PDFs. Wrong ones are scheduled for re-attempts.">Question Bank tracker</PageTitle>
      <div className="flex flex-wrap gap-1.5">
        {(['list', 'add', 'bulk', 'stats'] as const).map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {{ list: `Questions · ${entries.length}`, add: '+ One question', bulk: '+ Bulk add', stats: 'Stats per skill' }[t]}
          </Chip>
        ))}
      </div>
      {tab === 'add' && <AddOne pdfs={pdfs} onDone={() => setTab('list')} />}
      {tab === 'bulk' && <BulkAdd pdfs={pdfs} onDone={() => setTab('list')} />}
      {tab === 'stats' && <Stats entries={entries} />}
      {tab === 'list' && <List entries={entries} pdfs={pdfs} />}
    </div>
  );
}

function SkillSelect({ value, onChange, allowEmpty }: { value: string; onChange: (v: string) => void; allowEmpty?: boolean }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty && <option value="">Skill not set yet</option>}
      {SAT_SKILLS.map((s) => (
        <option key={s.id} value={s.id}>
          {s.title}
        </option>
      ))}
    </select>
  );
}

function DiffSelect({ value, onChange }: { value: Diff; onChange: (v: Diff) => void }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as Diff)}>
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>
  );
}

function AddOne({ pdfs, onDone }: { pdfs: string[]; onDone: () => void }) {
  const [qid, setQid] = useState('');
  const [pdf, setPdf] = useState(pdfs[0] ?? '');
  const [num, setNum] = useState('');
  const [skill, setSkill] = useState('');
  const [diff, setDiff] = useState<Diff>('hard');
  const [result, setResult] = useState<QbResult>('wrong');
  const [etype, setEtype] = useState<ErrorType>('methode');
  const [note, setNote] = useState('');
  const save = async () => {
    await addQbEntries([{ questionId: qid.trim(), pdf: pdf.trim() || 'PDF', number: num ? Number(num) : undefined, skill, difficulty: diff, result, errorType: result === 'wrong' ? etype : undefined, note: note.trim() || undefined }]);
    onDone();
  };
  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Question ID (as printed)">
          <input className={inputCls} value={qid} onChange={(e) => setQid(e.target.value)} placeholder="e.g. 3a1b2c4d" />
        </Field>
        <Field label="PDF name">
          <input className={inputCls} value={pdf} onChange={(e) => setPdf(e.target.value)} list="qb-pdfs" placeholder="e.g. Hard Algebra" />
          <datalist id="qb-pdfs">{pdfs.map((p) => <option key={p} value={p} />)}</datalist>
        </Field>
        <Field label="Number in the PDF (optional)">
          <input className={inputCls} inputMode="numeric" value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="Difficulty">
          <DiffSelect value={diff} onChange={setDiff} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Skill">
          <SkillSelect value={skill} onChange={setSkill} allowEmpty />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(['right', 'wrong', 'reviewed', 'todo'] as QbResult[]).map((r) => (
          <Chip key={r} active={result === r} onClick={() => setResult(r)}>
            {RESULT_LABEL[r]}
          </Chip>
        ))}
      </div>
      {result === 'wrong' && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ERROR_TYPE_IDS.map((e) => (
            <Chip key={e} active={etype === e} onClick={() => setEtype(e)}>
              {ERROR_TYPES[e].en}
            </Chip>
          ))}
        </div>
      )}
      <div className="mt-3">
        <Field label="Note">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <Button className="mt-3" onClick={save}>
        Save
      </Button>
    </Card>
  );
}

function BulkAdd({ pdfs, onDone }: { pdfs: string[]; onDone: () => void }) {
  const [pdf, setPdf] = useState('');
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState('103');
  const [skill, setSkill] = useState('');
  const [diff, setDiff] = useState<Diff>('hard');
  const [err, setErr] = useState('');
  const save = async () => {
    const a = Number(from);
    const b = Number(to);
    if (!pdf.trim()) return setErr('Give the PDF a name.');
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < a || b - a > 500) return setErr('Invalid range (max 500 questions at once).');
    const existing = new Set((await db.qb.where('pdf').equals(pdf.trim()).toArray()).map((e) => e.number));
    const rows = [];
    for (let n = a; n <= b; n++) if (!existing.has(n)) rows.push({ questionId: '', pdf: pdf.trim(), number: n, skill, difficulty: diff, result: 'todo' as const });
    await addQbEntries(rows);
    onDone();
  };
  return (
    <Card>
      <p className="mb-3 text-sm text-slate-500">Creates one entry per question number (already existing numbers are skipped). Then mark each one right / wrong / reviewed from the list.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="PDF name">
          <input className={inputCls} value={pdf} onChange={(e) => setPdf(e.target.value)} list="qb-pdfs2" placeholder="e.g. Hard questions" />
          <datalist id="qb-pdfs2">{pdfs.map((p) => <option key={p} value={p} />)}</datalist>
        </Field>
        <Field label="From #">
          <input className={inputCls} inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="To #">
          <input className={inputCls} inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value.replace(/\D/g, ''))} />
        </Field>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Skill (if the whole PDF is one skill)">
          <SkillSelect value={skill} onChange={setSkill} allowEmpty />
        </Field>
        <Field label="Difficulty">
          <DiffSelect value={diff} onChange={setDiff} />
        </Field>
      </div>
      {err && (
        <div className="mt-3">
          <Banner tone="error">{err}</Banner>
        </div>
      )}
      <Button className="mt-3" onClick={save}>
        Create {Math.max(0, Number(to) - Number(from) + 1) || 0} entries
      </Button>
    </Card>
  );
}

function List({ entries, pdfs }: { entries: QbEntry[]; pdfs: string[] }) {
  const [pdf, setPdf] = useState('');
  const [res, setRes] = useState<QbResult | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const list = entries
    .filter((e) => (!pdf || e.pdf === pdf) && (res === 'all' || e.result === res))
    .sort((a, b) => a.pdf.localeCompare(b.pdf) || (a.number ?? 0) - (b.number ?? 0));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <select className={`${inputCls} w-auto`} value={pdf} onChange={(e) => setPdf(e.target.value)}>
          <option value="">All PDFs</option>
          {pdfs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select className={`${inputCls} w-auto`} value={res} onChange={(e) => setRes(e.target.value as QbResult | 'all')}>
          <option value="all">All results</option>
          {(['todo', 'right', 'wrong', 'reviewed'] as QbResult[]).map((r) => (
            <option key={r} value={r}>
              {RESULT_LABEL[r]}
            </option>
          ))}
        </select>
      </div>
      {list.length === 0 && <p className="text-sm text-slate-500">No questions yet.</p>}
      {list.slice(0, 300).map((e) => (
        <div key={e.id} className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="min-w-0 flex-1 text-left text-sm" onClick={() => setOpen(open === e.id ? null : e.id)}>
              <span className="font-medium">
                {e.pdf} {e.number !== undefined && `#${e.number}`}
              </span>{' '}
              <span className="text-xs text-slate-500">
                {e.questionId && `ID ${e.questionId} · `}
                {SAT_SKILL_BY_ID[e.skill]?.title ?? 'skill not set'} · {e.difficulty}
              </span>
            </button>
            <div className="flex gap-1">
              {(['right', 'wrong', 'reviewed'] as QbResult[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  title={RESULT_LABEL[r]}
                  onClick={() => setQbResult(e, r)}
                  className={`h-8 w-8 rounded text-sm ${e.result === r ? (r === 'right' ? 'bg-emerald-600 text-white' : r === 'wrong' ? 'bg-red-600 text-white' : 'bg-sky-600 text-white') : 'border border-slate-300 dark:border-slate-700'}`}
                >
                  {r === 'right' ? '✓' : r === 'wrong' ? '✗' : '👁'}
                </button>
              ))}
            </div>
          </div>
          {open === e.id && (
            <div className="mt-2 space-y-2 border-t border-slate-200 pt-2 dark:border-slate-800">
              <div className="grid gap-2 sm:grid-cols-3">
                <input className={inputCls} placeholder="Question ID" defaultValue={e.questionId} onBlur={(x) => db.qb.update(e.id, { questionId: x.target.value.trim() })} />
                <SkillSelect value={e.skill} onChange={(v) => db.qb.update(e.id, { skill: v })} allowEmpty />
                <DiffSelect value={e.difficulty} onChange={(v) => db.qb.update(e.id, { difficulty: v })} />
              </div>
              {e.result === 'wrong' && (
                <div className="flex flex-wrap gap-1">
                  {ERROR_TYPE_IDS.map((t) => (
                    <Chip key={t} active={e.errorType === t} onClick={() => setQbResult(e, 'wrong', t)}>
                      {ERROR_TYPES[t].en}
                    </Chip>
                  ))}
                </div>
              )}
              <input className={inputCls} placeholder="Note" defaultValue={e.note} onBlur={(x) => db.qb.update(e.id, { note: x.target.value })} />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>History: {e.history.map((h) => `${new Date(h.at).toLocaleDateString('fr-FR')} ${h.result}`).join(' · ') || '—'}</span>
                <button
                  type="button"
                  className="text-red-500"
                  onClick={() => {
                    if (confirm('Delete this entry?')) void deleteQbEntry(e.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Stats({ entries }: { entries: QbEntry[] }) {
  const rows = SAT_SKILLS.map((s) => {
    const l = entries.filter((e) => e.skill === s.id);
    const right = l.filter((e) => e.result === 'right').length;
    const wrong = l.filter((e) => e.result === 'wrong').length;
    return { s, total: l.length, right, wrong, reviewed: l.filter((e) => e.result === 'reviewed').length, todo: l.filter((e) => e.result === 'todo').length };
  }).filter((r) => r.total > 0);
  const unset = entries.filter((e) => !e.skill).length;
  return (
    <Card>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-1">Skill</th>
                <th>✓</th>
                <th>✗</th>
                <th>👁</th>
                <th>To do</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.s.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="py-1 pr-2">{r.s.title}</td>
                  <td>{r.right}</td>
                  <td>{r.wrong}</td>
                  <td>{r.reviewed}</td>
                  <td>{r.todo}</td>
                  <td>{r.right + r.wrong ? `${Math.round((100 * r.right) / (r.right + r.wrong))} %` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {unset > 0 && <p className="mt-2 text-xs text-slate-500">{unset} question(s) without a skill (open them in the list to set it).</p>}
    </Card>
  );
}
