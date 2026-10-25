import { useMemo, useState } from 'react';
import { QuestionView, type QuestionOutcome } from '../../components/QuestionView';
import { generatorContext } from '../../catalog';
import { recordQuestionAttempt } from '../../db/repo';
import { useChapters } from '../../hooks';
import type { Difficulty, Format } from '../../generators/types';
import type { AttemptSource } from '../../types';
import { SUBJECTS } from '../../types';
import { Badge } from '../../components/ui';

export interface ExerciseSpec {
  generatorId: string;
  seed: number;
  difficulty: Difficulty;
  format: Format;
}

export function ExerciseRunner({
  spec,
  source,
  timeLimitSec,
  mistakeId,
  onDone,
  compact,
  label,
}: {
  spec: ExerciseSpec;
  source: AttemptSource;
  timeLimitSec?: number;
  mistakeId?: string;
  onDone: (o: QuestionOutcome) => void;
  compact?: boolean;
  label?: string;
}) {
  const chapters = useChapters();
  const ctx = generatorContext(spec.generatorId, chapters);
  const question = useMemo(
    () => ctx?.g.generate(spec.seed, spec.difficulty, spec.format),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spec.generatorId, spec.seed, spec.difficulty, spec.format],
  );
  const [saving, setSaving] = useState(false);
  if (!ctx || !question) return <p className="text-sm text-red-500">Générateur introuvable : {spec.generatorId}</p>;
  const complete = async (o: QuestionOutcome) => {
    if (saving) return;
    setSaving(true);
    await recordQuestionAttempt(question, o, {
      source,
      subject: ctx.subject,
      skill: ctx.skill,
      chapterId: ctx.chapterId,
      generatorTitle: ctx.title,
      timed: timeLimitSec !== undefined,
      mistakeId,
    });
    onDone(o);
  };
  const diffLabel = question.lang === 'en' ? { easy: 'Easy', medium: 'Medium', hard: 'Hard' } : { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
  return (
    <QuestionView
      key={`${spec.generatorId}-${spec.seed}-${spec.difficulty}-${spec.format}`}
      question={question}
      onComplete={complete}
      timeLimitSec={timeLimitSec}
      compact={compact}
      header={
        <span className="flex flex-wrap items-center gap-1">
          <Badge color={SUBJECTS[ctx.subject].color}>{SUBJECTS[ctx.subject].short}</Badge>
          <span>{label ?? ctx.skillTitle}</span>
          <span>· {diffLabel[question.difficulty]}</span>
          {question.format === 'spr' && <span>· SPR</span>}
        </span>
      }
    />
  );
}
