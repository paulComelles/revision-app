# Avancement

## Fait
- **Phase 1** : scaffold, données (Dexie), FSRS, page Aujourd’hui + mode trajet, carnet d’erreurs (auto + manuel avec photo), focus (Pomodoro), tableau de bord, réglages (examens, chapitres, poids, jours), import de contenu (YAML/JSON + validation), sauvegarde/restauration JSON, PWA, workflow GitHub Pages.

- **Phase 2** : module SAT — 37 générateurs répartis sur les 19 compétences du Question Bank (Medium/Hard, QCM + SPR), tests de vérification indépendants par domaine (substitution, intégration numérique, comptage, figures vérifiées), utilitaire SPR testé (règles officielles), indices progressifs, entraînement adaptatif, SPR trainer (+ exercice sur les règles de saisie), test blanc adaptatif 2×22 (config `src/generators/sat/mockConfig.ts`), tracker Question Bank (ajout unitaire / en masse, stats par compétence, ré-essais programmés).

- **Phase 3** : maths spé (dérivation/convexité ×4, suites ×2, limites, TVI, exp/ln ×2, primitives, intégrales, équations différentielles, espace, loi binomiale, dénombrement) et expertes (produit/puissance/inverse de matrices, graphes et nombre de chemins, Markov, PGCD, Bézout, congruences/inverse modulaire, complexes ×3) — 27 générateurs vérifiés (dérivées numériques, Simpson, énumération exhaustive, force brute, substitution) ; constructeur de récurrence (ordre / trous / rédaction + auto-vérification).

## En cours
- Phase 4 : SES.

## Ensuite
- Phase 5 : philo, HG, blurting. Phase 6 : QA + README (+ grand oral en bonus).

## Pour reprendre
- `npm ci && npm run check` (typecheck + lint + tests), `npm run dev`.
- Architecture : `src/generators/*` (générateurs de questions + tests), `src/lib/*` (moteurs purs testés), `src/db/*` (persistance), `src/pages/*`, `src/features/*`.
- Les modules de matières ajoutent leurs routes dans `src/routes.tsx`, leurs outils dans `src/tools.ts` et leurs révisions via `registerReview` (`src/features/review/registry.ts`).
