import type { ReactElement } from 'react';
import { SatHome } from './features/sat/SatHome';
import { SatPractice } from './features/sat/SatPractice';
import { SatMock } from './features/sat/SatMock';
import { QbTracker } from './features/sat/QbTracker';
import { RecurrencePage } from './features/maths/RecurrencePage';
import { SesCalcPage, SesHome } from './features/ses/SesHome';
import { Ec1Page } from './features/ses/Ec1';
import { RddPage } from './features/ses/Rdd';
import { BlurtingPage } from './features/blurting/Blurting';
import { DissertationPage, ExplicationPage, NotionPage, PhiloHome } from './features/philo/Philo';
import { ChronoPage, HgHome, HgPlanPage } from './features/hg/Hg';
import { GrandOralPage } from './features/grandoral/GrandOral';

/** Routes contributed by subject modules (SAT, maths, SES, philo, HG). */
export const EXTRA_ROUTES: { path: string; element: ReactElement }[] = [
  { path: '/sat', element: <SatHome /> },
  { path: '/sat/practice', element: <SatPractice key="practice" /> },
  { path: '/sat/spr', element: <SatPractice key="spr" sprTrainer /> },
  { path: '/sat/mock', element: <SatMock /> },
  { path: '/sat/qb', element: <QbTracker /> },
  { path: '/maths/recurrence', element: <RecurrencePage /> },
  { path: '/ses', element: <SesHome /> },
  { path: '/ses/ec1', element: <Ec1Page /> },
  { path: '/ses/ec2', element: <SesCalcPage /> },
  { path: '/ses/rdd', element: <RddPage /> },
  { path: '/blurting', element: <BlurtingPage /> },
  { path: '/philo', element: <PhiloHome /> },
  { path: '/philo/notion/:id', element: <NotionPage /> },
  { path: '/philo/dissertation', element: <DissertationPage /> },
  { path: '/philo/explication', element: <ExplicationPage /> },
  { path: '/hg', element: <HgHome /> },
  { path: '/hg/chrono', element: <ChronoPage /> },
  { path: '/hg/plan', element: <HgPlanPage /> },
  { path: '/grand-oral', element: <GrandOralPage /> },
];
