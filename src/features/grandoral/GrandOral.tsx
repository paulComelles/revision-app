import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { logFocus, uid } from '../../db/repo';
import type { GrandOralContent } from '../../content/types';
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from '../../types';
import { Md } from '../../components/Md';
import { Banner, Button, Card, Empty, inputCls, PageTitle } from '../../components/ui';

/**
 * Grand oral phases — À VÉRIFIER against the official text before relying on
 * them. Edit here if the format changes.
 */
export const GRAND_ORAL_PHASES: { name: string; minutes: number; hint: string }[] = [
  { name: 'Préparation', minutes: 20, hint: 'Prépare ton support (tu pourras le remettre au jury).' },
  { name: 'Présentation de la question', minutes: 5, hint: 'Sans notes, debout : explique pourquoi tu as choisi la question, puis réponds-y.' },
  { name: 'Échange avec le jury', minutes: 10, hint: 'Questions du jury pour préciser et approfondir.' },
  { name: 'Projet d’orientation', minutes: 5, hint: 'Lien entre la question et ton projet de poursuite d’études.' },
];

function useRecorder() {
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.start();
      rec.current = r;
      started.current = Date.now();
      setRecording(true);
      setError(null);
    } catch {
      setError('Micro indisponible ou refusé (l’enregistrement reste sur ton appareil).');
    }
  };
  const stop = (label: string) =>
    new Promise<void>((resolve) => {
      const r = rec.current;
      if (!r) return resolve();
      r.onstop = async () => {
        r.stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' });
        await db.audio.put({ id: uid('a'), createdAt: Date.now(), blob, label, durationSec: Math.round((Date.now() - started.current) / 1000) });
        setRecording(false);
        resolve();
      };
      r.stop();
    });
  return { recording, error, start, stop };
}

function AudioRow({ id, label, at, sec }: { id: string; label: string; at: number; sec: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    db.audio.get(id).then((a) => {
      if (a) {
        u = URL.createObjectURL(a.blob);
        setUrl(u);
      }
    });
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);
  return (
    <li className="space-y-1 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
      <div className="flex justify-between gap-2">
        <span>
          {label} · {new Date(at).toLocaleDateString('fr-FR')} · {Math.floor(sec / 60)} min {sec % 60} s
        </span>
        <button type="button" className="text-xs text-red-500" onClick={() => confirm('Supprimer cet enregistrement ?') && db.audio.delete(id)}>
          Supprimer
        </button>
      </div>
      {url && <audio controls src={url} className="w-full" />}
    </li>
  );
}

export function GrandOralPage() {
  const questions = (useLiveQuery(() => db.content.where('type').equals('grand_oral').toArray(), []) ?? []) as GrandOralContent[];
  const audio = useLiveQuery(() => db.audio.orderBy('createdAt').reverse().toArray(), []) ?? [];
  const [q, setQ] = useState<GrandOralContent | null>(null);
  const [newQ, setNewQ] = useState('');
  const [subject, setSubject] = useState<SubjectId>('maths');
  if (q) return <Rehearsal question={q} onExit={() => setQ(null)} />;
  return (
    <div className="space-y-4">
      <PageTitle sub="Répétition chronométrée selon les phases de l’épreuve (durées à vérifier, modifiables dans le code de configuration)">Grand oral</PageTitle>
      <Card title="Mes questions">
        {questions.length === 0 ? (
          <Empty>Aucune question. Ajoute-en ci-dessous ou via l’import (section grand_oral).</Empty>
        ) : (
          <ul className="space-y-2">
            {questions.map((x) => (
              <li key={x.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                <div className="min-w-0 flex-1 text-sm">
                  <span className="text-xs text-slate-500">{SUBJECTS[x.subject].short} · </span>
                  {x.question}
                </div>
                <Button size="sm" onClick={() => setQ(x)}>
                  Répéter
                </Button>
                <button type="button" className="self-center text-xs text-red-500" onClick={() => confirm('Supprimer cette question ?') && db.content.delete(x.id)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <select className={`${inputCls} w-auto`} value={subject} onChange={(e) => setSubject(e.target.value as SubjectId)}>
            {SUBJECT_IDS.filter((s) => s !== 'sat').map((s) => (
              <option key={s} value={s}>
                {SUBJECTS[s].short}
              </option>
            ))}
          </select>
          <input className={`${inputCls} min-w-0 flex-1`} placeholder="Nouvelle question" value={newQ} onChange={(e) => setNewQ(e.target.value)} />
          <Button
            disabled={!newQ.trim()}
            onClick={async () => {
              const item: GrandOralContent = { type: 'grand_oral', id: uid('go'), subject, question: newQ.trim() };
              await db.content.put(item);
              setNewQ('');
            }}
          >
            Ajouter
          </Button>
        </div>
      </Card>
      <Card title="Phases (à vérifier)">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {GRAND_ORAL_PHASES.map((p) => (
            <li key={p.name}>
              <strong>{p.name}</strong> — {p.minutes} min. {p.hint}
            </li>
          ))}
        </ol>
      </Card>
      <Card title={`Enregistrements · ${audio.length}`}>
        {audio.length === 0 ? <p className="text-sm text-slate-500">Aucun enregistrement.</p> : <ul className="space-y-2">{audio.map((a) => <AudioRow key={a.id} id={a.id} label={a.label} at={a.createdAt} sec={a.durationSec} />)}</ul>}
      </Card>
    </div>
  );
}

function Rehearsal({ question, onExit }: { question: GrandOralContent; onExit: () => void }) {
  const [phase, setPhase] = useState(0);
  const [phaseStart, setPhaseStart] = useState(Date.now);
  const [testStart] = useState(Date.now);
  const [now, setNow] = useState(Date.now());
  const recorder = useRecorder();
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const p = GRAND_ORAL_PHASES[phase];
  const left = p ? p.minutes * 60_000 - (now - phaseStart) : 0;
  const next = async () => {
    if (recorder.recording) await recorder.stop(`${question.question.slice(0, 40)} — ${p.name}`);
    if (phase + 1 >= GRAND_ORAL_PHASES.length) {
      await logFocus(question.subject, testStart, Date.now(), 'drill', 'Grand oral');
      setPhase(GRAND_ORAL_PHASES.length);
      return;
    }
    setPhase(phase + 1);
    setPhaseStart(Date.now());
  };
  if (!p)
    return (
      <Card>
        <Banner tone="ok">Répétition terminée. Réécoute tes enregistrements dans la page Grand oral.</Banner>
        <Button className="mt-3" onClick={onExit}>
          Retour
        </Button>
      </Card>
    );
  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onExit}>
        ← Questions
      </Button>
      <Card>
        <Md text={`**${question.question}**`} />
        {question.notes && <Md text={question.notes} className="mt-1 text-sm text-slate-500" />}
      </Card>
      <Card>
        <div className="text-sm text-slate-500">
          Phase {phase + 1}/{GRAND_ORAL_PHASES.length}
        </div>
        <div className="text-lg font-semibold">{p.name}</div>
        <div className={`my-3 text-center font-mono text-5xl font-bold ${left < 0 ? 'text-red-500' : ''}`}>
          {left < 0 ? '+' : ''}
          {Math.floor(Math.abs(left) / 60000)}:{String(Math.floor((Math.abs(left) % 60000) / 1000)).padStart(2, '0')}
        </div>
        <p className="text-sm">{p.hint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {phase > 0 &&
            (recorder.recording ? (
              <Button variant="danger" onClick={() => recorder.stop(`${question.question.slice(0, 40)} — ${p.name}`)}>
                ■ Arrêter l’enregistrement
              </Button>
            ) : (
              <Button variant="secondary" onClick={recorder.start}>
                🎙️ Enregistrer (local)
              </Button>
            ))}
          <Button onClick={next}>{phase + 1 >= GRAND_ORAL_PHASES.length ? 'Terminer' : 'Phase suivante →'}</Button>
        </div>
        {recorder.error && (
          <div className="mt-2">
            <Banner tone="warn">{recorder.error}</Banner>
          </div>
        )}
      </Card>
    </div>
  );
}
