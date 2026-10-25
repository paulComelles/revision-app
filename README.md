# Révisions — bac 2027 + SAT

App de révision personnelle, 100 % locale : pas de compte, pas de serveur, pas de clé d’API, pas d’analytics.
Toutes les données restent dans le navigateur (IndexedDB). Installable sur téléphone (PWA), fonctionne hors ligne.

**Adresse (après la mise en place ci-dessous) : https://paulcomelles.github.io/revision-app/**

---

## 1. Mise en ligne (à faire une fois)

1. Sur GitHub : **Settings → Pages → Build and deployment → Source : « GitHub Actions »**.
2. Fusionne la branche de travail dans `main` (pull request puis « Merge »).
   Le workflow `.github/workflows/deploy.yml` construit l’app (typecheck, lint, tests, build) et la publie à chaque push sur `main`.
   Tu peux aussi le relancer à la main : onglet **Actions → Deploy to GitHub Pages → Run workflow** (sur `main`).
3. Sur le téléphone : ouvre l’adresse dans le navigateur puis « Ajouter à l’écran d’accueil » (Safari : bouton Partager ; Chrome : menu ⋮).

Le chemin de base Vite est `/revision-app/` (`vite.config.ts`). Si tu renommes le dépôt, change-le à cet endroit.

## 2. Premier lancement

1. **Réglages → Dates d’examen** : entre tes dates (bac, SAT, bacs blancs) et les matières concernées. Rien n’est pré-rempli.
2. **Réglages → Chapitres** : la liste vient de la structure des programmes officiels et est marquée « à vérifier ».
   Corrige les intitulés si besoin, mets les chapitres déjà vus en « Vu » et le chapitre actuel en « En cours »
   (les exercices générés d’un chapitre n’entrent dans la session du jour qu’à partir de là).
   En SES, coche les 9 chapitres de l’épreuve écrite.
3. **Réglages → Matières** : poids de chaque matière et « week-end » (SES, philo et HG le sont par défaut).
4. **Importer** tes cours (voir § 4).

## 3. Utilisation au quotidien

- **Aujourd’hui** : choisis 15 / 30 / 45 min. La session mélange les révisions dues (répétition espacée FSRS),
  ton point le plus faible et un exercice chronométré, pondérés par la faiblesse, le poids des matières et la proximité des examens.
  « Autre tirage » propose un autre mélange.
- **Mode trajet** (10 min, téléphone) : cartes et questions rapides uniquement.
- **Indices** : 1 = notion, 2 = première étape, 3 = solution guidée **avec le résultat masqué** tant que tu n’as pas validé.
- **Carnet d’erreurs** : chaque mauvaise réponse y est ajoutée automatiquement, avec un type d’erreur pré-rempli (modifiable d’un tap).
  Ajoute aussi tes erreurs de devoirs / contrôles (avec photo, compressée et gardée sur l’appareil).
  Une erreur revient en révision sous forme de question similaire (nouvelle graine), ou la question exacte si tu le choisis ;
  elle est « résolue » après deux réussites d’affilée.
- **Focus** : minuteur Pomodoro par matière ; le temps alimente le tableau de bord.
- **Stats** : comptes à rebours, semaine en cours, temps par matière, tendances (réussite, vitesse), carte de maîtrise.

### SAT (en anglais)
- Questions générées par compétence du College Board Question Bank (19 compétences), Medium / Hard, QCM et SPR.
- **SPR trainer** : réponses tapées uniquement + exercice sur les règles de saisie officielles.
- **Mock test** adaptatif : 2 modules × 22 questions, 35 min chacun, module 2 plus dur ou plus facile selon le module 1.
  Le score affiché est une **fourchette estimée**, pas un score officiel. Bouton Desmos dans chaque écran.
- **Question Bank tracker** : enregistre tes questions des PDF (ajout en masse : « questions 1 à 103 du PDF X »),
  marque juste / faux / revu ; les fausses sont reprogrammées et vont dans le carnet d’erreurs.

### Maths spé + expertes
- Exercices générés et corrigés par le code pour chaque chapitre (dérivées, tangentes, convexité, suites, limites, TVI,
  exp/ln, primitives, intégrales, équations différentielles, espace, binomiale, dénombrement, matrices, graphes, Markov,
  arithmétique, complexes). Les expressions sont acceptées sous toute forme équivalente (`2x*exp(x^2)`, `(1+x)e^x`, `ln(3)/2`…) ;
  un aperçu « Lu comme » montre comment ta saisie est comprise.
- **Récurrence** : remettre une preuve dans l’ordre, compléter les trous, ou rédiger seul puis cocher la check-list —
  toujours avec la structure Initialisation / Hérédité / En effet / Conclusion.

### SES, philo, HG
- **SES** : suivi des 12 chapitres, plans EC1 (reconstruire, trous, « quel argument pour quel sujet ? »),
  calculs EC2 sur données fictives, RDD (brouillon chronométré, idées → 3 paragraphes, intro et conclusion).
- **Philo** : carte des 17 notions (liens, niveau de rappel), fiche notion avec ton cours et tes références,
  dissertation (10–15 min) et explication de texte.
- **HG** : chronologie (ordre, frise), cartes notions, plans.
- **Blurting** : écris tout ce que tu sais d’un chapitre en X minutes, puis compare avec ta liste de points clés.
- **Grand oral** (bonus) : phases chronométrées (durées « à vérifier » dans `src/features/grandoral/GrandOral.tsx`),
  tes questions, enregistrement audio local pour te réécouter.

## 4. Ajouter du contenu

L’app ne contient aucun contenu de cours : tout vient de toi.
Le format (YAML ou JSON) est décrit dans **[CONTENT_FORMAT.md](CONTENT_FORMAT.md)**, avec des exemples et un **prompt prêt à copier
pour Claude** qui convertit tes notes. Le même prompt est disponible sur la page **Importer** (bouton « Copier le prompt »).

Étapes : colle le prompt + tes notes dans Claude → copie le YAML obtenu → **Importer → Vérifier** (les erreurs indiquent
la ligne / l’élément exact) → **Importer**. Réimporter le même fichier ne crée pas de doublons.

## 5. Sauvegarder tes données

Les données vivent dans le navigateur de chaque appareil. **Réglages → Sauvegarde → Exporter** télécharge un fichier JSON
(tout compris : progrès, erreurs, photos, enregistrements). Range-le dans un endroit sûr (Drive, iCloud…), idéalement chaque semaine
(l’app rappelle la date de la dernière sauvegarde).
Pour restaurer ou passer sur un autre appareil : **Importer une sauvegarde** (remplace toutes les données actuelles, après confirmation).

⚠️ Vider les données du site dans le navigateur efface tout : exporte avant.

## 6. Développement

```bash
npm ci
npm run dev        # serveur local
npm run check      # typecheck + lint + tests
npm run build      # build de production (dist/)
npx vite-node scripts/sample.ts sat-systems 2   # afficher des questions générées
GEN_SEEDS=500 npx vitest run src/generators     # tests des générateurs sur 500 graines
```

Stack : Vite + React + TypeScript + Tailwind, Dexie (IndexedDB), ts-fsrs, KaTeX, vite-plugin-pwa, Vitest.

Organisation :

| Dossier | Contenu |
|---|---|
| `src/generators/` | générateurs (SAT, maths, SES) + leurs tests de vérification ; `check.ts` vérifie les réponses |
| `src/lib/` | moteurs purs testés : graine aléatoire, fractions, règles SPR, parseur d’expressions, FSRS, planificateur, Markdown + KaTeX |
| `src/content/` | format d’import (validation zod) et prompt de conversion |
| `src/db/` | base IndexedDB, opérations, sauvegarde/restauration |
| `src/features/`, `src/pages/` | écrans |

Chaque question générée est reproductible à partir de (identifiant du générateur, graine, difficulté, format).
Les générateurs sont testés sur de nombreuses graines : la réponse calculée est vérifiée indépendamment
(substitution, dérivée numérique, intégration de Simpson, énumération exhaustive, force brute), les QCM ont 4 choix distincts
dont un seul juste, et la réponse attendue passe le vérificateur.

Voir aussi [DECISIONS.md](DECISIONS.md) (choix faits) et [PROGRESS.md](PROGRESS.md) (avancement).
