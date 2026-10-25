import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getGenerator } from '../generators';
import type { Difficulty, Format } from '../generators/types';
import { ExerciseRunner } from '../features/review/ExerciseRunner';
import { Button, Card, Chip, PageTitle } from '../components/ui';
import { randomSeed } from '../lib/rng';
import { skillTitle } from '../catalog';

const DIFF_LABEL: Record<Difficulty, { fr: string; en: string }> = {
  easy: { fr: 'Facile', en: 'Easy' },
  medium: { fr: 'Moyen', en: 'Medium' },
  hard: { fr: 'Difficile', en: 'Hard' },
};

/** Free practice on one generator: endless questions, difficulty/format switches. */
export function PracticePage() {
  const { generatorId = '' } = useParams();
  const [params] = useSearchParams();
  const g = getGenerator(generatorId);
  const mistakeId = params.get('mistake') ?? undefined;
  const fixedSeed = params.get('seed');
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const d = params.get('d') as Difficulty | null;
    return d && g?.difficulties.includes(d) ? d : (g?.difficulties.includes('medium') ? 'medium' : g?.difficulties[0]) ?? 'medium';
  });
  const [format, setFormat] = useState<Format>(() => {
    const f = params.get('f') as Format | null;
    return f && g?.formats.includes(f) ? f : g?.formats[0] ?? 'mcq';
  });
  const [seed, setSeed] = useState(() => (fixedSeed ? Number(fixedSeed) : randomSeed()));
  const [count, setCount] = useState({ done: 0, ok: 0 });
  // the mistake is only reviewed by the first question
  const [mistakeUsed, setMistakeUsed] = useState(false);
  if (!g) return <p>Exercice introuvable.</p>;
  const en = g.subject === 'sat';
  const nextQ = () => {
    setSeed(randomSeed());
    window.scrollTo({ top: 0 });
  };
  return (
    <div className="space-y-3">
      <PageTitle sub={`${skillTitle(g.skill)} · ${count.ok}/${count.done} ${en ? 'correct' : 'réussis'}`}>{g.title}</PageTitle>
      <div className="flex flex-wrap gap-1.5">
        {g.difficulties.map((d) => (
          <Chip
            key={d}
            active={d === difficulty}
            onClick={() => {
              setDifficulty(d);
              nextQ();
            }}
          >
            {DIFF_LABEL[d][en ? 'en' : 'fr']}
          </Chip>
        ))}
        {g.formats.length > 1 &&
          g.formats.map((f) => (
            <Chip
              key={f}
              active={f === format}
              onClick={() => {
                setFormat(f);
                nextQ();
              }}
            >
              {f === 'mcq' ? (en ? 'Multiple choice' : 'QCM') : f === 'spr' ? 'SPR (typed)' : 'Saisie'}
            </Chip>
          ))}
      </div>
      <Card>
        <ExerciseRunner
          key={`${seed}-${difficulty}-${format}`}
          spec={{ generatorId: g.id, seed, difficulty, format }}
          source={mistakeId && !mistakeUsed ? 'mistake' : 'practice'}
          mistakeId={mistakeUsed ? undefined : mistakeId}
          onDone={(o) => {
            setCount((c) => ({ done: c.done + 1, ok: c.ok + (o.correct ? 1 : 0) }));
            setMistakeUsed(true);
            nextQ();
          }}
        />
      </Card>
      <Button variant="ghost" size="sm" onClick={nextQ}>
        {en ? 'Skip this question' : 'Passer cette question'}
      </Button>
    </div>
  );
}
