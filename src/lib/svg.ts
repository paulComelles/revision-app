/**
 * Tiny SVG builder for generated figures (geometry, graphs, tables-as-plots).
 * Uses currentColor so figures follow light/dark mode.
 */

import { hashString } from './rng';

export type Pt = [number, number];

interface StrokeOpts {
  dash?: boolean;
  width?: number;
  color?: string;
  fill?: string;
  opacity?: number;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = (x: number) => (Math.round(x * 100) / 100).toString();

export class SvgBuilder {
  private parts: string[] = [];
  constructor(
    public width: number,
    public height: number,
  ) {}

  line(a: Pt, b: Pt, o: StrokeOpts = {}) {
    this.parts.push(
      `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${o.color ?? 'currentColor'}" stroke-width="${o.width ?? 1.6}"${o.dash ? ' stroke-dasharray="5 4"' : ''}${o.opacity ? ` opacity="${o.opacity}"` : ''}/>`,
    );
    return this;
  }
  polyline(pts: Pt[], o: StrokeOpts = {}) {
    this.parts.push(
      `<polyline points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}" fill="none" stroke="${o.color ?? 'currentColor'}" stroke-width="${o.width ?? 2}"${o.dash ? ' stroke-dasharray="5 4"' : ''}/>`,
    );
    return this;
  }
  polygon(pts: Pt[], o: StrokeOpts = {}) {
    this.parts.push(
      `<polygon points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}" fill="${o.fill ?? 'none'}" fill-opacity="${o.opacity ?? 1}" stroke="${o.color ?? 'currentColor'}" stroke-width="${o.width ?? 1.6}"/>`,
    );
    return this;
  }
  circle(c: Pt, r: number, o: StrokeOpts = {}) {
    this.parts.push(
      `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="${o.fill ?? 'none'}" fill-opacity="${o.opacity ?? 1}" stroke="${o.color ?? 'currentColor'}" stroke-width="${o.width ?? 1.6}"${o.dash ? ' stroke-dasharray="5 4"' : ''}/>`,
    );
    return this;
  }
  dot(c: Pt, r = 3, color = 'currentColor') {
    this.parts.push(`<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="${color}"/>`);
    return this;
  }
  text(p: Pt, s: string, o: { anchor?: 'start' | 'middle' | 'end'; size?: number; italic?: boolean; color?: string } = {}) {
    this.parts.push(
      `<text x="${f(p[0])}" y="${f(p[1])}" font-size="${o.size ?? 14}" text-anchor="${o.anchor ?? 'middle'}" dominant-baseline="middle" fill="${o.color ?? 'currentColor'}"${o.italic ? ' font-style="italic"' : ''} font-family="system-ui, sans-serif">${esc(s)}</text>`,
    );
    return this;
  }
  path(d: string, o: StrokeOpts = {}) {
    this.parts.push(
      `<path d="${d}" fill="${o.fill ?? 'none'}" fill-opacity="${o.opacity ?? 1}" stroke="${o.color ?? 'currentColor'}" stroke-width="${o.width ?? 1.6}"${o.dash ? ' stroke-dasharray="5 4"' : ''}/>`,
    );
    return this;
  }
  /** arc mark for an angle at vertex v between directions to a and b */
  angleArc(v: Pt, a: Pt, b: Pt, r = 18, label?: string) {
    const a1 = Math.atan2(a[1] - v[1], a[0] - v[0]);
    let a2 = Math.atan2(b[1] - v[1], b[0] - v[0]);
    let d = a2 - a1;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    a2 = a1 + d;
    const p1: Pt = [v[0] + r * Math.cos(a1), v[1] + r * Math.sin(a1)];
    const p2: Pt = [v[0] + r * Math.cos(a2), v[1] + r * Math.sin(a2)];
    const sweep = d > 0 ? 1 : 0;
    this.path(`M ${f(p1[0])} ${f(p1[1])} A ${r} ${r} 0 0 ${sweep} ${f(p2[0])} ${f(p2[1])}`, { width: 1.3 });
    if (label) {
      const mid = a1 + d / 2;
      const lr = r + 13;
      this.text([v[0] + lr * Math.cos(mid), v[1] + lr * Math.sin(mid)], label, { size: 13 });
    }
    return this;
  }
  /** right-angle square at v between directions to a and b */
  rightAngle(v: Pt, a: Pt, b: Pt, s = 11) {
    const u = norm([a[0] - v[0], a[1] - v[1]]);
    const w = norm([b[0] - v[0], b[1] - v[1]]);
    const p1: Pt = [v[0] + u[0] * s, v[1] + u[1] * s];
    const p2: Pt = [v[0] + (u[0] + w[0]) * s, v[1] + (u[1] + w[1]) * s];
    const p3: Pt = [v[0] + w[0] * s, v[1] + w[1] * s];
    this.polyline([p1, p2, p3], { width: 1.2 });
    return this;
  }
  /** label placed outside a polygon vertex, pushed away from the centroid */
  vertexLabel(p: Pt, centroid: Pt, s: string, dist = 14) {
    const d = norm([p[0] - centroid[0], p[1] - centroid[1]]);
    return this.text([p[0] + d[0] * dist, p[1] + d[1] * dist], s, { italic: false });
  }
  /** label on the middle of segment ab, offset away from `away` */
  segmentLabel(a: Pt, b: Pt, s: string, away: Pt, dist = 13) {
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let n = norm([-(b[1] - a[1]), b[0] - a[0]]);
    if ((away[0] - mid[0]) * n[0] + (away[1] - mid[1]) * n[1] > 0) n = [-n[0], -n[1]];
    return this.text([mid[0] + n[0] * dist, mid[1] + n[1] * dist], s, { size: 13 });
  }
  raw(s: string) {
    this.parts.push(s);
    return this;
  }
  toString() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}" width="100%" style="max-width:${this.width}px" role="img">${this.parts.join('')}</svg>`;
  }
}

export function norm(v: Pt): Pt {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
}

export function centroid(pts: Pt[]): Pt {
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
}

/** Fit math-space points into an SVG box (y flipped). */
export function fitter(pts: Pt[], width: number, height: number, pad = 30) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const s = Math.min((width - 2 * pad) / (maxX - minX || 1), (height - 2 * pad) / (maxY - minY || 1));
  const ox = (width - s * (maxX - minX)) / 2;
  const oy = (height - s * (maxY - minY)) / 2;
  return (p: Pt): Pt => [ox + (p[0] - minX) * s, height - (oy + (p[1] - minY) * s)];
}

export interface PlotOptions {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  width?: number;
  height?: number;
  xstep?: number;
  ystep?: number;
  xlabel?: string;
  ylabel?: string;
  grid?: boolean;
  fns?: { f: (x: number) => number; color?: string; dash?: boolean; label?: string }[];
  points?: { p: Pt; color?: string; label?: string }[];
  segments?: { a: Pt; b: Pt; color?: string; dash?: boolean }[];
  circles?: { c: Pt; r: number; color?: string }[];
  /** axis tick labels every n steps */
  labelEvery?: number;
  /** origin axes (true) or frame axes on the left/bottom (false, for data plots) */
  originAxes?: boolean;
}

/** Cartesian plot: grid, axes, functions, points. */
export function plot(o: PlotOptions): string {
  const W = o.width ?? 320;
  const H = o.height ?? 260;
  const pad = 30;
  const sx = (x: number) => pad + ((x - o.xmin) / (o.xmax - o.xmin)) * (W - 2 * pad);
  const sy = (y: number) => H - pad - ((y - o.ymin) / (o.ymax - o.ymin)) * (H - 2 * pad);
  const P = (p: Pt): Pt => [sx(p[0]), sy(p[1])];
  const svg = new SvgBuilder(W, H);
  const xstep = o.xstep ?? 1;
  const ystep = o.ystep ?? 1;
  const every = o.labelEvery ?? 1;
  const origin = o.originAxes !== false;
  const ax = origin ? Math.min(Math.max(0, o.xmin), o.xmax) : o.xmin;
  const ay = origin ? Math.min(Math.max(0, o.ymin), o.ymax) : o.ymin;
  if (o.grid !== false) {
    for (let x = Math.ceil(o.xmin / xstep) * xstep, i = 0; x <= o.xmax + 1e-9; x += xstep, i++)
      svg.line([sx(x), sy(o.ymin)], [sx(x), sy(o.ymax)], { width: 0.5, opacity: 0.25 });
    for (let y = Math.ceil(o.ymin / ystep) * ystep; y <= o.ymax + 1e-9; y += ystep)
      svg.line([sx(o.xmin), sy(y)], [sx(o.xmax), sy(y)], { width: 0.5, opacity: 0.25 });
  }
  svg.line([sx(o.xmin), sy(ay)], [sx(o.xmax), sy(ay)], { width: 1.3 });
  svg.line([sx(ax), sy(o.ymin)], [sx(ax), sy(o.ymax)], { width: 1.3 });
  let k = 0;
  for (let x = Math.ceil(o.xmin / xstep) * xstep; x <= o.xmax + 1e-9; x += xstep, k++) {
    const xr = Math.round(x * 1000) / 1000;
    if (origin && Math.abs(xr) < 1e-9) continue;
    if (Math.round(xr / xstep) % every !== 0) continue;
    svg.text([sx(xr), sy(ay) + 12], String(xr), { size: 10 });
  }
  for (let y = Math.ceil(o.ymin / ystep) * ystep; y <= o.ymax + 1e-9; y += ystep) {
    const yr = Math.round(y * 1000) / 1000;
    if (origin && Math.abs(yr) < 1e-9) continue;
    if (Math.round(yr / ystep) % every !== 0) continue;
    svg.text([sx(ax) - 6, sy(yr)], String(yr), { size: 10, anchor: 'end' });
  }
  if (o.xlabel) svg.text([W - pad + 8, sy(ay) - 10], o.xlabel, { size: 12, anchor: 'end', italic: true });
  if (o.ylabel) svg.text([sx(ax) + 6, pad - 14], o.ylabel, { size: 12, anchor: 'start', italic: true });
  const palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
  (o.fns ?? []).forEach((fn, i) => {
    const pts: Pt[][] = [[]];
    const n = 240;
    for (let j = 0; j <= n; j++) {
      const x = o.xmin + ((o.xmax - o.xmin) * j) / n;
      const y = fn.f(x);
      if (!Number.isFinite(y) || y < o.ymin - (o.ymax - o.ymin) || y > o.ymax + (o.ymax - o.ymin)) {
        if (pts[pts.length - 1].length) pts.push([]);
        continue;
      }
      pts[pts.length - 1].push([sx(x), sy(Math.max(o.ymin - 1, Math.min(o.ymax + 1, y)))]);
    }
    const clipId = `c${hashString(JSON.stringify([o.xmin, o.xmax, o.ymin, o.ymax, W, H]))}`;
    svg.raw(`<clipPath id="${clipId}"><rect x="${pad}" y="${pad}" width="${W - 2 * pad}" height="${H - 2 * pad}"/></clipPath>`);
    svg.raw(`<g clip-path="url(#${clipId})">`);
    for (const seg of pts) if (seg.length > 1) svg.polyline(seg, { color: fn.color ?? palette[i % 4], dash: fn.dash, width: 2.2 });
    svg.raw('</g>');
    if (fn.label) {
      const xl = o.xmin + (o.xmax - o.xmin) * 0.85;
      const yl = fn.f(xl);
      if (Number.isFinite(yl) && yl > o.ymin && yl < o.ymax) svg.text([sx(xl), sy(yl) - 12], fn.label, { color: fn.color ?? palette[i % 4], size: 12 });
    }
  });
  for (const s of o.segments ?? []) svg.line(P(s.a), P(s.b), { color: s.color, dash: s.dash, width: 2 });
  for (const c of o.circles ?? []) {
    const r = (c.r / (o.xmax - o.xmin)) * (W - 2 * pad);
    svg.circle(P(c.c), r, { color: c.color ?? '#3b82f6', width: 2 });
  }
  for (const p of o.points ?? []) {
    svg.dot(P(p.p), 3.5, p.color ?? '#3b82f6');
    if (p.label) svg.text([sx(p.p[0]) + 8, sy(p.p[1]) - 10], p.label, { size: 12, anchor: 'start' });
  }
  return svg.toString();
}
