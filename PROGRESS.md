# Avancement

## Fait
- **Phase 1** : scaffold, données (Dexie), FSRS, page Aujourd’hui + mode trajet, carnet d’erreurs (auto + manuel avec photo), focus (Pomodoro), tableau de bord, réglages (examens, chapitres, poids, jours), import de contenu (YAML/JSON + validation), sauvegarde/restauration JSON, PWA, workflow GitHub Pages.

- **Phase 2** : module SAT — 37 générateurs répartis sur les 19 compétences du Question Bank (Medium/Hard, QCM + SPR), tests de vérification indépendants par domaine (substitution, intégration numérique, comptage, figures vérifiées), utilitaire SPR testé (règles officielles), indices progressifs, entraînement adaptatif, SPR trainer (+ exercice sur les règles de saisie), test blanc adaptatif 2×22 (config `src/generators/sat/mockConfig.ts`), tracker Question Bank (ajout unitaire / en masse, stats par compétence, ré-essais programmés).

- **Phase 3** : maths spé (dérivation/convexité ×4, suites ×2, limites, TVI, exp/ln ×2, primitives, intégrales, équations différentielles, espace, loi binomiale, dénombrement) et expertes (produit/puissance/inverse de matrices, graphes et nombre de chemins, Markov, PGCD, Bézout, congruences/inverse modulaire, complexes ×3) — 27 générateurs vérifiés (dérivées numériques, Simpson, énumération exhaustive, force brute, substitution) ; constructeur de récurrence (ordre / trous / rédaction + auto-vérification).

- **Phase 4** : SES — suivi des 12 chapitres (cases « au bac » éditables), entraîneur EC1 sur tes fiches (reconstruire, compléter les trous, « quel argument pour quel sujet ? »), plans EC1 en répétition espacée, calculs EC2 générés sur données fictives (taux de variation, CM, indices, parts, points de %, TVAM, rédaction d’une phrase) avec tests, RDD (brouillon chronométré, idées → 3 paragraphes, intro/conclusion, auto-évaluation).

- **Phase 5** : blurting (minuteur, comparaison avec la liste de points clés, pré-cochage par mots-clés à confirmer, note FSRS) ; philo : carte des 17 notions (réseau des liens importés, couleur = rappel), fiche notion (cours, références, notions liées, sujets, révision active), dissertation (définitions, problématique, plan en 3 parties + check-list), explication de texte ; HG : chronologie (remettre dans l’ordre, placer sur la frise), cartes notions, plan ; révisions dédiées pour notions, listes de points clés et chronologies.

## En cours
- Phase 6 : QA + README (+ grand oral en bonus).

## Pour reprendre
- `npm ci && npm run check` (typecheck + lint + tests), `npm run dev`.
- Architecture : `src/generators/*` (générateurs de questions + tests), `src/lib/*` (moteurs purs testés), `src/db/*` (persistance), `src/pages/*`, `src/features/*`.
- Les modules de matières ajoutent leurs routes dans `src/routes.tsx`, leurs outils dans `src/tools.ts` et leurs révisions via `registerReview` (`src/features/review/registry.ts`).
