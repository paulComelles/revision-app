import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import { updateSettings, uid } from '../db/repo';
import { downloadJson, exportBackup, restoreBackup, validateBackup } from '../db/backup';
import { useChapters, useSettings } from '../hooks';
import { SUBJECT_IDS, SUBJECTS, type Chapter, type ChapterStatus, type ExamDate, type SubjectId } from '../types';
import { Badge, Banner, Button, Card, Chip, Field, inputCls, PageTitle, Toggle } from '../components/ui';
import { dayKey } from '../lib/dates';

export function SettingsPage() {
  const s = useSettings();
  return (
    <div className="space-y-4">
      <PageTitle sub="Tout est stocké uniquement sur cet appareil">Réglages</PageTitle>

      <Card title="Session du jour">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Durée par défaut :</span>
            {([15, 30, 45] as const).map((m) => (
              <Chip key={m} active={s.sessionMinutes === m} onClick={() => updateSettings({ sessionMinutes: m })}>
                {m} min
              </Chip>
            ))}
          </div>
          <Field label="Objectif quotidien (minutes)">
            <input type="number" min={5} max={240} className={`${inputCls} max-w-32`} value={s.dailyGoalMinutes} onChange={(e) => updateSettings({ dailyGoalMinutes: Number(e.target.value) || 30 })} />
          </Field>
        </div>
      </Card>

      <Card title="Matières : poids et jours">
        <p className="mb-3 text-xs text-slate-500">« Week-end » : la matière n’apparaît dans la session du jour que le samedi et le dimanche (le mode trajet garde les cartes).</p>
        <div className="space-y-3">
          {SUBJECT_IDS.map((id) => (
            <div key={id} className="flex flex-wrap items-center gap-2">
              <Badge color={SUBJECTS[id].color} className="w-20 justify-center">
                {SUBJECTS[id].short}
              </Badge>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={s.subjectWeight[id]}
                className="w-32 accent-blue-600"
                aria-label={`Poids ${SUBJECTS[id].label}`}
                onChange={(e) => updateSettings({ subjectWeight: { ...s.subjectWeight, [id]: Number(e.target.value) } })}
              />
              <span className="w-8 text-xs tabular-nums">{s.subjectWeight[id].toFixed(1)}</span>
              <Chip active={s.dayPreference[id] === 'any'} onClick={() => updateSettings({ dayPreference: { ...s.dayPreference, [id]: 'any' } })}>
                Tous les jours
              </Chip>
              <Chip active={s.dayPreference[id] === 'weekend'} onClick={() => updateSettings({ dayPreference: { ...s.dayPreference, [id]: 'weekend' } })}>
                Week-end
              </Chip>
            </div>
          ))}
        </div>
      </Card>

      <ExamDates dates={s.examDates} />

      <ChaptersEditor />

      <Card title="Répétition espacée (FSRS)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Rétention visée : ${Math.round(s.desiredRetention * 100)} %`} hint="Plus haut = révisions plus fréquentes.">
            <input type="range" min={0.8} max={0.97} step={0.01} value={s.desiredRetention} className="w-full accent-blue-600" onChange={(e) => updateSettings({ desiredRetention: Number(e.target.value) })} />
          </Field>
          <Field label="Intervalle maximum (jours)" hint="Garde les premiers chapitres vivants jusqu’en juin.">
            <input type="number" min={7} max={365} className={inputCls} value={s.maxIntervalDays} onChange={(e) => updateSettings({ maxIntervalDays: Math.max(7, Number(e.target.value) || 45) })} />
          </Field>
        </div>
      </Card>

      <Card title="Focus et SAT">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Focus (min)">
            <input type="number" min={5} max={90} className={inputCls} value={s.focusMinutes} onChange={(e) => updateSettings({ focusMinutes: Number(e.target.value) || 25 })} />
          </Field>
          <Field label="Pause (min)">
            <input type="number" min={1} max={30} className={inputCls} value={s.breakMinutes} onChange={(e) => updateSettings({ breakMinutes: Number(e.target.value) || 5 })} />
          </Field>
          <Field label={`SAT : part de questions Hard ${Math.round(s.satHardShare * 100)} %`}>
            <input type="range" min={0} max={1} step={0.05} value={s.satHardShare} className="w-full accent-blue-600" onChange={(e) => updateSettings({ satHardShare: Number(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <Card title="Apparence">
        <div className="flex gap-1.5">
          {(['dark', 'light', 'system'] as const).map((t) => (
            <Chip key={t} active={s.theme === t} onClick={() => updateSettings({ theme: t })}>
              {{ dark: 'Sombre', light: 'Clair', system: 'Système' }[t]}
            </Chip>
          ))}
        </div>
      </Card>

      <Backup lastBackupAt={s.lastBackupAt} />

      <Card title="Contenu">
        <p className="mb-2 text-sm">Ajoute tes cartes, plans, notions, événements… depuis un fichier texte.</p>
        <Link to="/import" className="text-sm text-blue-600 underline">
          Ouvrir l’import de contenu →
        </Link>
      </Card>

      <DangerZone />
    </div>
  );
}

function ExamDates({ dates }: { dates: ExamDate[] }) {
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [subjects, setSubjects] = useState<SubjectId[]>([]);
  const add = () => {
    if (!label.trim() || !date) return;
    void updateSettings({ examDates: [...dates, { id: uid('e'), label: label.trim(), date, subjects }] });
    setLabel('');
    setDate('');
    setSubjects([]);
  };
  return (
    <Card title="Dates d’examen">
      <p className="mb-2 text-xs text-slate-500">Rien n’est pré-rempli : entre tes dates (bac, SAT, bacs blancs…). Les matières liées gagnent en priorité à l’approche.</p>
      <ul className="mb-3 space-y-1">
        {dates.map((d) => (
          <li key={d.id} className="flex items-center gap-2 text-sm">
            <span className="font-medium">{d.label}</span>
            <span className="text-slate-500">{new Date(d.date).toLocaleDateString('fr-FR')}</span>
            {d.subjects.map((s) => (
              <Badge key={s} color={SUBJECTS[s].color}>
                {SUBJECTS[s].short}
              </Badge>
            ))}
            <button type="button" className="ml-auto text-xs text-red-500" onClick={() => updateSettings({ examDates: dates.filter((x) => x.id !== d.id) })}>
              Supprimer
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={inputCls} placeholder="Intitulé (ex. SAT, Spé maths)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input type="date" className={inputCls} value={date} min={dayKey(Date.now())} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUBJECT_IDS.map((s) => (
            <Chip key={s} active={subjects.includes(s)} onClick={() => setSubjects((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]))}>
              {SUBJECTS[s].short}
            </Chip>
          ))}
        </div>
        <Button onClick={add} disabled={!label.trim() || !date}>
          Ajouter la date
        </Button>
      </div>
    </Card>
  );
}

function ChaptersEditor() {
  const [subject, setSubject] = useState<SubjectId>('maths');
  const chapters = useChapters(subject);
  const [title, setTitle] = useState('');
  const bacCount = chapters.filter((c) => c.onBac).length;
  const add = async () => {
    if (!title.trim()) return;
    const c: Chapter = { id: uid(`${subject}-`), subject, title: title.trim(), order: chapters.length, status: 'todo', verified: true, onBac: subject === 'ses' ? null : undefined };
    await db.chapters.put(c);
    setTitle('');
  };
  const move = async (c: Chapter, dir: -1 | 1) => {
    const i = chapters.findIndex((x) => x.id === c.id);
    const o = chapters[i + dir];
    if (!o) return;
    await db.chapters.bulkPut([
      { ...c, order: o.order },
      { ...o, order: c.order },
    ]);
  };
  return (
    <Card title="Chapitres">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {SUBJECT_IDS.filter((s) => s !== 'sat').map((s) => (
          <Chip key={s} active={subject === s} onClick={() => setSubject(s)}>
            {SUBJECTS[s].short}
          </Chip>
        ))}
      </div>
      <p className="mb-2 text-xs text-slate-500">
        Liste issue de la structure des programmes officiels : <strong>à vérifier</strong> et à adapter. Les exercices générés d’un chapitre n’entrent dans la session du jour
        qu’une fois le chapitre « en cours » ou « vu ».
      </p>
      {subject === 'ses' && (
        <Banner tone={bacCount === 9 ? 'ok' : 'warn'}>
          {bacCount}/9 chapitres marqués « au bac ». Coche les 9 chapitres de l’épreuve écrite (à vérifier dans la note de service officielle).
        </Banner>
      )}
      <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
        {chapters.map((c, i) => (
          <li key={c.id} className="space-y-1.5 py-2">
            <div className="flex items-start gap-2">
              <input
                className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 text-sm hover:border-slate-300 focus:border-blue-500 dark:hover:border-slate-700"
                defaultValue={c.title}
                onBlur={(e) => e.target.value.trim() && e.target.value !== c.title && db.chapters.update(c.id, { title: e.target.value.trim() })}
              />
              <button type="button" className="text-xs text-slate-400" disabled={i === 0} onClick={() => move(c, -1)} aria-label="Monter">
                ▲
              </button>
              <button type="button" className="text-xs text-slate-400" disabled={i === chapters.length - 1} onClick={() => move(c, 1)} aria-label="Descendre">
                ▼
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select className="rounded border border-slate-300 bg-transparent px-1 py-0.5 dark:border-slate-700" value={c.status} onChange={(e) => db.chapters.update(c.id, { status: e.target.value as ChapterStatus })}>
                <option value="todo">Pas commencé</option>
                <option value="current">En cours</option>
                <option value="done">Vu</option>
              </select>
              {subject === 'ses' && <Toggle checked={!!c.onBac} onChange={(v) => db.chapters.update(c.id, { onBac: v })} label="au bac" />}
              <Toggle checked={c.verified} onChange={(v) => db.chapters.update(c.id, { verified: v })} label={c.verified ? 'vérifié' : <span className="text-amber-600">à vérifier</span>} />
              <button
                type="button"
                className="ml-auto text-red-500"
                onClick={() => {
                  if (confirm(`Supprimer le chapitre « ${c.title} » ? (le contenu importé reste)`)) void db.chapters.delete(c.id);
                }}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input className={inputCls} placeholder="Nouveau chapitre" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button onClick={add}>Ajouter</Button>
      </div>
    </Card>
  );
}

function Backup({ lastBackupAt }: { lastBackupAt?: number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const doExport = async () => {
    setBusy(true);
    const data = await exportBackup();
    downloadJson(data, `revision-sauvegarde-${dayKey(Date.now())}.json`);
    await updateSettings({ lastBackupAt: Date.now() });
    setBusy(false);
    setMsg({ tone: 'ok', text: 'Sauvegarde téléchargée. Range-la dans un dossier sûr (Drive, iCloud…).' });
  };
  const doImport = async (f: File) => {
    try {
      const v = validateBackup(JSON.parse(await f.text()));
      if (!v.ok) {
        setMsg({ tone: 'error', text: v.message });
        return;
      }
      if (!confirm(`Remplacer TOUTES les données actuelles par la sauvegarde du ${new Date(v.file.exportedAt).toLocaleString('fr-FR')} ?`)) return;
      setBusy(true);
      await restoreBackup(v.file);
      setMsg({ tone: 'ok', text: 'Sauvegarde restaurée.' });
    } catch (e) {
      setMsg({ tone: 'error', text: `Fichier illisible : ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };
  const days = lastBackupAt ? Math.floor((Date.now() - lastBackupAt) / 86_400_000) : null;
  return (
    <Card title="Sauvegarde (JSON)">
      <p className="mb-3 text-sm text-slate-500">
        {days === null ? 'Aucune sauvegarde pour l’instant.' : `Dernière sauvegarde : il y a ${days} jour(s).`} Les données vivent dans le navigateur : exporte régulièrement.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={doExport} disabled={busy}>
          ⬇ Exporter
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
          ⬆ Importer une sauvegarde
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
      </div>
      {msg && (
        <div className="mt-3">
          <Banner tone={msg.tone}>{msg.text}</Banner>
        </div>
      )}
    </Card>
  );
}

function DangerZone() {
  return (
    <Card title="Zone sensible">
      <Button
        variant="danger"
        onClick={async () => {
          if (!confirm('Effacer toutes les données de l’app sur cet appareil ? Pense à exporter avant.')) return;
          if (!confirm('Vraiment tout effacer ?')) return;
          await Promise.all(db.tables.map((t) => t.clear()));
          location.reload();
        }}
      >
        Tout effacer
      </Button>
    </Card>
  );
}
