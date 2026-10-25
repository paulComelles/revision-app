import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { gradeItem, updateMistakeStreak } from '../../db/repo';
import { getGenerator } from '../../generators';
import { randomSeed } from '../../lib/rng';
import { ERROR_TYPES, SUBJECTS } from '../../types';
import { Md } from '../../components/Md';
import { Badge, Button, Toggle } from '../../components/ui';
import { GradeButtons } from './GradeButtons';
import { ExerciseRunner } from './ExerciseRunner';
import { REVIEW_RENDERERS, type ReviewProps } from './registry';
import type { Grade4 } from '../../lib/srs';
import { PhotoView } from '../../components/PhotoView';
import { recordQbReattempt } from '../sat/qbRepo';

export function ReviewRunner(props: ReviewProps) {
  const { item } = props;
  const Custom = REVIEW_RENDERERS[item.kind];
  if (item.kind === 'card') return <CardReview {...props} />;
  if (item.kind === 'exercise') return <ExerciseReview {...props} />;
  if (item.kind === 'mistake') return <MistakeReview {...props} />;
  if (Custom) return <Custom {...props} />;
  return <SelfGradeReview {...props} />;
}

function ExerciseReview({ item, onDone, compact }: ReviewProps) {
  const g = getGenerator(item.refId);
  const [spec] = useState(() =>
    g
      ? {
          generatorId: g.id,
          seed: randomSeed(),
          difficulty: g.difficulties.includes('medium') ? 'medium' : g.difficulties[0],
          format: compact && g.formats.includes('mcq') ? 'mcq' : g.formats[Math.floor(Math.random() * g.formats.length)],
        }
      : null,
  );
  if (!g || !spec) return <SelfGradeReview item={item} onDone={onDone} />;
  // ExerciseRunner grades the generator item itself
  return <ExerciseRunner spec={spec as never} source="review" onDone={(o) => onDone(o.correct)} compact={compact} label={`Révision · ${item.title}`} />;
}

export function CardReview({ item, onDone }: ReviewProps) {
  const card = useLiveQuery(() => db.content.get(item.refId), [item.refId]);
  const [shown, setShown] = useState(false);
  if (card === undefined) return null;
  if (!card || card.type !== 'card') return <SelfGradeReview item={item} onDone={onDone} />;
  const grade = async (g: Grade4) => {
    await gradeItem(item.id, g);
    onDone(g >= 3);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Badge color={SUBJECTS[card.subject].color}>{SUBJECTS[card.subject].short}</Badge> Carte
      </div>
      <div className="rounded-xl border border-slate-200 p-4 text-lg dark:border-slate-800">
        <Md text={card.front} />
      </div>
      {shown ? (
        <>
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <Md text={card.back} />
          </div>
          <GradeButtons state={item.srs} onGrade={grade} />
        </>
      ) : (
        <Button size="lg" className="w-full" onClick={() => setShown(true)}>
          Afficher la réponse
        </Button>
      )}
    </div>
  );
}

function MistakeReview({ item, onDone, compact }: ReviewProps) {
  const mistake = useLiveQuery(() => db.mistakes.get(item.refId), [item.refId]);
  const [exact, setExact] = useState(false);
  const [started, setStarted] = useState(false);
  const [seed] = useState(randomSeed);
  if (mistake === undefined) return null;
  if (!mistake) return <SelfGradeReview item={item} onDone={onDone} />;
  const g = mistake.generatorId ? getGenerator(mistake.generatorId) : undefined;
  if (g && mistake.seed !== undefined) {
    if (!started)
      return (
        <div className="space-y-3">
          <div className="text-sm text-slate-500">
            Erreur du carnet · {ERROR_TYPES[mistake.errorType].fr} · {g.title}
          </div>
          <p className="text-sm">Par défaut tu refais une question <strong>similaire</strong> (nouvelle graine).</p>
          <Toggle checked={exact} onChange={setExact} label="Réessayer la question exacte" />
          <Button size="lg" onClick={() => setStarted(true)}>
            Commencer
          </Button>
        </div>
      );
    return (
      <ExerciseRunner
        spec={{
          generatorId: g.id,
          seed: exact ? mistake.seed : seed,
          difficulty: (mistake.difficulty as never) ?? 'medium',
          format: (mistake.format as never) ?? g.formats[0],
        }}
        source="mistake"
        mistakeId={mistake.id}
        compact={compact}
        label={exact ? 'Erreur — question exacte' : 'Erreur — question similaire'}
        onDone={(o) => onDone(o.correct)}
      />
    );
  }
  if (mistake.qbId) {
    const qbId = mistake.qbId;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Badge color={SUBJECTS.sat.color}>SAT</Badge> Question Bank re-attempt · {ERROR_TYPES[mistake.errorType].en}
        </div>
        <Md text={mistake.prompt} />
        <p className="text-sm">Solve it again on paper, then check the answer in your PDF.</p>
        <div className="flex gap-2">
          <Button variant="success" onClick={async () => { await recordQbReattempt(qbId, mistake.id, true); onDone(true); }}>
            ✓ Right
          </Button>
          <Button variant="danger" onClick={async () => { await recordQbReattempt(qbId, mistake.id, false); onDone(false); }}>
            ✗ Wrong
          </Button>
        </div>
      </div>
    );
  }
  // manual mistake: redo on paper, then self-grade
  const grade = async (gr: Grade4) => {
    await gradeItem(item.id, gr);
    await updateMistakeStreak(mistake.id, gr >= 3);
    onDone(gr >= 3);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Badge color={SUBJECTS[mistake.subject].color}>{SUBJECTS[mistake.subject].short}</Badge> Erreur notée · {ERROR_TYPES[mistake.errorType].fr}
      </div>
      <Md text={mistake.prompt} />
      {mistake.photoId && <PhotoView id={mistake.photoId} />}
      {mistake.note && <p className="text-sm text-slate-500">Note : {mistake.note}</p>}
      <p className="text-sm">Refais l’exercice sur papier, puis évalue-toi :</p>
      {started ? (
        <>
          {mistake.correctAnswer && (
            <div className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
              Correction notée : <Md text={mistake.correctAnswer} />
            </div>
          )}
          <GradeButtons state={item.srs} onGrade={grade} />
        </>
      ) : (
        <Button onClick={() => setStarted(true)}>J’ai refait l’exercice</Button>
      )}
    </div>
  );
}

export function SelfGradeReview({ item, onDone }: ReviewProps) {
  const grade = async (g: Grade4) => {
    await gradeItem(item.id, g);
    onDone(g >= 3);
  };
  return (
    <div className="space-y-3">
      <p className="font-medium">{item.title}</p>
      <p className="text-sm text-slate-500">Révise cet élément puis évalue-toi.</p>
      <GradeButtons state={item.srs} onGrade={grade} />
    </div>
  );
}
