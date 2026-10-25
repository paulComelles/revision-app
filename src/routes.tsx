import type { ReactElement } from 'react';
import { SatHome } from './features/sat/SatHome';
import { SatPractice } from './features/sat/SatPractice';
import { SatMock } from './features/sat/SatMock';
import { QbTracker } from './features/sat/QbTracker';

/** Routes contributed by subject modules (SAT, maths, SES, philo, HG). */
export const EXTRA_ROUTES: { path: string; element: ReactElement }[] = [
  { path: '/sat', element: <SatHome /> },
  { path: '/sat/practice', element: <SatPractice key="practice" /> },
  { path: '/sat/spr', element: <SatPractice key="spr" sprTrainer /> },
  { path: '/sat/mock', element: <SatMock /> },
  { path: '/sat/qb', element: <QbTracker /> },
];
