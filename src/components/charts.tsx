import { useState } from 'react';

/** Horizontal bars with direct labels (value in text ink, colour = identity). */
export function BarList({ rows, unit = '' }: { rows: { label: string; value: number; color: string }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-sm" title={`${r.label} : ${r.value}${unit}`}>
          <span className="w-20 shrink-0 truncate">{r.label}</span>
          <div className="h-3 flex-1">
            <div className="h-3 rounded-r" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value > 0 ? 4 : 0, backgroundColor: r.color }} />
          </div>
          <span className="w-16 shrink-0 text-right text-xs text-slate-600 tabular-nums dark:text-slate-300">
            {Math.round(r.value)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Single-series line chart with hover/tap tooltip. */
export function LineChart({
  points,
  yMin = 0,
  yMax,
  format = (v) => String(Math.round(v)),
  color = '#3987e5',
  height = 140,
}: {
  points: { label: string; value: number | null }[];
  yMin?: number;
  yMax?: number;
  format?: (v: number) => string;
  color?: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320;
  const H = height;
  const padL = 34;
  const padB = 20;
  const padT = 10;
  const vals = points.map((p) => p.value).filter((v): v is number => v !== null);
  const max = yMax ?? Math.max(1, ...vals) * 1.1;
  const x = (i: number) => padL + (i * (W - padL - 8)) / Math.max(1, points.length - 1);
  const y = (v: number) => padT + (1 - (v - yMin) / (max - yMin || 1)) * (H - padT - padB);
  const segs: string[] = [];
  let cur = '';
  points.forEach((p, i) => {
    if (p.value === null) {
      if (cur) segs.push(cur);
      cur = '';
      return;
    }
    cur += `${cur ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)} `;
  });
  if (cur) segs.push(cur);
  const ticks = [yMin, (yMin + max) / 2, max];
  const h = hover !== null ? points[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-slate-500" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 8} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={0.15} />
            <text x={padL - 4} y={y(t)} fontSize={9} textAnchor="end" dominantBaseline="middle" fill="currentColor">
              {format(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => (
          <text key={i} x={x(i)} y={H - 6} fontSize={9} textAnchor={i === points.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'} fill="currentColor">
            {i % Math.ceil(points.length / 6) === 0 || i === points.length - 1 ? p.label : ''}
          </text>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="currentColor" strokeOpacity={0.4} />}
        {segs.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={color} strokeWidth={2} />
        ))}
        {points.map((p, i) =>
          p.value === null ? null : <circle key={i} cx={x(i)} cy={y(p.value)} r={hover === i ? 5 : 3.5} fill={color} stroke="var(--surface, transparent)" />,
        )}
        {points.map((_, i) => (
          <rect
            key={i}
            x={x(i) - (W - padL) / points.length / 2}
            y={0}
            width={(W - padL) / points.length}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onClick={() => setHover(i)}
          />
        ))}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-0 right-0 rounded bg-slate-900/90 px-2 py-1 text-xs text-white">
          {h.label} : {h.value === null ? '—' : format(h.value)}
        </div>
      )}
    </div>
  );
}
