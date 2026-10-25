# Décisions

Choix faits en autonomie (modifiables). Les plus récents en bas.

## Technique
- **Stack** : Vite 6 + React 18 + TypeScript + Tailwind 4, versions épinglées (connues et stables).
- **Stockage** : IndexedDB via Dexie (`src/db/db.ts`). Sauvegarde = un fichier JSON avec toutes les tables ; photos et audio y sont inclus en base64.
- **Routage** : `HashRouter` (`#/...`) pour que GitHub Pages fonctionne sans configuration de redirection.
- **Répétition espacée** : FSRS (bibliothèque `ts-fsrs`), un seul moteur pour tout. Fuzz désactivé (planning reproductible), intervalle max = 45 jours par défaut (réglable) pour garder les premiers chapitres vivants jusqu’en juin. L’app borne elle-même l’intervalle (la lib dépassait d’un jour).
- **Exercices générés en répétition espacée** : l’élément révisé est le *générateur* (la compétence) ; chaque révision tire une nouvelle graine.
- **Note FSRS d’un exercice** : faux ou solution vue → « À revoir » ; juste avec indice(s) ou très lent → « Difficile » ; juste → « Bien » ; juste en moins de 40 % du temps cible → « Facile ».
- **Reproductibilité** : chaque question = (id du générateur, graine, difficulté, format). Le RNG (mulberry32) est initialisé avec la chaîne `id|graine|difficulté|format`.
- **Maîtrise** : moyenne bayésienne pondérée dans le temps (demi-vie 21 jours, a priori 0,4) ; une réponse juste avec indice compte pour moitié.
- **Palette** : couleurs des matières prises dans une palette catégorielle validée (daltonisme, contraste) ; la heatmap de maîtrise utilise une rampe bleue mono-teinte (inversée en mode sombre pour que « faible » s’efface).

## Session « Aujourd’hui »
- Répartition : ~50 % révisions dues (triées par retard × poids matière × proximité d’examen), le reste sur le point le plus faible, et un exercice chronométré (~20 %, 4–8 min) tiré au hasard pondéré parmi les autres points faibles.
- Proximité d’examen : facteur `1 + 1,5·e^(−jours/45)` pour les matières liées à une date d’examen saisie.
- Matières « week-end » (SES, philo, HG par défaut) : absentes en semaine (leurs révisions attendent samedi), poids ×1,5 le week-end.
- **Mode trajet** : 10 min, uniquement des éléments rapides (cartes de toutes les matières, même « week-end », et questions dont le temps cible ≤ 2 min), pas de chrono imposé.
- Les exercices d’un chapitre de maths n’entrent dans la session que si le chapitre est « en cours » ou « vu » (par défaut : seuls « Dérivation et convexité » et « Matrices et graphes » sont en cours). Le SAT est toujours actif.

## Indices et réponses
- Indice 1 = notion, indice 2 = première étape. Indice 3 = solution guidée **avec la dernière étape (le résultat) masquée** tant que la réponse n’est pas validée, pour respecter « jamais la réponse avant validation ». Voir l’indice 3 compte comme « solution vue » (note « À revoir »).

## Carnet d’erreurs
- Chaque mauvaise réponse est enregistrée automatiquement. Le type d’erreur est pré-rempli puis modifiable d’un tap : le distracteur QCM choisi porte son type (ex. erreur de signe = calcul), sinon « temps » si le chrono est dépassé, sinon « méthode ».
- Une erreur est « résolue » après 2 révisions réussies d’affilée (sans solution vue). Révision par défaut : question similaire (nouvelle graine) ; option « question exacte ».
- Erreurs manuelles : à refaire sur papier puis auto-évaluation.

## Contenu
- Format d’import : YAML (le JSON est accepté car c’est du YAML valide), clés en français. Validation avec `zod`, messages d’erreur en français avec le chemin (`cartes[3].verso`).
- Chapitres pré-remplis depuis la structure des programmes officiels, tous marqués « à vérifier » et modifiables. Aucun contenu de cours.
- SES : les 9 chapitres « au bac » ne sont **pas** pré-cochés (je ne veux pas risquer une information fausse) : à cocher dans Réglages → Chapitres.
- Les dates d’examen ne sont pas pré-remplies.
