/** SAT Geometry and Trigonometry generators, with generated SVG figures. */
import { F, frac } from '../../lib/fraction';
import { centroid, fitter, SvgBuilder, type Pt } from '../../lib/svg';
import { defineGenerator } from '../define';
import { fr, lin, m, paren, signed } from '../helpers';
import type { Figure } from '../types';
import { numAnswer, textMcq, texOf } from './common';

const DEG = Math.PI / 180;
const svgFig = (svg: SvgBuilder, alt: string): Figure => ({ kind: 'svg', svg: svg.toString(), alt });
const tSigned = (c: number, v: string) => (c === 0 ? '' : `${c < 0 ? ' - ' : ' + '}${Math.abs(c) === 1 ? '' : Math.abs(c)}${v}`);
const piTex = (k: number | string) => (k === 1 || k === '1' ? '\\pi' : `${k}\\pi`);

/** Draw a labelled polygon (math coordinates) and return the builder + mapper. */
function polyFigure(pts: Pt[], labels: string[], W = 300, H = 220) {
  const map = fitter(pts, W, H, 34);
  const P = pts.map(map);
  const svg = new SvgBuilder(W, H);
  svg.polygon(P);
  const c = centroid(P);
  labels.forEach((l, i) => l && svg.vertexLabel(P[i], c, l));
  return { svg, P, c };
}

// ---------------------------------------------------------------- volume
export const satVolume = defineGenerator({
  id: 'sat-volume',
  subject: 'sat',
  skill: 'geo-area-volume',
  title: 'Volume of solids',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 85,
  build(rng, d, f) {
    const solid = rng.pick(d === 'medium' ? (['cylinder', 'cone', 'prism', 'sphere'] as const) : (['cone-h', 'scale', 'hemisphere-cyl', 'pyramid'] as const));
    if (solid === 'cylinder' || solid === 'cone') {
      const r = rng.int(2, 9);
      const h = solid === 'cone' ? 3 * rng.int(1, 5) : rng.int(2, 12);
      const k = solid === 'cone' ? (r * r * h) / 3 : r * r * h;
      const svg = new SvgBuilder(220, 200);
      // simple oblique drawing
      if (solid === 'cylinder') {
        svg.path('M 50 50 A 60 16 0 0 0 170 50 A 60 16 0 0 0 50 50', {}).line([50, 50], [50, 160]).line([170, 50], [170, 160]).path('M 50 160 A 60 16 0 0 0 170 160');
        svg.path('M 50 160 A 60 16 0 0 1 170 160', { dash: true });
        svg.line([110, 160], [170, 160], { dash: true }).text([140, 150], `${r}`, { size: 13 }).text([186, 105], `${h}`, { size: 13 });
      } else {
        svg.line([110, 30], [50, 160]).line([110, 30], [170, 160]).path('M 50 160 A 60 16 0 0 0 170 160').path('M 50 160 A 60 16 0 0 1 170 160', { dash: true });
        svg.line([110, 30], [110, 160], { dash: true }).line([110, 160], [170, 160], { dash: true }).text([140, 150], `${r}`, { size: 13 }).text([100, 100], `${h}`, { size: 13 });
      }
      return {
        prompt: `A right circular ${solid} has a ${solid === 'cone' ? 'base ' : ''}radius of ${m(`${r}`)} centimeters and a height of ${m(`${h}`)} centimeters. The volume of the ${solid} is ${m('k\\pi')} cubic centimeters. What is the value of ${m('k')}?`,
        figure: svgFig(svg, `${solid} with radius ${r} and height ${h}`),
        ...numAnswer(rng, f, frac(k), [
          { v: solid === 'cone' ? r * r * h : (r * r * h) / 3, e: 'cours' },
          { v: solid === 'cone' ? (2 * r * h) / 3 : 2 * r * h, e: 'cours' },
          { v: solid === 'cone' ? (r * h * h) / 3 : r * h * h, e: 'lecture' },
        ]),
        hints: [solid === 'cone' ? 'Volume of a cone: $V = \\frac{1}{3}\\pi r^2 h$ (it is on the SAT reference sheet).' : 'Volume of a cylinder: $V = \\pi r^2 h$ (on the SAT reference sheet).', `${m(`r^2 = ${r * r}`)}.`],
        solution: [`${m(`V = ${solid === 'cone' ? '\\frac{1}{3}' : ''}\\pi \\times ${r}^2 \\times ${h}`)}.`, `${m(`V = ${piTex(k)}`)}.`, `${m(`k = ${k}`)}.`],
        meta: { solid, r, h, k },
      };
    }
    if (solid === 'prism' || solid === 'pyramid') {
      const l = rng.int(2, 12);
      const w = rng.int(2, 12);
      const V = solid === 'pyramid' ? l * w * 3 * rng.int(1, 6) : l * w * rng.int(2, 15);
      const h = solid === 'pyramid' ? (3 * V) / (l * w) : V / (l * w);
      return {
        prompt:
          solid === 'prism'
            ? `A rectangular box has a length of ${m(`${l}`)} inches, a width of ${m(`${w}`)} inches, and a volume of ${m(`${V}`)} cubic inches. What is the height, in inches, of the box?`
            : `A right pyramid has a rectangular base with side lengths ${m(`${l}`)} and ${m(`${w}`)} meters. The volume of the pyramid is ${m(`${V}`)} cubic meters. What is the height, in meters, of the pyramid?`,
        ...numAnswer(rng, f, frac(h), [
          { v: solid === 'pyramid' ? V / (l * w) : (3 * V) / (l * w), e: 'cours' },
          { v: V - l - w, e: 'methode' },
          { v: frac(V, l + w), e: 'methode' },
        ]),
        hints: [solid === 'pyramid' ? 'Volume of a pyramid: $V = \\frac{1}{3}Bh$ where $B$ is the base area.' : 'Volume of a box: $V = \\ell w h$.', `Base area: ${m(`${l} \\times ${w} = ${l * w}`)}.`],
        solution: [`${m(`${V} = ${solid === 'pyramid' ? '\\frac{1}{3} \\times ' : ''}${l * w} \\times h`)}.`, `${m(`h = \\frac{${solid === 'pyramid' ? `3 \\times ${V}` : V}}{${l * w}}`)}.`, `${m(`h = ${h}`)}.`],
        meta: { solid, l, w, V, h },
      };
    }
    if (solid === 'sphere') {
      const r = 3 * rng.int(1, 4);
      const k = (4 * r ** 3) / 3;
      return {
        prompt: `A sphere has a radius of ${m(`${r}`)} feet. The volume of the sphere is ${m('k\\pi')} cubic feet. What is the value of ${m('k')}?`,
        ...numAnswer(rng, f, frac(k), [
          { v: 4 * r * r, e: 'cours' },
          { v: (4 * r * r) / 3, e: 'cours' },
          { v: r ** 3, e: 'cours' },
        ]),
        hints: ['Volume of a sphere: $V = \\frac{4}{3}\\pi r^3$ (on the reference sheet).', `${m(`r^3 = ${r ** 3}`)}.`],
        solution: [`${m(`V = \\frac{4}{3}\\pi \\times ${r ** 3}`)}.`, `${m(`V = ${piTex(k)}`)}.`, `${m(`k = ${k}`)}.`],
        meta: { solid, r, k },
      };
    }
    if (solid === 'cone-h') {
      // volume of a cone = kπ, radius r -> height
      const r = rng.int(2, 8);
      const h = rng.int(2, 15);
      const k = (r * r * h) / 3;
      const kf = frac(r * r * h, 3);
      return {
        prompt: `A right circular cone has a volume of ${m(`${F.isInt(kf) ? piTex(k) : `\\frac{${kf.n}}{${kf.d}}\\pi`}`)} cubic centimeters and a base radius of ${m(`${r}`)} centimeters. What is the height, in centimeters, of the cone?`,
        ...numAnswer(rng, f, frac(h), [
          { v: frac(kf.n, kf.d * r * r), e: 'cours' },
          { v: frac(3 * kf.n, kf.d * r), e: 'calcul' },
          { v: frac(kf.n * 3, kf.d * 2 * r), e: 'cours' },
        ]),
        hints: ['$V = \\frac{1}{3}\\pi r^2 h$: substitute and solve for $h$.', `${m(`\\frac{1}{3}\\pi \\times ${r * r} \\times h = ${fr(kf)}\\pi`)}.`],
        solution: [`${m(`\\frac{${r * r}}{3}h = ${fr(kf)}`)}.`, `${m(`h = \\frac{3 \\times ${fr(kf)}}{${r * r}}`)}.`, `${m(`h = ${h}`)}.`],
        meta: { solid, r, h, k },
      };
    }
    if (solid === 'scale') {
      const s = rng.pick([2, 3, 4, frac(1, 2), frac(1, 3)] as const);
      const sv = typeof s === 'number' ? s : F.val(s);
      const what = rng.pick(['volume', 'surface area'] as const);
      const factor = what === 'volume' ? sv ** 3 : sv ** 2;
      const sTex = typeof s === 'number' ? `${s}` : fr(s);
      const factorFrac = typeof s === 'number' ? frac(factor) : what === 'volume' ? frac(s.n ** 3, s.d ** 3) : frac(s.n ** 2, s.d ** 2);
      return {
        prompt: `Every edge length of cube A is multiplied by ${m(sTex)} to create cube B. The ${what} of cube B is how many times the ${what} of cube A?`,
        ...numAnswer(rng, f, factorFrac, [
          { v: sv, e: 'cours' },
          { v: what === 'volume' ? sv ** 2 : sv ** 3, e: 'cours' },
          { v: 3 * sv, e: 'methode' },
        ]),
        hints: [`Scaling lengths by ${m('k')} scales areas by ${m('k^2')} and volumes by ${m('k^3')}.`, `Try it with an edge of 1: cube B has edge ${m(sTex)}.`],
        solution: [`Edge ratio: ${m(sTex)}.`, `${what === 'volume' ? 'Volume' : 'Surface area'} ratio: ${m(`\\left(${sTex}\\right)^{${what === 'volume' ? 3 : 2}}`)}.`, `${m(`= ${fr(factorFrac)}`)}.`],
        meta: { solid, s: sv, what, factor },
      };
    }
    // hemisphere on top of a cylinder, same radius
    const r = 3 * rng.int(1, 3);
    const h = rng.int(2, 12);
    const k = r * r * h + (2 * r ** 3) / 3;
    return {
      prompt: `A solid is made of a right circular cylinder with a hemisphere on top. The cylinder and the hemisphere both have a radius of ${m(`${r}`)} inches, and the cylinder has a height of ${m(`${h}`)} inches. The volume of the solid is ${m('k\\pi')} cubic inches. What is the value of ${m('k')}?`,
      ...numAnswer(rng, f, frac(k), [
        { v: r * r * h + (4 * r ** 3) / 3, e: 'methode' },
        { v: r * r * h, e: 'lecture' },
        { v: r * r * (h + r), e: 'methode' },
      ]),
      hints: ['Add the volume of the cylinder and HALF the volume of a sphere.', `Cylinder: ${m(`\\pi \\times ${r}^2 \\times ${h}`)}.`],
      solution: [`Cylinder: ${m(piTex(r * r * h))}.`, `Hemisphere: ${m(`\\frac{1}{2} \\times \\frac{4}{3}\\pi \\times ${r}^3 = ${piTex((2 * r ** 3) / 3)}`)}.`, `${m(`k = ${r * r * h} + ${(2 * r ** 3) / 3} = ${k}`)}.`],
      meta: { solid, r, h, k },
    };
  },
});

// ---------------------------------------------------------------- area of composite figures
export const satArea = defineGenerator({
  id: 'sat-area',
  subject: 'sat',
  skill: 'geo-area-volume',
  title: 'Areas of polygons and composite figures',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 80,
  build(rng, d, f) {
    if (d === 'medium') {
      // trapezoid with given bases and height
      const b1 = rng.int(3, 12);
      const b2 = b1 + rng.int(2, 10);
      const h = 2 * rng.int(1, 6);
      const off = rng.int(0, b2 - b1);
      const pts: Pt[] = [
        [0, 0],
        [b2, 0],
        [off + b1, h],
        [off, h],
      ];
      const { svg, P } = polyFigure(pts, ['A', 'B', 'C', 'D']);
      svg.line(P[3], [P[3][0], P[0][1]], { dash: true });
      svg.text([(P[0][0] + P[1][0]) / 2, P[0][1] + 16], `${b2}`, { size: 13 });
      svg.text([(P[2][0] + P[3][0]) / 2, P[3][1] - 10], `${b1}`, { size: 13 });
      svg.text([P[3][0] + 9, (P[3][1] + P[0][1]) / 2], `${h}`, { size: 13, anchor: 'start' });
      svg.rightAngle([P[3][0], P[0][1]], P[1], P[3], 8);
      const area = ((b1 + b2) * h) / 2;
      return {
        prompt: `In trapezoid ${m('ABCD')}, ${m('\\overline{AB} \\parallel \\overline{DC}')}, ${m(`AB = ${b2}`)}, ${m(`DC = ${b1}`)}, and the height of the trapezoid is ${m(`${h}`)}. What is the area of trapezoid ${m('ABCD')}?`,
        figure: svgFig(svg, `Trapezoid with bases ${b2} and ${b1}, height ${h}`),
        ...numAnswer(rng, f, frac(area), [
          { v: (b1 + b2) * h, e: 'cours' },
          { v: b1 * b2 * h / 2, e: 'cours' },
          { v: b2 * h, e: 'methode' },
        ]),
        hints: ['Area of a trapezoid: $\\frac{1}{2}(b_1 + b_2)h$ (or split it into a rectangle and triangles).', `${m(`b_1 + b_2 = ${b1 + b2}`)}.`],
        solution: [`${m(`A = \\frac{1}{2}(${b2} + ${b1}) \\times ${h}`)}.`, `${m(`= \\frac{${b1 + b2} \\times ${h}}{2}`)}.`, `${m(`= ${area}`)}.`],
        meta: { kind: 'trapezoid', b1, b2, h, area },
      };
    }
    // rectangle with a triangle cut out (shaded region)
    const W = rng.int(8, 16);
    const H = rng.int(5, 12);
    const tb = rng.int(2, W - 2);
    const th = rng.int(2, H - 1);
    const area = W * H - (tb * th) / 2;
    const svg = new SvgBuilder(300, 220);
    const map = fitter(
      [
        [0, 0],
        [W, H],
      ],
      300,
      220,
      30,
    );
    const R = [map([0, 0]), map([W, 0]), map([W, H]), map([0, H])];
    // shaded region = rectangle without the corner triangle
    svg.polygon([map([0, 0]), map([W, 0]), map([W, H]), map([tb, H]), map([0, H - th])], { fill: '#3987e5', opacity: 0.35 });
    const T = [map([0, H]), map([tb, H]), map([0, H - th])];
    svg.line(T[0], T[1], { dash: true }).line(T[0], T[2], { dash: true });
    svg.text([(R[0][0] + R[1][0]) / 2, R[0][1] + 16], `${W}`, { size: 13 });
    svg.text([R[1][0] + 14, (R[1][1] + R[2][1]) / 2], `${H}`, { size: 13 });
    svg.text([(T[0][0] + T[1][0]) / 2, T[0][1] - 10], `${tb}`, { size: 13 });
    svg.text([T[0][0] - 14, (T[0][1] + T[2][1]) / 2], `${th}`, { size: 13 });
    return {
      prompt: `The figure shows a ${m(`${W}`)} by ${m(`${H}`)} rectangle from which a right triangle with legs ${m(`${tb}`)} and ${m(`${th}`)} has been removed from one corner. What is the area of the shaded region?`,
      figure: svgFig(svg, `Rectangle ${W} by ${H} with a right triangle of legs ${tb} and ${th} removed from a corner`),
      ...numAnswer(rng, f, frac(2 * area, 2), [
        { v: W * H - tb * th, e: 'cours' },
        { v: W * H, e: 'lecture' },
        { v: (tb * th) / 2, e: 'lecture' },
      ]),
      hints: ['Shaded area = area of the whole rectangle − area of the removed triangle.', `Rectangle: ${m(`${W} \\times ${H} = ${W * H}`)}.`],
      solution: [`Rectangle: ${m(`${W * H}`)}.`, `Triangle: ${m(`\\frac{1}{2} \\times ${tb} \\times ${th} = ${texOf((tb * th) / 2)}`)}.`, `Shaded: ${m(`${W * H} - ${texOf((tb * th) / 2)} = ${texOf(area)}`)}.`],
      meta: { kind: 'composite', W, H, tb, th, area },
    };
  },
});

// ---------------------------------------------------------------- parallel lines and transversal
type Dir = 'up' | 'down' | 'left' | 'right';

/**
 * Rays (along the transversal, along the parallel line) delimiting angle 1 (top
 * intersection) and angle 2 (bottom), so that the stated relation holds.
 * The transversal rises to the right, making an acute angle with the lines.
 */
export function parallelAngleRays(rel: 'corresponding' | 'alternate' | 'same-side', acute1: boolean): { top: [Dir, Dir]; bottom: [Dir, Dir] } {
  if (rel === 'corresponding') return { top: ['up', acute1 ? 'right' : 'left'], bottom: ['up', acute1 ? 'right' : 'left'] };
  const top: [Dir, Dir] = ['down', acute1 ? 'left' : 'right']; // interior angle at the top
  if (rel === 'alternate') return { top, bottom: ['up', acute1 ? 'right' : 'left'] };
  return { top, bottom: ['up', acute1 ? 'left' : 'right'] };
}
export const satParallelAngles = defineGenerator({
  id: 'sat-parallel-angles',
  subject: 'sat',
  skill: 'geo-lines-angles',
  title: 'Angles with parallel lines',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 80,
  build(rng, d, f) {
    const theta = rng.int(35, 80); // acute angle between transversal and the lines
    const rel = rng.pick(['corresponding', 'alternate', 'same-side'] as const);
    // angle 1 at upper intersection, angle 2 at lower intersection
    const a1 = rng.bool() ? theta : 180 - theta;
    const a2 = rel === 'same-side' ? 180 - a1 : a1;
    // expressions p x + q for both angles with integer x
    const x = rng.int(5, 25);
    const p1 = rng.int(2, 5);
    let p2 = rng.int(1, 6);
    if (p2 === p1) p2 += 1;
    const q1 = a1 - p1 * x;
    const q2 = a2 - p2 * x;
    // figure: transversal t rises to the right with acute angle theta to the parallel lines
    const svg = new SvgBuilder(320, 220);
    const yTop = 60;
    const yBot = 160;
    svg.line([20, yTop], [300, yTop]).line([20, yBot], [300, yBot]);
    svg.text([300, yTop - 12], 'ℓ', { italic: true }).text([300, yBot - 12], 'm', { italic: true });
    const dx = (yBot - yTop) / Math.tan(theta * DEG);
    const T: Pt = [160 + dx / 2, yTop];
    const Bt: Pt = [160 - dx / 2, yBot];
    const u: Pt = [Math.cos(theta * DEG), -Math.sin(theta * DEG)]; // up along t (SVG y points down)
    svg.line([Bt[0] - u[0] * 45, Bt[1] - u[1] * 45], [T[0] + u[0] * 45, T[1] + u[1] * 45]);
    svg.text([T[0] + u[0] * 55, T[1] + u[1] * 55], 't', { italic: true });
    const ray = (o: Pt, dir: 'up' | 'down' | 'left' | 'right'): Pt =>
      dir === 'up' ? [o[0] + u[0] * 30, o[1] + u[1] * 30] : dir === 'down' ? [o[0] - u[0] * 30, o[1] - u[1] * 30] : [o[0] + (dir === 'right' ? 40 : -40), o[1]];
    const { top, bottom } = parallelAngleRays(rel, a1 === theta);
    svg.angleArc(T, ray(T, top[0]), ray(T, top[1]), 16, '1');
    svg.angleArc(Bt, ray(Bt, bottom[0]), ray(Bt, bottom[1]), 16, '2');
    const word = { corresponding: 'corresponding angles', alternate: 'alternate interior angles', 'same-side': 'same-side interior angles' }[rel];
    const relation = rel === 'same-side' ? 'supplementary' : 'congruent';
    const askAngle = d === 'hard';
    const ans = askAngle ? a2 : x;
    return {
      prompt: `In the figure, line ${m('\\ell')} is parallel to line ${m('m')}, and both are intersected by line ${m('t')}. The measure of angle 1 is ${m(`(${lin([[p1, 'x']], q1)})^\\circ`)} and the measure of angle 2 is ${m(`(${lin([[p2, 'x']], q2)})^\\circ`)}. ${askAngle ? 'What is the measure, in degrees, of angle 2?' : `What is the value of ${m('x')}?`}`,
      figure: svgFig(svg, `Two parallel lines cut by a transversal; angles 1 and 2 are ${rel} angles`),
      ...numAnswer(rng, f, frac(ans), [
        { v: askAngle ? 180 - a2 : rel === 'same-side' ? (q1 - q2) / (p2 - p1) : (180 - q1 - q2) / (p1 + p2), e: 'cours' },
        { v: askAngle ? a1 + 10 : x + 5, e: 'calcul' },
        { v: askAngle ? x : a1, e: 'lecture' },
      ]),
      hints: [`Angles 1 and 2 are ${word}: they are ${relation}.`, rel === 'same-side' ? `Write ${m(`(${lin([[p1, 'x']], q1)}) + (${lin([[p2, 'x']], q2)}) = 180`)}.` : `Write ${m(`${lin([[p1, 'x']], q1)} = ${lin([[p2, 'x']], q2)}`)}.`],
      solution: [
        rel === 'same-side' ? `${m(`${lin([[p1 + p2, 'x']], q1 + q2)} = 180`)}.` : `${m(`${lin([[p1 - p2, 'x']])} = ${q2 - q1}`)}.`,
        `${m(`x = ${x}`)}.`,
        askAngle ? `Angle 2: ${m(`${p2} \\times ${x}${signed(q2)} = ${a2}^\\circ`)}.` : `${m(`x = ${x}`)} (angle 1 ${m(`= ${a1}^\\circ`)}, angle 2 ${m(`= ${a2}^\\circ`)}).`,
      ],
      meta: { rel, a1, a2, x, p1, q1, p2, q2, ans },
    };
  },
});

// ---------------------------------------------------------------- triangle angles
export const satTriangleAngles = defineGenerator({
  id: 'sat-triangle-angles',
  subject: 'sat',
  skill: 'geo-lines-angles',
  title: 'Angles in triangles',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 70,
  build(rng, d, f) {
    if (d === 'medium') {
      // exterior angle theorem
      const A = rng.int(25, 80);
      const B = rng.int(25, 150 - A);
      const ext = A + B;
      const pts: Pt[] = [
        [0, 0],
        [6, 0],
        [2 + rng.next() * 2, 3 + rng.next()],
      ];
      const { svg, P } = polyFigure([pts[0], pts[1], pts[2]], ['A', 'B', 'C']);
      // extend AB beyond B to D
      const D: Pt = [P[1][0] + (P[1][0] - P[0][0]) * 0.35, P[1][1] + (P[1][1] - P[0][1]) * 0.35];
      svg.line(P[1], D).text([D[0] + 4, D[1] + 14], 'D');
      svg.angleArc(P[0], P[1], P[2], 18, `${A}°`);
      svg.angleArc(P[2], P[0], P[1], 18, `${B}°`);
      svg.angleArc(P[1], D, P[2], 16, 'x°');
      return {
        prompt: `In triangle ${m('ABC')}, side ${m('\\overline{AB}')} is extended to point ${m('D')}. The measure of angle ${m('A')} is ${m(`${A}^\\circ`)} and the measure of angle ${m('C')} is ${m(`${B}^\\circ`)}. What is the value of ${m('x')}, the measure in degrees of angle ${m('CBD')}?`,
        figure: svgFig(svg, `Triangle ABC with AB extended to D; angle A = ${A}°, angle C = ${B}°`),
        ...numAnswer(rng, f, frac(ext), [
          { v: 180 - ext, e: 'cours' },
          { v: 180 - A, e: 'methode' },
          { v: 360 - ext, e: 'cours' },
        ]),
        hints: ['An exterior angle of a triangle equals the sum of the two remote interior angles.', 'Angle $ABC$ and angle $CBD$ form a straight line.'],
        solution: [`Angle ${m('ABC')} ${m(`= 180 - ${A} - ${B} = ${180 - ext}`)}.`, `${m(`x = 180 - ${180 - ext}`)}.`, `${m(`x = ${ext}`)}.`],
        meta: { kind: 'exterior', A, B, ans: ext },
      };
    }
    // isosceles with expressions: AB = AC, angle B = (p x + q), angle A = (r x + s) -> find angle A
    const apex = 2 * rng.int(10, 60); // even so base angles integer
    const base = (180 - apex) / 2;
    const x = rng.int(4, 20);
    const p = rng.int(2, 5);
    const q = base - p * x;
    return {
      prompt: `In triangle ${m('ABC')}, ${m('AB = AC')}. The measure of angle ${m('B')} is ${m(`(${lin([[p, 'x']], q)})^\\circ`)} and the measure of angle ${m('A')} is ${m(`(${lin([[2 * p, 'x']], apex - 2 * p * x)})^\\circ`)}. What is the measure, in degrees, of angle ${m('A')}?`,
      ...numAnswer(rng, f, frac(apex), [
        { v: base, e: 'lecture' },
        { v: 180 - 2 * apex > 0 ? 180 - 2 * apex : apex + 10, e: 'cours' },
        { v: x, e: 'lecture' },
      ]),
      hints: ['In an isosceles triangle, the angles opposite the equal sides are equal; the three angles sum to 180°.', `Angles ${m('B')} and ${m('C')} are both ${m(`(${lin([[p, 'x']], q)})^\\circ`)}.`],
      solution: [`${m(`2(${lin([[p, 'x']], q)}) + (${lin([[2 * p, 'x']], apex - 2 * p * x)}) = 180`)}.`, `${m(`${4 * p}x${signed(2 * q + apex - 2 * p * x)} = 180`)}, so ${m(`x = ${x}`)}.`, `Angle ${m('A')} ${m(`= ${apex}^\\circ`)}.`],
      meta: { kind: 'isosceles', apex, base, x, p, q, ans: apex },
    };
  },
});

// ---------------------------------------------------------------- similar triangles
export const satSimilar = defineGenerator({
  id: 'sat-similar',
  subject: 'sat',
  skill: 'geo-lines-angles',
  title: 'Similar triangles',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 90,
  build(rng, d, f) {
    // triangle ABC, D on AB, E on AC, DE ∥ BC. AD = a, DB = b, DE = e -> BC = e (a + b)/a
    const a = rng.int(2, 9);
    const b = rng.int(1, 9);
    const e = a * rng.int(1, 4);
    const BC = frac(e * (a + b), a);
    const A: Pt = [rng.int(1, 3), 5];
    const B: Pt = [0, 0];
    const C: Pt = [7, 0];
    const t = a / (a + b);
    const Dp: Pt = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
    const Ep: Pt = [A[0] + (C[0] - A[0]) * t, A[1] + (C[1] - A[1]) * t];
    const map = fitter([A, B, C], 300, 230, 32);
    const [PA, PB, PC, PD, PE] = [A, B, C, Dp, Ep].map(map);
    const svg = new SvgBuilder(300, 230);
    svg.polygon([PA, PB, PC]).line(PD, PE);
    const c = centroid([PA, PB, PC]);
    svg.vertexLabel(PA, c, 'A').vertexLabel(PB, c, 'B').vertexLabel(PC, c, 'C');
    svg.text([PD[0] - 14, PD[1]], 'D').text([PE[0] + 14, PE[1]], 'E');
    if (d === 'medium') {
      svg.segmentLabel(PA, PD, `${a}`, PE).segmentLabel(PD, PB, `${b}`, PE).segmentLabel(PD, PE, `${e}`, PA);
      return {
        prompt: `In the figure, ${m('\\overline{DE}')} is parallel to ${m('\\overline{BC}')}, ${m(`AD = ${a}`)}, ${m(`DB = ${b}`)}, and ${m(`DE = ${e}`)}. What is the length of ${m('\\overline{BC}')}?`,
        figure: svgFig(svg, `Triangle ABC with segment DE parallel to BC; AD = ${a}, DB = ${b}, DE = ${e}`),
        ...numAnswer(rng, f, BC, [
          { v: frac(e * b, a), e: 'methode' },
          { v: e + b, e: 'methode' },
          { v: frac(e * a, a + b), e: 'calcul' },
        ]),
        hints: ['Because DE ∥ BC, triangle ADE is similar to triangle ABC.', `Ratio of similarity: ${m(`\\frac{AB}{AD} = \\frac{${a + b}}{${a}}`)}.`],
        solution: [`${m(`\\triangle ADE \\sim \\triangle ABC`)} (corresponding angles).`, `${m(`\\frac{BC}{DE} = \\frac{AB}{AD}`)}, so ${m(`BC = ${e} \\times \\frac{${a + b}}{${a}}`)}.`, `${m(`BC = ${fr(BC)}`)}.`],
        meta: { kind: 'length', a, b, e, ans: BC },
      };
    }
    // hard: area of triangle ADE given area of ABC
    const area = (a + b) ** 2 * rng.int(1, 3);
    const small = frac(area * a * a, (a + b) ** 2);
    svg.segmentLabel(PA, PD, `${a}`, PE).segmentLabel(PD, PB, `${b}`, PE);
    return {
      prompt: `In the figure, ${m('\\overline{DE}')} is parallel to ${m('\\overline{BC}')}, ${m(`AD = ${a}`)}, and ${m(`DB = ${b}`)}. The area of triangle ${m('ABC')} is ${m(`${area}`)}. What is the area of triangle ${m('ADE')}?`,
      figure: svgFig(svg, `Triangle ABC with DE parallel to BC; AD = ${a}, DB = ${b}`),
      ...numAnswer(rng, f, small, [
        { v: frac(area * a, a + b), e: 'cours' },
        { v: F.sub(frac(area), small), e: 'lecture' },
        { v: frac(area * a * a, b * b), e: 'methode' },
      ]),
      hints: ['If two similar figures have a length ratio $k$, their areas have ratio $k^2$.', `Length ratio ${m(`\\frac{AD}{AB} = \\frac{${a}}{${a + b}}`)}.`],
      solution: [`${m('\\triangle ADE \\sim \\triangle ABC')} with ratio ${m(`\\frac{${a}}{${a + b}}`)}.`, `Area ratio ${m(`\\left(\\frac{${a}}{${a + b}}\\right)^2 = \\frac{${a * a}}{${(a + b) ** 2}}`)}.`, `Area of ${m('ADE')}: ${m(`${area} \\times \\frac{${a * a}}{${(a + b) ** 2}} = ${fr(small)}`)}.`],
      meta: { kind: 'area', a, b, area, ans: small },
    };
  },
});

// ---------------------------------------------------------------- right triangles
const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
];

function rightTriangleFig(legA: number, legB: number, labels: { a?: string; b?: string; c?: string }, names = ['A', 'B', 'C']) {
  // right angle at C (index 2)
  const pts: Pt[] = [
    [0, legA],
    [legB, 0],
    [0, 0],
  ];
  const { svg, P, c } = polyFigure(pts, names);
  svg.rightAngle(P[2], P[0], P[1], 10);
  if (labels.a) svg.segmentLabel(P[2], P[0], labels.a, c);
  if (labels.b) svg.segmentLabel(P[2], P[1], labels.b, c);
  if (labels.c) svg.segmentLabel(P[0], P[1], labels.c, c);
  return svg;
}

export const satRightTriangle = defineGenerator({
  id: 'sat-right-triangle',
  subject: 'sat',
  skill: 'geo-right-trig',
  title: 'Pythagorean theorem and special right triangles',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 85,
  build(rng, d, f) {
    const kind = d === 'medium' ? 'pythagoras' : rng.pick(['30-60-90', '45-45-90'] as const);
    if (kind === 'pythagoras') {
      const [p, q, r] = rng.pick(TRIPLES);
      const k = rng.int(1, p > 7 ? 2 : 4);
      const [a, b, c] = [p * k, q * k, r * k];
      const missing = rng.pick(['hyp', 'leg'] as const);
      const svg = rightTriangleFig(a, b, missing === 'hyp' ? { a: `${a}`, b: `${b}`, c: '?' } : { a: `${a}`, c: `${c}`, b: '?' });
      const ans = missing === 'hyp' ? c : b;
      return {
        prompt: `In right triangle ${m('ABC')}, angle ${m('C')} is a right angle, ${m(`AC = ${a}`)}, and ${missing === 'hyp' ? m(`BC = ${b}`) : m(`AB = ${c}`)}. What is the length of ${missing === 'hyp' ? m('\\overline{AB}') : m('\\overline{BC}')}?`,
        figure: svgFig(svg, `Right triangle ABC with right angle at C`),
        ...numAnswer(rng, f, frac(ans), [
          { v: missing === 'hyp' ? a + b : c - a, e: 'cours' },
          { v: missing === 'hyp' ? Math.round(Math.sqrt(a * a + b * b) + 1) : Math.round(Math.sqrt(c * c + a * a)), e: 'methode' },
          { v: missing === 'hyp' ? (a * b) / 2 : c + a, e: 'cours' },
        ]),
        hints: ['Pythagorean theorem: $(\\text{leg})^2 + (\\text{leg})^2 = (\\text{hypotenuse})^2$; the hypotenuse is opposite the right angle.', missing === 'hyp' ? `${m(`AB^2 = ${a}^2 + ${b}^2`)}.` : `${m(`BC^2 = ${c}^2 - ${a}^2`)}.`],
        solution: missing === 'hyp' ? [`${m(`AB^2 = ${a * a} + ${b * b} = ${c * c}`)}.`, `${m(`AB = \\sqrt{${c * c}}`)}.`, `${m(`AB = ${c}`)}.`] : [`${m(`BC^2 = ${c * c} - ${a * a} = ${b * b}`)}.`, `${m(`BC = \\sqrt{${b * b}}`)}.`, `${m(`BC = ${b}`)}.`],
        meta: { kind, a, b, c, missing, ans },
      };
    }
    if (kind === '30-60-90') {
      const s = rng.int(2, 12); // short leg
      const given = rng.pick(['hyp', 'short'] as const);
      // ask: long leg = s√3 -> "k√3, k = ?" or area = s^2√3/2 -> "k√3"
      const askArea = rng.bool();
      const k = askArea ? frac(s * s, 2) : frac(s);
      const g = given === 'hyp' ? `the hypotenuse has length ${m(`${2 * s}`)}` : `the side opposite the ${m('30^\\circ')} angle has length ${m(`${s}`)}`;
      return {
        prompt: `In a right triangle, one angle measures ${m('30^\\circ')} and ${g}. The ${askArea ? 'area of the triangle' : 'length of the longer leg'} can be written as ${m('k\\sqrt{3}')}, where ${m('k')} is a constant. What is the value of ${m('k')}?`,
        ...numAnswer(rng, f, k, [
          { v: askArea ? s * s : 2 * s, e: askArea ? 'cours' : 'cours' },
          { v: askArea ? frac(s * s, 4) : frac(s, 2), e: 'calcul' },
          { v: askArea ? 2 * s * s : 3 * s, e: 'cours' },
        ]),
        hints: ['In a 30°-60°-90° triangle the sides are in the ratio $1 : \\sqrt{3} : 2$ (short leg : long leg : hypotenuse).', given === 'hyp' ? `The short leg is half the hypotenuse.` : `The long leg is ${m('\\sqrt{3}')} times the short leg.`],
        solution: [`Short leg ${m(`= ${s}`)}, long leg ${m(`= ${s}\\sqrt{3}`)}, hypotenuse ${m(`= ${2 * s}`)}.`, askArea ? `Area ${m(`= \\frac{1}{2} \\times ${s} \\times ${s}\\sqrt{3} = ${fr(k)}\\sqrt{3}`)}.` : `Longer leg ${m(`= ${s}\\sqrt{3}`)}.`, `${m(`k = ${fr(k)}`)}.`],
        meta: { kind, s, askArea, k },
      };
    }
    // 45-45-90: hypotenuse given as h√2 or leg given
    const leg = rng.int(2, 15);
    const askPerimeterPart = rng.bool();
    if (askPerimeterPart) {
      // diagonal of a square with side leg = leg√2 -> k
      return {
        prompt: `A square has a side length of ${m(`${leg}`)}. The length of a diagonal of the square can be written as ${m('k\\sqrt{2}')}. What is the value of ${m('k')}?`,
        ...numAnswer(rng, f, frac(leg), [
          { v: 2 * leg, e: 'cours' },
          { v: frac(leg, 2), e: 'cours' },
          { v: leg * leg, e: 'methode' },
        ]),
        hints: ['A diagonal splits the square into two 45°-45°-90° triangles: sides in ratio $1 : 1 : \\sqrt{2}$.', `Each leg of the triangle is ${m(`${leg}`)}.`],
        solution: [`Diagonal ${m(`= \\sqrt{${leg}^2 + ${leg}^2} = \\sqrt{${2 * leg * leg}}`)}.`, `${m(`= ${leg}\\sqrt{2}`)}.`, `${m(`k = ${leg}`)}.`],
        meta: { kind, leg, k: frac(leg) },
      };
    }
    // hypotenuse 2m -> leg = m√2 ; ask area = (m√2)^2/2 = m^2
    const mm = rng.int(2, 12);
    return {
      prompt: `An isosceles right triangle has a hypotenuse of length ${m(`${mm}\\sqrt{2}`)}. What is the area of the triangle?`,
      ...numAnswer(rng, f, frac(mm * mm, 2), [
        { v: mm * mm, e: 'cours' },
        { v: 2 * mm * mm, e: 'calcul' },
        { v: frac(mm * mm, 4), e: 'calcul' },
      ]),
      hints: ['In a 45°-45°-90° triangle, each leg is $\\frac{\\text{hypotenuse}}{\\sqrt{2}}$.', `Each leg: ${m(`\\frac{${mm}\\sqrt{2}}{\\sqrt{2}}`)}.`],
      solution: [`Each leg ${m(`= ${mm}`)}.`, `Area ${m(`= \\frac{1}{2} \\times ${mm} \\times ${mm}`)}.`, `${m(`= ${fr(frac(mm * mm, 2))}`)}.`],
      meta: { kind, mm, k: frac(mm * mm, 2) },
    };
  },
});

// ---------------------------------------------------------------- trig ratios
export const satTrig = defineGenerator({
  id: 'sat-trig',
  subject: 'sat',
  skill: 'geo-right-trig',
  title: 'Sine, cosine and tangent',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 80,
  build(rng, d, f) {
    const kind = d === 'medium' ? rng.pick(['ratio', 'complementary'] as const) : rng.pick(['other-angle', 'cofunction'] as const);
    if (kind === 'ratio' || kind === 'other-angle') {
      const [p, q, r] = rng.pick(TRIPLES);
      const k = rng.int(1, 3);
      const [a, b, c] = [p * k, q * k, r * k]; // AC = a, BC = b, AB = c, right angle at C
      const fn = rng.pick(['sin', 'cos', 'tan'] as const);
      // angle A: opposite = BC = b, adjacent = AC = a
      const val = fn === 'sin' ? frac(b, c) : fn === 'cos' ? frac(a, c) : frac(b, a);
      if (kind === 'ratio') {
        const svg = rightTriangleFig(a, b, { a: `${a}`, b: `${b}`, c: `${c}` });
        return {
          prompt: `In right triangle ${m('ABC')}, angle ${m('C')} is a right angle, ${m(`AC = ${a}`)}, ${m(`BC = ${b}`)}, and ${m(`AB = ${c}`)}. What is the value of ${m(`\\${fn} A`)}?`,
          figure: svgFig(svg, `Right triangle ABC with right angle at C, AC = ${a}, BC = ${b}, AB = ${c}`),
          ...numAnswer(rng, f, val, [
            { v: fn === 'sin' ? frac(a, c) : fn === 'cos' ? frac(b, c) : frac(a, b), e: 'cours' },
            { v: fn === 'tan' ? frac(b, c) : frac(c, fn === 'sin' ? b : a), e: 'cours' },
            { v: fn === 'tan' ? frac(c, a) : frac(fn === 'sin' ? b : a, fn === 'sin' ? a : b), e: 'cours' },
          ]),
          hints: ['SOH CAH TOA: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent.', `For angle ${m('A')}: the opposite side is ${m('BC')}, the adjacent side is ${m('AC')}.`],
          solution: [`Opposite ${m(`= ${b}`)}, adjacent ${m(`= ${a}`)}, hypotenuse ${m(`= ${c}`)}.`, `${m(`\\${fn} A = ${fn === 'sin' ? `\\frac{${b}}{${c}}` : fn === 'cos' ? `\\frac{${a}}{${c}}` : `\\frac{${b}}{${a}}`}`)}.`, `${m(`= ${fr(val)}`)}.`],
          meta: { kind, a, b, c, fn, ans: val },
        };
      }
      // other-angle: given sin A = b/c (only ratio), find tan B or cos B
      const target = rng.pick(['cos B', 'tan B', 'sin B'] as const);
      const ans = target === 'cos B' ? frac(b, c) : target === 'tan B' ? frac(a, b) : frac(a, c);
      return {
        prompt: `In triangle ${m('ABC')}, angle ${m('C')} is a right angle and ${m(`\\sin A = ${fr(frac(b, c))}`)}. What is the value of ${m(`\\${target}`)}?`,
        ...numAnswer(rng, f, ans, [
          { v: target === 'cos B' ? frac(a, c) : target === 'tan B' ? frac(b, a) : frac(b, c), e: 'cours' },
          { v: target === 'tan B' ? frac(a, c) : frac(c, b), e: 'cours' },
          { v: target === 'sin B' ? frac(b, a) : frac(c, a), e: 'calcul' },
        ]),
        hints: ['Draw the triangle and label the sides using $\\sin A$; find the missing side with the Pythagorean theorem.', `Take ${m(`BC = ${q}`)} and ${m(`AB = ${r}`)} (any multiple works).`],
        solution: [`${m(`BC = ${q}`)}, ${m(`AB = ${r}`)}, so ${m(`AC = \\sqrt{${r * r} - ${q * q}} = ${p}`)}.`, `For angle ${m('B')}: opposite side ${m('AC')}, adjacent side ${m('BC')}.`, `${m(`\\${target} = ${fr(ans)}`)}.`],
        meta: { kind, a, b, c, target, ans },
      };
    }
    if (kind === 'complementary') {
      const A = rng.int(10, 80);
      const B = 90 - A;
      const fn = rng.pick(['sin', 'cos'] as const);
      const other = fn === 'sin' ? 'cos' : 'sin';
      const v = rng.pick(['0.6', '0.28', '0.8', '0.96', '0.45']);
      return {
        prompt: `In right triangle ${m('ABC')}, angle ${m('C')} is a right angle and ${m(`\\${fn}(A) = ${v}`)}. What is the value of ${m(`\\${other}(B)`)}?`,
        ...numAnswer(rng, f, frac(Math.round(Number(v) * 100), 100), [
          { v: 1 - Number(v), e: 'cours' },
          { v: Math.round(Math.sqrt(1 - Number(v) ** 2) * 100) / 100, e: 'cours' },
          { v: Math.round((1 / Number(v)) * 100) / 100, e: 'calcul' },
        ]),
        hints: ['Angles $A$ and $B$ are complementary ($A + B = 90^\\circ$).', `For complementary angles, ${m('\\sin A = \\cos B')} and ${m('\\cos A = \\sin B')}.`],
        solution: [`${m(`A + B = 90^\\circ`)}.`, `The side opposite ${m('A')} is adjacent to ${m('B')}, so ${m(`\\${other}(B) = \\${fn}(A)`)}.`, `${m(`\\${other}(B) = ${v}`)}.`],
        meta: { kind, A, B, v: Number(v), ans: Number(v) },
      };
    }
    // cofunction: sin((a x + b)°) = cos((c x + e)°), angles acute -> (a + c) x + b + e = 90
    const x = rng.int(3, 15);
    const a = rng.int(1, 4);
    const c = rng.int(1, 4);
    const A = rng.int(15, 70);
    const b = A - a * x;
    const e = 90 - A - c * x;
    return {
      prompt: `${m(`\\sin\\left((${lin([[a, 'x']], b)})^\\circ\\right) = \\cos\\left((${lin([[c, 'x']], e)})^\\circ\\right)`)}\n\nIn the given equation, both angle measures are between ${m('0^\\circ')} and ${m('90^\\circ')}. What is the value of ${m('x')}?`,
      ...numAnswer(rng, f, frac(x), [
        { v: frac(e - b, a - c || 1), e: 'cours' },
        { v: frac(180 - b - e, a + c), e: 'cours' },
        { v: frac(90 + b + e, a + c), e: 'calcul' },
      ]),
      hints: ['$\\sin(\\theta^\\circ) = \\cos(\\varphi^\\circ)$ for acute angles exactly when $\\theta + \\varphi = 90$.', `${m(`(${lin([[a, 'x']], b)}) + (${lin([[c, 'x']], e)}) = 90`)}.`],
      solution: [`${m(`${lin([[a + c, 'x']], b + e)} = 90`)}.`, `${m(`${a + c}x = ${90 - b - e}`)}.`, `${m(`x = ${x}`)}.`],
      meta: { kind, a, b, c, e, x, ans: x },
    };
  },
});

// ---------------------------------------------------------------- circles: equations
export const satCircleEq = defineGenerator({
  id: 'sat-circle-eq',
  subject: 'sat',
  skill: 'geo-circles',
  title: 'Equation of a circle (completing the square)',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 95,
  build(rng, d, f) {
    const h = rng.int(-8, 8);
    const k = rng.int(-8, 8);
    const r = rng.int(1, 10);
    if (d === 'medium') {
      const ask = f === 'mcq' ? 'center' : 'radius';
      if (ask === 'center') {
        const fmt = (a: number, b: number) => m(`(${a}, ${b})`);
        return {
          prompt: `The equation ${m(`(x${signed(-h)})^2 + (y${signed(-k)})^2 = ${r * r}`)} represents a circle in the ${m('xy')}-plane. What are the coordinates of the center of the circle?`.replace('(x)^2', 'x^2').replace('(y)^2', 'y^2'),
          ...textMcq(rng, fmt(h, k), [
            { t: fmt(-h, -k), e: 'cours' },
            { t: fmt(k, h), e: 'lecture' },
            { t: fmt(h, -k), e: 'calcul' },
            { t: fmt(-h, k), e: 'calcul' },
          ], () => fmt(h + rng.nonZero(-3, 3), k + rng.nonZero(-3, 3))),
          hints: ['The circle $(x - h)^2 + (y - k)^2 = r^2$ has center $(h, k)$.', 'Watch the signs: $x + 3 = x - (-3)$.'],
          solution: [`Write the equation as ${m(`(x - ${paren(h)})^2 + (y - ${paren(k)})^2 = ${r}^2`)}.`, `So ${m(`h = ${h}`)} and ${m(`k = ${k}`)}.`, `Center ${fmt(h, k)}.`],
          meta: { kind: 'center', h, k, r },
        };
      }
      return {
        prompt: `The equation ${m(`(x${signed(-h)})^2 + (y${signed(-k)})^2 = ${r * r}`)} represents a circle in the ${m('xy')}-plane. What is the radius of the circle?`,
        ...numAnswer(rng, f, frac(r), [{ v: r * r, e: 'cours' }, { v: frac(r * r, 2), e: 'cours' }, { v: Math.abs(h) + Math.abs(k), e: 'lecture' }]),
        hints: ['The right side of $(x - h)^2 + (y - k)^2 = r^2$ is the radius SQUARED.', `${m(`r^2 = ${r * r}`)}.`],
        solution: [`${m(`r^2 = ${r * r}`)}.`, `${m(`r = \\sqrt{${r * r}}`)}.`, `${m(`r = ${r}`)}.`],
        meta: { kind: 'radius', h, k, r },
      };
    }
    // general form: x^2 + y^2 + D x + E y + F = 0
    const Dc = -2 * h;
    const Ec = -2 * k;
    const Fc = h * h + k * k - r * r;
    const askR2 = rng.bool(0.3);
    const ans = askR2 ? r * r : r;
    return {
      prompt: `${m(`x^2 + y^2${tSigned(Dc, 'x')}${tSigned(Ec, 'y')}${signed(Fc)} = 0`)}\n\nThe equation above defines a circle in the ${m('xy')}-plane. What is the ${askR2 ? 'square of the radius' : 'radius'} of the circle?`,
      ...numAnswer(rng, f, frac(ans), [
        { v: askR2 ? -Fc : Math.round(Math.sqrt(Math.abs(Fc)) * 100) / 100, e: 'methode' },
        { v: askR2 ? r : r * r, e: 'cours' },
        { v: askR2 ? h * h + k * k : Math.abs(h) + Math.abs(k), e: 'calcul' },
      ]),
      hints: ['Complete the square in $x$ and in $y$ to get the form $(x - h)^2 + (y - k)^2 = r^2$.', `${m(`x^2 ${Dc < 0 ? '-' : '+'} ${Math.abs(Dc)}x = (x${signed(-h)})^2 - ${h * h}`)}.`],
      solution: [
        `${m(`(x${signed(-h)})^2 - ${h * h} + (y${signed(-k)})^2 - ${k * k}${signed(Fc)} = 0`)}.`,
        `${m(`(x${signed(-h)})^2 + (y${signed(-k)})^2 = ${r * r}`)}.`,
        askR2 ? `${m(`r^2 = ${r * r}`)}.` : `${m(`r = ${r}`)}.`,
      ].map((s) => s.replace(/\(x\)\^2/g, 'x^2').replace(/\(y\)\^2/g, 'y^2')),
      meta: { kind: 'general', h, k, r, D: Dc, E: Ec, F: Fc, ans },
    };
  },
});

// ---------------------------------------------------------------- arcs, sectors, radians, inscribed angles
export const satArcs = defineGenerator({
  id: 'sat-arcs',
  subject: 'sat',
  skill: 'geo-circles',
  title: 'Arcs, sectors, radians and inscribed angles',
  formats: ['mcq', 'spr'],
  difficulties: ['medium', 'hard'],
  targetSec: 85,
  build(rng, d, f) {
    const kind = d === 'medium' ? rng.pick(['arc-deg', 'radians', 'inscribed'] as const) : rng.pick(['sector-rad', 'arc-to-angle'] as const);
    const circleFig = (deg: number, label: string, rLabel: string) => {
      const svg = new SvgBuilder(240, 220);
      const O: Pt = [120, 110];
      const R = 80;
      svg.circle(O, R).dot(O, 3).text([O[0] - 10, O[1] + 14], 'O');
      const A: Pt = [O[0] + R, O[1]];
      const Bp: Pt = [O[0] + R * Math.cos(-deg * DEG), O[1] + R * Math.sin(-deg * DEG)];
      svg.line(O, A).line(O, Bp).text([A[0] + 12, A[1]], 'A').text([Bp[0] + 12 * Math.cos(-deg * DEG), Bp[1] + 12 * Math.sin(-deg * DEG)], 'B');
      svg.angleArc(O, A, Bp, 20, label);
      svg.segmentLabel(O, A, rLabel, Bp);
      return svgFig(svg, `Circle with center O, radius ${rLabel}, central angle AOB ${label}`);
    };
    if (kind === 'arc-deg') {
      const deg = rng.pick([30, 40, 45, 60, 72, 90, 120, 135, 150]);
      const r = rng.int(2, 18);
      const k = frac(deg * r, 180); // arc = (deg/360) 2πr = k π
      return {
        prompt: `A circle with center ${m('O')} has a radius of ${m(`${r}`)}. Central angle ${m('AOB')} measures ${m(`${deg}^\\circ`)}. The length of minor arc ${m('AB')} is ${m('k\\pi')}. What is the value of ${m('k')}?`,
        figure: circleFig(deg, `${deg}°`, `${r}`),
        ...numAnswer(rng, f, k, [
          { v: frac(deg * r * r, 360), e: 'cours' },
          { v: frac(deg * r, 360), e: 'cours' },
          { v: frac(deg, 180), e: 'methode' },
        ]),
        hints: ['Arc length = (central angle / 360°) × circumference.', `Circumference: ${m(`2\\pi \\times ${r} = ${2 * r}\\pi`)}.`],
        solution: [`${m(`\\frac{${deg}}{360} \\times ${2 * r}\\pi`)}.`, `${m(`= ${fr(k)}\\pi`)}.`, `${m(`k = ${fr(k)}`)}.`],
        meta: { kind, deg, r, ans: k },
      };
    }
    if (kind === 'radians') {
      const deg = rng.pick([20, 30, 36, 40, 45, 60, 75, 90, 120, 135, 150, 210, 240, 270, 300, 315]);
      const k = frac(deg, 180);
      return {
        prompt: `An angle measures ${m(`${deg}^\\circ`)}. Its measure in radians is ${m('k\\pi')}. What is the value of ${m('k')}?`,
        ...numAnswer(rng, f, k, [
          { v: frac(deg, 360), e: 'cours' },
          { v: frac(180, deg), e: 'cours' },
          { v: frac(deg, 90), e: 'calcul' },
        ]),
        hints: ['$180^\\circ = \\pi$ radians.', `Multiply by ${m('\\frac{\\pi}{180}')}.`],
        solution: [`${m(`${deg} \\times \\frac{\\pi}{180}`)}.`, `${m(`= ${fr(k)}\\pi`)}.`, `${m(`k = ${fr(k)}`)}.`],
        meta: { kind, deg, ans: k },
      };
    }
    if (kind === 'inscribed') {
      const central = 2 * rng.int(20, 85);
      const askCentral = rng.bool();
      const ans = askCentral ? central : central / 2;
      return {
        prompt: askCentral
          ? `Points ${m('A')}, ${m('B')}, and ${m('C')} lie on a circle with center ${m('O')}. Inscribed angle ${m('ACB')} measures ${m(`${central / 2}^\\circ`)} and intercepts arc ${m('AB')}. What is the measure, in degrees, of central angle ${m('AOB')}?`
          : `Points ${m('A')}, ${m('B')}, and ${m('C')} lie on a circle with center ${m('O')}. Central angle ${m('AOB')} measures ${m(`${central}^\\circ`)}, and point ${m('C')} is on the major arc ${m('AB')}. What is the measure, in degrees, of angle ${m('ACB')}?`,
        ...numAnswer(rng, f, frac(ans), [
          { v: askCentral ? central / 2 : central, e: 'cours' },
          { v: 180 - ans, e: 'cours' },
          { v: 360 - central, e: 'cours' },
        ]),
        hints: ['An inscribed angle is half the central angle that intercepts the same arc.', askCentral ? 'So the central angle is twice the inscribed angle.' : 'Both angles intercept arc $AB$.'],
        solution: [`Inscribed angle ${m('= \\frac{1}{2}')} × central angle.`, askCentral ? `${m(`AOB = 2 \\times ${central / 2}`)}.` : `${m(`ACB = \\frac{${central}}{2}`)}.`, `${m(`= ${ans}^\\circ`)}.`],
        meta: { kind, central, askCentral, ans },
      };
    }
    if (kind === 'sector-rad') {
      // sector area with angle p/q π radians and radius r: area = (θ/2) r^2
      const [p, q] = rng.pick([
        [1, 6],
        [1, 4],
        [1, 3],
        [2, 3],
        [3, 4],
        [5, 6],
        [1, 2],
      ] as [number, number][]);
      const r = rng.int(2, 12);
      const k = frac(p * r * r, 2 * q);
      return {
        prompt: `A sector of a circle with radius ${m(`${r}`)} has a central angle of ${m(`\\frac{${p === 1 ? '' : p}\\pi}{${q}}`)} radians. The area of the sector is ${m('k\\pi')}. What is the value of ${m('k')}?`,
        ...numAnswer(rng, f, k, [
          { v: frac(p * r, q), e: 'cours' },
          { v: frac(p * r * r, q), e: 'cours' },
          { v: frac(p * r * r, 4 * q), e: 'calcul' },
        ]),
        hints: ['Sector area = (central angle / 2π) × πr² (angle in radians).', `The full circle has area ${m(`${r * r}\\pi`)}.`],
        solution: [`Fraction of the circle: ${m(`\\frac{${p}\\pi/${q}}{2\\pi} = \\frac{${p}}{${2 * q}}`)}.`, `${m(`\\frac{${p}}{${2 * q}} \\times ${r * r}\\pi`)}.`, `${m(`k = ${fr(k)}`)}.`],
        meta: { kind, p, q, r, ans: k },
      };
    }
    // arc length & radius -> central angle in degrees
    const r = rng.int(2, 12);
    const deg = rng.pick([20, 30, 40, 45, 60, 72, 80, 90, 100, 120, 135, 150, 160]);
    const arc = frac(deg * r, 180);
    return {
      prompt: `In a circle with radius ${m(`${r}`)}, minor arc ${m('AB')} has length ${m(`${fr(arc)}\\pi`)}. What is the measure, in degrees, of central angle ${m('AOB')}?`,
      ...numAnswer(rng, f, frac(deg), [
        { v: frac(deg, 2), e: 'cours' },
        { v: frac(arc.n * 180, arc.d), e: 'methode' },
        { v: 360 - deg, e: 'lecture' },
      ]),
      hints: ['Arc length = (angle/360) × 2πr: solve for the angle.', `Circumference: ${m(`${2 * r}\\pi`)}.`],
      solution: [`${m(`\\frac{\\theta}{360} \\times ${2 * r}\\pi = ${fr(arc)}\\pi`)}.`, `${m(`\\theta = \\frac{${fr(arc)} \\times 360}{${2 * r}}`)}.`, `${m(`\\theta = ${deg}^\\circ`)}.`],
      meta: { kind, r, deg, arc, ans: deg },
    };
  },
});

export const GEOMETRY_GENERATORS = [satVolume, satArea, satParallelAngles, satTriangleAngles, satSimilar, satRightTriangle, satTrig, satCircleEq, satArcs];
