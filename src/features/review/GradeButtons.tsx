import { useMemo } from 'react';
import { formatInterval, GRADE_LABELS, previewIntervals, type Grade4 } from '../../lib/srs';
import { useSettings } from '../../hooks';
import type { SrsState } from '../../types';

const COLORS: Record<Grade4, string> = {
  1: 'bg-red-600 hover:bg-red-500',
  2: 'bg-amber-600 hover:bg-amber-500',
  3: 'bg-emerald-600 hover:bg-emerald-500',
  4: 'bg-sky-600 hover:bg-sky-500',
};

/** Again / Hard / Good / Easy with the next interval under each button. */
export function GradeButtons({ state, onGrade, labels }: { state?: SrsState; onGrade: (g: Grade4) => void; labels?: Partial<Record<Grade4, string>> }) {
  const settings = useSettings();
  const iv = useMemo(() => (state ? previewIntervals(state, Date.now(), settings) : null), [state, settings]);
  return (
    <div className="grid grid-cols-4 gap-2">
      {([1, 2, 3, 4] as Grade4[]).map((g) => (
        <button key={g} type="button" onClick={() => onGrade(g)} className={`rounded-lg px-1 py-2 text-sm font-medium text-white ${COLORS[g]}`}>
          <div>{labels?.[g] ?? GRADE_LABELS[g]}</div>
          {iv && <div className="text-[11px] opacity-80">{formatInterval(iv[g])}</div>}
        </button>
      ))}
    </div>
  );
}
