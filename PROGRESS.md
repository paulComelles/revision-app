# Avancement

## Fait
- **Phase 1** : scaffold, données (Dexie), FSRS, page Aujourd’hui + mode trajet, carnet d’erreurs (auto + manuel avec photo), focus (Pomodoro), tableau de bord, réglages (examens, chapitres, poids, jours), import de contenu (YAML/JSON + validation), sauvegarde/restauration JSON, PWA, workflow GitHub Pages.

## En cours
- Phase 2 : module SAT.

## Ensuite
- Phase 3 : maths spé + expertes. Phase 4 : SES. Phase 5 : philo, HG, blurting. Phase 6 : QA + README (+ grand oral en bonus).

## Pour reprendre
- `npm ci && npm run check` (typecheck + lint + tests), `npm run dev`.
- Architecture : `src/generators/*` (générateurs de questions + tests), `src/lib/*` (moteurs purs testés), `src/db/*` (persistance), `src/pages/*`, `src/features/*`.
- Les modules de matières ajoutent leurs routes dans `src/routes.tsx`, leurs outils dans `src/tools.ts` et leurs révisions via `registerReview` (`src/features/review/registry.ts`).
