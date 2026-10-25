import { useEffect, type ReactNode } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useSettings } from './hooks';
import { TodayPage } from './pages/TodayPage';
import { SessionPage } from './pages/SessionPage';
import { MistakesPage } from './pages/MistakesPage';
import { FocusPage } from './pages/FocusPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { ImportPage } from './pages/ImportPage';
import { SubjectPage, SubjectsPage } from './pages/SubjectsPage';
import { MorePage } from './pages/MorePage';
import { PracticePage } from './pages/PracticePage';
import { CardsPage } from './pages/CardsPage';
import { EXTRA_ROUTES } from './routes';

const NAV: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/', label: 'Aujourd’hui', icon: '☀️', end: true },
  { to: '/matieres', label: 'Matières', icon: '📚' },
  { to: '/erreurs', label: 'Erreurs', icon: '📕' },
  { to: '/stats', label: 'Stats', icon: '📊' },
  { to: '/plus', label: 'Plus', icon: '☰' },
];

const SIDE_EXTRA: { to: string; label: string; icon: string }[] = [
  { to: '/trajet', label: 'Mode trajet', icon: '🚆' },
  { to: '/focus', label: 'Focus', icon: '⏱️' },
  { to: '/import', label: 'Importer', icon: '📥' },
  { to: '/reglages', label: 'Réglages', icon: '⚙️' },
];

function useTheme() {
  const { theme } = useSettings();
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1120' : '#f8fafc');
    };
    apply();
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

function NavItem({ to, label, icon, end, side }: { to: string; label: string; icon: string; end?: boolean; side?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        side
          ? `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`
          : `flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`
      }
    >
      <span className={side ? '' : 'text-lg leading-none'} aria-hidden>
        {icon}
      </span>
      {label}
    </NavLink>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-52 shrink-0 flex-col gap-1 border-r border-slate-200 p-3 md:flex dark:border-slate-800">
        <div className="mb-3 px-3 text-lg font-bold">Révisions</div>
        {NAV.slice(0, 4).map((n) => (
          <NavItem key={n.to} {...n} side />
        ))}
        <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
        {SIDE_EXTRA.map((n) => (
          <NavItem key={n.to} {...n} side />
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-24 md:pb-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95">
          {NAV.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}
        </nav>
      </div>
    </div>
  );
}

export function App() {
  useTheme();
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/session" element={<SessionPage key="session" />} />
        <Route path="/trajet" element={<SessionPage key="trajet" trajet />} />
        <Route path="/matieres" element={<SubjectsPage />} />
        <Route path="/matiere/:subject" element={<SubjectPage />} />
        <Route path="/pratique/:generatorId" element={<PracticePage />} />
        <Route path="/cartes/:subject?" element={<CardsPage />} />
        <Route path="/erreurs" element={<MistakesPage />} />
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/stats" element={<DashboardPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/reglages" element={<SettingsPage />} />
        <Route path="/plus" element={<MorePage />} />
        {EXTRA_ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        <Route path="*" element={<p>Page introuvable.</p>} />
      </Routes>
    </Shell>
  );
}
