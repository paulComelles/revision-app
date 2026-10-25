import { describe, expect, it } from 'vitest';
import { gradeFromOutcome, newSrsState, retrievability, review } from './srs';

const P = { desiredRetention: 0.9, maxIntervalDays: 45 };
const DAY = 86_400_000;

describe('srs', () => {
  it('a new item is due now', () => {
    const now = Date.UTC(2026, 9, 25);
    expect(newSrsState(now).due).toBe(now);
  });
  it('good reviews push the due date further out, again pulls it back', () => {
    let s = newSrsState(0);
    let now = 0;
    const intervals: number[] = [];
    for (let i = 0; i < 6; i++) {
      s = review(s, 3, now, P);
      intervals.push(s.due - now);
      now = s.due;
    }
    expect(intervals[5]).toBeGreaterThan(intervals[1]);
    const failed = review(s, 1, now, P);
    expect(failed.due - now).toBeLessThan(intervals[5]);
    expect(failed.lapses).toBe(1);
  });
  it('never schedules beyond the max interval', () => {
    let s = newSrsState(0);
    let now = 0;
    for (let i = 0; i < 20; i++) {
      s = review(s, 4, now, P);
      expect(s.due - now).toBeLessThanOrEqual(45 * DAY + 1);
      now = s.due;
    }
  });
  it('retrievability decreases with time', () => {
    let s = newSrsState(0);
    s = review(s, 3, 0, P);
    s = review(s, 3, s.due, P);
    const r1 = retrievability(s, s.due - DAY, P);
    const r2 = retrievability(s, s.due + 10 * DAY, P);
    expect(r1).toBeGreaterThan(r2);
  });
  it('maps outcomes to grades', () => {
    expect(gradeFromOutcome({ correct: false, hintsUsed: 0, timeMs: 1000 })).toBe(1);
    expect(gradeFromOutcome({ correct: true, hintsUsed: 0, sawSolution: true, timeMs: 1000 })).toBe(1);
    expect(gradeFromOutcome({ correct: true, hintsUsed: 1, timeMs: 1000 })).toBe(2);
    expect(gradeFromOutcome({ correct: true, hintsUsed: 0, timeMs: 60_000, targetMs: 90_000 })).toBe(3);
    expect(gradeFromOutcome({ correct: true, hintsUsed: 0, timeMs: 20_000, targetMs: 90_000 })).toBe(4);
  });
});
