import { describe, expect, it } from 'vitest';
import { isChronological } from './chrono';
import type { HgEventContent } from '../content/types';
import { parseHistDate } from '../content/import';

const ev = (date: string): HgEventContent => ({ type: 'hg_event', id: date, subject: 'hg', label: date, date, sortKey: parseHistDate(date)! });

describe('chronology check', () => {
  it('accepts non-decreasing order, rejects inversions', () => {
    expect(isChronological(['1914', '03/1917', '1917-11-07', '1939'].map(ev))).toBe(true);
    expect(isChronological(['1939', '1914'].map(ev))).toBe(false);
    expect(isChronological(['1945', '1945'].map(ev))).toBe(true);
  });
});
