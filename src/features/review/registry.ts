import type { ComponentType } from 'react';
import type { SrsItem, SrsKind } from '../../types';

export interface ReviewProps {
  item: SrsItem;
  /** called once the item has been graded and saved */
  onDone: (correct: boolean) => void;
  compact?: boolean;
}

/** Subject modules register how their SRS items are reviewed. */
export const REVIEW_RENDERERS: Partial<Record<SrsKind, ComponentType<ReviewProps>>> = {};

export function registerReview(kind: SrsKind, c: ComponentType<ReviewProps>) {
  REVIEW_RENDERERS[kind] = c;
}
