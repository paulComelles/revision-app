import type { HgEventContent } from '../content/types';

/** Events in chronological order are correct if their sort keys never decrease. */
export function isChronological(events: HgEventContent[]): boolean {
  return events.every((e, i) => i === 0 || events[i - 1].sortKey <= e.sortKey);
}
