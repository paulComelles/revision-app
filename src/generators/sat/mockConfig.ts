/**
 * Format of the adaptive mock test. Every number about the test format lives
 * here (edit to follow College Board changes).
 */
import type { SatDomainId } from './skills';

export const MOCK_CONFIG = {
  modules: 2,
  questionsPerModule: 22,
  minutesPerModule: 35,
  /** share of multiple-choice questions (the rest are SPR) */
  mcqShare: 0.75,
  /** approximate domain split */
  domainShare: { algebra: 0.35, advanced: 0.35, psda: 0.15, geometry: 0.15 } as Record<SatDomainId, number>,
  /** module 1 mix (only Medium/Hard generators exist: Easy questions are not simulated) */
  module1HardShare: 0.4,
  /** module 2 hard share for each route */
  module2HardShare: { harder: 0.75, easier: 0.15 },
  /** minimum correct answers in module 1 to get the harder module 2 */
  harderThreshold: 14,
  /**
   * ROUGH score estimate: center = base + perCorrect × total correct, capped,
   * then ± halfWidth. This is NOT the official scoring (which uses IRT); it is
   * only a ballpark, labelled as such in the UI.
   */
  scoreModel: {
    easier: { base: 200, perCorrect: 9, cap: 560 },
    harder: { base: 330, perCorrect: 11, cap: 800 },
    halfWidth: 40,
  },
} as const;
