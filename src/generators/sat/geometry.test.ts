import { describe, expect, it } from 'vitest';
import {
  parallelAngleRays,
  satArcs,
  satArea,
  satCircleEq,
  satParallelAngles,
  satRightTriangle,
  satSimilar,
  satTriangleAngles,
  satTrig,
  satVolume,
} from './geometry';
import { answerValue, forAll, near, val } from '../testutil';

const N = 150;
type M = Record<string, number>;
const DEG = Math.PI / 180;

describe('SAT geometry & trigonometry — answers verified independently', () => {
  it('volumes by numeric integration (slices)', () => {
    // integrate cross-sections numerically
    const integrate = (area: (z: number) => number, h: number) => {
      const n = 4000;
      let s = 0;
      for (let i = 0; i < n; i++) s += area(((i + 0.5) * h) / n);
      return (s * h) / n;
    };
    forAll(satVolume, 60, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { solid: string; what: string };
      const v = answerValue(q);
      if (m.solid === 'cylinder') expect(near(integrate(() => Math.PI * m.r ** 2, m.h), v * Math.PI, 1e-6)).toBe(true);
      if (m.solid === 'cone') expect(near(integrate((z) => Math.PI * (m.r * (1 - z / m.h)) ** 2, m.h), v * Math.PI, 1e-4)).toBe(true);
      if (m.solid === 'cone-h') expect(near(integrate((z) => Math.PI * (m.r * (1 - z / v)) ** 2, v), m.k * Math.PI, 1e-4)).toBe(true);
      if (m.solid === 'sphere') expect(near(integrate((z) => Math.PI * (m.r ** 2 - (z - m.r) ** 2), 2 * m.r), v * Math.PI, 1e-4)).toBe(true);
      if (m.solid === 'prism') expect(m.l * m.w * v).toBe(m.V);
      if (m.solid === 'pyramid') expect(near(integrate((z) => m.l * m.w * (1 - z / v) ** 2, v), m.V, 1e-4)).toBe(true);
      if (m.solid === 'scale') expect(near(v, m.what === 'volume' ? m.s ** 3 : m.s ** 2)).toBe(true);
      if (m.solid === 'hemisphere-cyl') {
        const cyl = integrate(() => Math.PI * m.r ** 2, m.h);
        const hemi = integrate((z) => Math.PI * (m.r ** 2 - z * z), m.r);
        expect(near(cyl + hemi, v * Math.PI, 1e-4)).toBe(true);
      }
    });
  });

  it('areas with the shoelace formula', () => {
    const shoelace = (pts: [number, number][]) => Math.abs(pts.reduce((s, p, i) => s + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0)) / 2;
    forAll(satArea, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string };
      const v = answerValue(q);
      if (m.kind === 'trapezoid') expect(near(shoelace([[0, 0], [m.b2, 0], [1 + m.b1, m.h], [1, m.h]]), v)).toBe(true);
      else expect(near(shoelace([[0, 0], [m.W, 0], [m.W, m.H], [m.tb, m.H], [0, m.H - m.th]]), v)).toBe(true);
    });
  });

  it('parallel lines: the drawn angles really have the stated measures', () => {
    const vec = (dir: string, theta: number): [number, number] =>
      dir === 'up' ? [Math.cos(theta), Math.sin(theta)] : dir === 'down' ? [-Math.cos(theta), -Math.sin(theta)] : dir === 'left' ? [-1, 0] : [1, 0];
    const angle = (a: [number, number], b: [number, number]) => Math.acos(a[0] * b[0] + a[1] * b[1]) / DEG;
    forAll(satParallelAngles, N, (q) => {
      const m = q.meta as M & { rel: 'corresponding' | 'alternate' | 'same-side' };
      const theta = Math.min(m.a1, 180 - m.a1);
      const rays = parallelAngleRays(m.rel, m.a1 === theta);
      const t = theta * DEG;
      expect(angle(vec(rays.top[0], t), vec(rays.top[1], t))).toBeCloseTo(m.a1, 6);
      expect(angle(vec(rays.bottom[0], t), vec(rays.bottom[1], t))).toBeCloseTo(m.a2, 6);
      // interior angles lie between the lines: top angle opens downward, bottom upward
      if (m.rel !== 'corresponding') {
        expect(rays.top[0]).toBe('down');
        expect(rays.bottom[0]).toBe('up');
      }
      expect(m.p1 * m.x + m.q1).toBe(m.a1);
      expect(m.p2 * m.x + m.q2).toBe(m.a2);
      if (q.format === 'spr') expect(answerValue(q)).toBe(m.ans);
    });
  });

  it('triangle angles', () => {
    forAll(satTriangleAngles, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string };
      const v = answerValue(q);
      if (m.kind === 'exterior') expect(180 - (180 - m.A - m.B)).toBe(v);
      else {
        expect(m.p * m.x + m.q).toBe(m.base);
        expect(2 * m.base + v).toBe(180);
      }
    });
  });

  it('similar triangles with coordinates', () => {
    forAll(satSimilar, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string };
      const v = answerValue(q);
      // place A at origin, B on the x-axis, C anywhere; D on AB at distance a, E on AC with DE ∥ BC
      const AB = m.a + m.b;
      const C: [number, number] = [2.3, 4.1];
      const t = m.a / AB;
      const BC = Math.hypot(C[0] - AB, C[1]);
      const DE = t * BC;
      if (m.kind === 'length') expect(near(v / m.e, BC / DE)).toBe(true);
      else expect(near(v, m.area * t * t)).toBe(true);
    });
  });

  it('right triangles', () => {
    forAll(satRightTriangle, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string; missing: string; askArea: boolean };
      const v = answerValue(q);
      if (m.kind === 'pythagoras') {
        expect(m.a ** 2 + m.b ** 2).toBe(m.c ** 2);
        expect(v).toBe(m.missing === 'hyp' ? m.c : m.b);
      }
      if (m.kind === '30-60-90') {
        // build the triangle with angles 30/60/90 and short leg s
        const longLeg = m.s * Math.tan(60 * DEG);
        const target = m.askArea ? (m.s * longLeg) / 2 : longLeg;
        expect(near(v * Math.sqrt(3), target)).toBe(true);
      }
      if (m.kind === '45-45-90') {
        if (m.leg !== undefined) expect(near(v * Math.SQRT2, Math.hypot(m.leg, m.leg))).toBe(true);
        else expect(near(v, ((m.mm * Math.SQRT2) / Math.SQRT2) ** 2 / 2)).toBe(true);
      }
    });
  });

  it('trig ratios from actual angles', () => {
    forAll(satTrig, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string; fn: string; target: string };
      const v = answerValue(q);
      if (m.kind === 'ratio' || m.kind === 'other-angle') {
        const A = Math.atan2(m.b, m.a); // opposite BC = b, adjacent AC = a
        const B = Math.PI / 2 - A;
        const f = { sin: Math.sin, cos: Math.cos, tan: Math.tan } as const;
        if (m.kind === 'ratio') expect(near(v, f[m.fn as 'sin'](A))).toBe(true);
        else expect(near(v, f[m.target.split(' ')[0] as 'sin'](B))).toBe(true);
      }
      if (m.kind === 'complementary') expect(near(Math.cos(m.B * DEG) / Math.sin(m.A * DEG), 1)).toBe(true);
      if (m.kind === 'cofunction') {
        const A = (m.a * v + m.b) * DEG;
        const C = (m.c * v + m.e) * DEG;
        expect(near(Math.sin(A), Math.cos(C))).toBe(true);
        expect(A > 0 && A < Math.PI / 2 && C > 0 && C < Math.PI / 2).toBe(true);
      }
    });
  });

  it('circle equations: points at distance r from the center satisfy the equation', () => {
    forAll(satCircleEq, N, (q) => {
      const m = q.meta as M & { kind: string };
      for (const a of [0.3, 1.7, 4]) {
        const x = m.h + m.r * Math.cos(a);
        const y = m.k + m.r * Math.sin(a);
        if (m.kind === 'general') expect(near(x * x + y * y + m.D * x + m.E * y + m.F, 0, 1e-9)).toBe(true);
      }
      if (q.format === 'spr') {
        const v = answerValue(q);
        expect(v === m.r || v === m.r * m.r).toBe(true);
      }
    });
  });

  it('arcs and sectors by numeric integration', () => {
    forAll(satArcs, N, (q) => {
      if (q.format !== 'spr') return;
      const m = q.meta as M & { kind: string; askCentral: boolean };
      const v = answerValue(q);
      if (m.kind === 'arc-deg') {
        // polyline approximation of the arc
        let L = 0;
        const n = 5000;
        for (let i = 0; i < n; i++) {
          const t0 = (m.deg * DEG * i) / n;
          const t1 = (m.deg * DEG * (i + 1)) / n;
          L += Math.hypot(m.r * (Math.cos(t1) - Math.cos(t0)), m.r * (Math.sin(t1) - Math.sin(t0)));
        }
        expect(near(L, v * Math.PI, 1e-6)).toBe(true);
      }
      if (m.kind === 'radians') expect(near(v * Math.PI, m.deg * DEG)).toBe(true);
      if (m.kind === 'inscribed') {
        // put A, B on the unit circle with central angle `central`, C on the major arc, measure ACB
        const A = [1, 0];
        const B = [Math.cos(m.central * DEG), Math.sin(m.central * DEG)];
        const c = (m.central * DEG + 2 * Math.PI) / 2;
        const C = [Math.cos(c), Math.sin(c)];
        const u = [A[0] - C[0], A[1] - C[1]];
        const w = [B[0] - C[0], B[1] - C[1]];
        const acb = Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]))) / DEG;
        expect(near(m.askCentral ? v / 2 : v, acb, 1e-9)).toBe(true);
      }
      if (m.kind === 'sector-rad') expect(near(v * Math.PI, ((m.p * Math.PI) / m.q / (2 * Math.PI)) * Math.PI * m.r * m.r)).toBe(true);
      if (m.kind === 'arc-to-angle') expect(near((v / 360) * 2 * Math.PI * m.r, val(m.arc) * Math.PI)).toBe(true);
    });
  });
});
