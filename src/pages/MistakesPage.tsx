import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import { deleteMistake, logMistake, uid } from '../db/repo';
import { useChapters } from '../hooks';
import { compressImage } from '../lib/image';
import { ERROR_TYPE_IDS, ERROR_TYPES, SUBJECT_IDS, SUBJECTS, type ErrorType, type Mistake, type SubjectId } from '../types';
import { Badge, Banner, Button, Card, Chip, Empty, Field, inputCls, PageTitle } from '../components/ui';
import { Md } from '../components/Md';
import { PhotoView } from '../components/PhotoView';
import { getGenerator } from '../generators';
import { formatDateFr } from '../lib/dates';

type Filter = 'active' | 'resolved' | 'all';

export function MistakesPage() {
  const mistakesQ = useLiveQuery(() => db.mistakes.orderBy('createdAt').reverse().toArray(), []);
  const mistakes = useMemo(() => mistakesQ ?? [], [mistakesQ]);
  const [filter, setFilter] = useState<Filter>('active');
  const [subject, setSubject] = useState<SubjectId | 'all'>('all');
  const [etype, setEtype] = useState<ErrorType | 'all'>('all');
  const [adding, setAdding] = useState(false);

  const list = mistakes.filter(
    (m) =>
      (filter === 'all' || (filter === 'active' ? !m.resolved : m.resolved)) &&
      (subject === 'all' || m.subject === subject) &&
      (etype === 'all' || m.errorType === etype),
  );
  const byType = useMemo(() => {
    const c: Partial<Record<ErrorType, number>> = {};
    for (const m of mistakes) if (!m.resolved) c[m.errorType] = (c[m.errorType] ?? 0) + 1;
    return c;
  }, [mistakes]);
  const activeCount = mistakes.filter((m) => !m.resolved).length;

  return (
    <div className="space-y-4">
      <PageTitle
        sub={`${activeCount} erreur(s) à retravailler · elles reviennent automatiquement dans tes révisions`}
        action={<Button onClick={() => setAdding((a) => !a)}>{adding ? 'Fermer' : '+ Ajouter'}</Button>}
      >
        Carnet d’erreurs
      </PageTitle>

      {adding && <AddMistake onDone={() => setAdding(false)} />}

      {activeCount > 0 && (
        <Card title="Par type d’erreur">
          <div className="space-y-1.5">
            {ERROR_TYPE_IDS.map((e) => {
              const n = byType[e] ?? 0;
              return (
                <div key={e} className="flex items-center gap-2 text-sm">
                  <span className="w-36 shrink-0">{ERROR_TYPES[e].fr}</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-red-500" style={{ width: `${(n / activeCount) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs">{n}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(['active', 'resolved', 'all'] as Filter[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {{ active: 'À retravailler', resolved: 'Résolues', all: 'Toutes' }[f]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <select className={`${inputCls} w-auto`} value={subject} onChange={(e) => setSubject(e.target.value as SubjectId | 'all')}>
          <option value="all">Toutes matières</option>
          {SUBJECT_IDS.map((s) => (
            <option key={s} value={s}>
              {SUBJECTS[s].label}
            </option>
          ))}
        </select>
        <select className={`${inputCls} w-auto`} value={etype} onChange={(e) => setEtype(e.target.value as ErrorType | 'all')}>
          <option value="all">Tous types</option>
          {ERROR_TYPE_IDS.map((e) => (
            <option key={e} value={e}>
              {ERROR_TYPES[e].fr}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? <Empty>Aucune erreur ici. Chaque mauvaise réponse est ajoutée automatiquement.</Empty> : list.map((m) => <MistakeRow key={m.id} m={m} />)}
    </div>
  );
}

function MistakeRow({ m }: { m: Mistake }) {
  const [open, setOpen] = useState(false);
  const g = m.generatorId ? getGenerator(m.generatorId) : undefined;
  const lang = SUBJECTS[m.subject].lang;
  return (
    <Card className="p-3">
      <button type="button" className="flex w-full items-start gap-2 text-left" onClick={() => setOpen((o) => !o)}>
        <Badge color={SUBJECTS[m.subject].color}>{SUBJECTS[m.subject].short}</Badge>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">
            {g?.title ?? (m.qbId ? 'College Board Question Bank' : 'Erreur notée')}
            {m.resolved && <span className="ml-2 text-xs text-emerald-600">✓ résolue</span>}
          </div>
          <div className="text-xs text-slate-500">
            {formatDateFr(m.createdAt)} · {ERROR_TYPES[m.errorType].fr} · {m.origin === 'auto' ? 'auto' : 'manuel'}
          </div>
        </div>
        <span className="text-slate-400">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
          <Md text={m.prompt} className="text-sm" />
          {m.photoId && <PhotoView id={m.photoId} />}
          {m.userAnswer && (
            <p className="text-sm">
              <span className="text-slate-500">{lang === 'en' ? 'Your answer' : 'Ta réponse'} :</span> {m.userAnswer}
            </p>
          )}
          {m.correctAnswer && (
            <div className="text-sm">
              <span className="text-slate-500">{lang === 'en' ? 'Answer' : 'Réponse'} :</span> <Md text={m.correctAnswer} className="inline-block" />
            </div>
          )}
          <div>
            <div className="mb-1 text-xs text-slate-500">Type d’erreur</div>
            <div className="flex flex-wrap gap-1">
              {ERROR_TYPE_IDS.map((e) => (
                <Chip key={e} active={m.errorType === e} onClick={() => db.mistakes.update(m.id, { errorType: e })}>
                  {ERROR_TYPES[e].fr}
                </Chip>
              ))}
            </div>
          </div>
          <textarea
            className={`${inputCls} text-sm`}
            rows={2}
            placeholder="Note (ce qu’il faut retenir)…"
            defaultValue={m.note}
            onBlur={(e) => db.mistakes.update(m.id, { note: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            {g && m.seed !== undefined && (
              <>
                <Link className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white" to={`/pratique/${g.id}?d=${m.difficulty}&f=${m.format}&mistake=${m.id}`}>
                  Question similaire
                </Link>
                <Link
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm dark:bg-slate-800"
                  to={`/pratique/${g.id}?d=${m.difficulty}&f=${m.format}&seed=${m.seed}&mistake=${m.id}`}
                >
                  Question exacte
                </Link>
              </>
            )}
            <Button size="sm" variant="secondary" onClick={() => db.mistakes.update(m.id, { resolved: !m.resolved })}>
              {m.resolved ? 'Remettre à retravailler' : 'Marquer résolue'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm('Supprimer cette erreur ?')) void deleteMistake(m.id);
              }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function AddMistake({ onDone }: { onDone: () => void }) {
  const [subject, setSubject] = useState<SubjectId>('maths');
  const chapters = useChapters(subject);
  const [chapterId, setChapterId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');
  const [etype, setEtype] = useState<ErrorType>('methode');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!prompt.trim() && !photo) {
      setErr('Décris l’exercice ou ajoute une photo.');
      return;
    }
    setBusy(true);
    let photoId: string | undefined;
    if (photo) {
      photoId = uid('p');
      await db.photos.put({ id: photoId, blob: photo, createdAt: Date.now() });
    }
    await logMistake({
      subject,
      chapterId: chapterId || undefined,
      origin: 'manual',
      prompt: prompt.trim() || '(voir photo)',
      correctAnswer: answer.trim() || undefined,
      note: note.trim() || undefined,
      errorType: etype,
      photoId,
      title: chapters.find((c) => c.id === chapterId)?.title ?? SUBJECTS[subject].label,
    });
    setBusy(false);
    onDone();
  };

  return (
    <Card title="Nouvelle erreur (devoir, contrôle…)">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Matière">
            <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value as SubjectId)}>
              {SUBJECT_IDS.map((s) => (
                <option key={s} value={s}>
                  {SUBJECTS[s].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Chapitre (optionnel)">
            <select className={inputCls} value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
              <option value="">—</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Énoncé / ce que tu as raté" hint="Markdown et $maths$ acceptés.">
          <textarea className={inputCls} rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </Field>
        <Field label="Bonne réponse / correction (optionnel)">
          <textarea className={inputCls} rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </Field>
        <Field label="Note (optionnel)">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div>
          <div className="mb-1 text-sm font-medium">Type d’erreur</div>
          <div className="flex flex-wrap gap-1">
            {ERROR_TYPE_IDS.map((e) => (
              <Chip key={e} active={etype === e} onClick={() => setEtype(e)}>
                {ERROR_TYPES[e].fr}
              </Chip>
            ))}
          </div>
        </div>
        <Field label="Photo (optionnel, compressée et gardée sur l’appareil)">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="text-sm"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setPhoto(await compressImage(f));
                setErr('');
              } catch (x) {
                setErr((x as Error).message);
              }
            }}
          />
        </Field>
        {photo && <p className="text-xs text-slate-500">Photo prête ({Math.round(photo.size / 1024)} Ko)</p>}
        {err && <Banner tone="error">{err}</Banner>}
        <Button onClick={save} disabled={busy}>
          Enregistrer
        </Button>
      </div>
    </Card>
  );
}
