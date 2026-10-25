/**
 * Blurting helper: suggests which key points seem present in a free text
 * (keyword overlap). Only a suggestion — Paul confirms each point himself.
 */
import { normalizeKey } from '../content/import';

const STOP = new Set(
  'le la les un une des du de d l et ou en au aux a à est sont par pour dans sur avec sans que qui quoi dont ce cet cette ces se sa son ses leur leurs il elle ils elles on ne pas plus moins tres très tout tous toute toutes the of and to in is'.split(' '),
);

export function keywords(s: string): string[] {
  return normalizeKey(s)
    .replace(/\$[^$]*\$/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 4 && !STOP.has(w))
    .map((w) => w.replace(/(s|x)$/, ''));
}

/** share of the point's keywords found in the text (0..1) */
export function coverage(point: string, text: string): number {
  const kp = [...new Set(keywords(point))];
  if (!kp.length) return 0;
  const kt = new Set(keywords(text));
  return kp.filter((w) => kt.has(w)).length / kp.length;
}

export function suggestRecalled(points: string[], text: string, threshold = 0.5): boolean[] {
  return points.map((p) => coverage(p, text) >= threshold);
}

export function gradeFromShare(share: number): 1 | 2 | 3 | 4 {
  return share >= 0.9 ? 4 : share >= 0.65 ? 3 : share >= 0.35 ? 2 : 1;
}
