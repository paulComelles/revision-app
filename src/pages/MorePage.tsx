import { Link } from 'react-router-dom';
import { PageTitle } from '../components/ui';

const LINKS = [
  { to: '/trajet', icon: '🚆', label: 'Mode trajet', desc: '10 minutes de questions rapides' },
  { to: '/focus', icon: '⏱️', label: 'Focus', desc: 'Pomodoro par matière' },
  { to: '/cartes', icon: '🃏', label: 'Cartes', desc: 'Toutes tes cartes importées' },
  { to: '/blurting', icon: '🧠', label: 'Blurting', desc: 'Tout écrire de mémoire, puis comparer' },
  { to: '/grand-oral', icon: '🎤', label: 'Grand oral', desc: 'Répétition chronométrée' },
  { to: '/import', icon: '📥', label: 'Importer du contenu', desc: 'Cartes, plans, notions, événements…' },
  { to: '/reglages', icon: '⚙️', label: 'Réglages', desc: 'Dates d’examen, chapitres, sauvegarde' },
];

export function MorePage() {
  return (
    <div className="space-y-3">
      <PageTitle>Plus</PageTitle>
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xl" aria-hidden>
            {l.icon}
          </span>
          <span>
            <span className="block font-medium">{l.label}</span>
            <span className="block text-xs text-slate-500">{l.desc}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
