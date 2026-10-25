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

## SAT
- Taxonomie = les 19 compétences du College Board Question Bank (`src/generators/sat/skills.ts`), pondération des points faibles (géométrie/trigo, systèmes, Advanced Math, PSDA) dans le même fichier.
- Pas de niveau « Easy » généré (demandé : Medium et Hard). Le test blanc n’a donc que Medium/Hard ; le module 2 « plus facile » est surtout Medium.
- Score du test blanc : simple fonction affine du nombre de bonnes réponses selon le module 2 (paramètres dans `mockConfig.ts`), affichée comme une fourchette « estimation ». Le vrai SAT utilise un modèle IRT non public.
- Règles SPR : une fraction doit être entier/entier (pas `1.5/2`), un `+` initial et les espaces sont refusés, un décimal non exact doit remplir les 5 (ou 6 avec `-`) caractères. Les fractions non réduites (`4/6`) sont acceptées.
- Distracteurs QCM construits à partir d’erreurs typiques (signe, formule voisine, mauvaise lecture) et étiquetés avec un type d’erreur, qui pré-remplit le carnet d’erreurs.
- Question Bank : une question marquée fausse crée une erreur (carnet + répétition espacée). Sa révision = la refaire depuis le PDF puis dire juste/faux, ce qui met à jour l’historique de la question.
- Test blanc : les questions du test ne mettent pas à jour la répétition espacée des compétences (pour ne pas fausser le planning), mais sont comptées dans les statistiques et les erreurs vont dans le carnet.

## Maths (bac)
- Réponses « expression » vérifiées en évaluant en 12 points aléatoires (ou en tous les entiers d’un intervalle pour les suites en $n$). Un aperçu « Lu comme » montre comment l’expression tapée a été comprise (ex. `e^2x` = $e^2 \cdot x$ : écrire `e^(2x)`).
- Primitives : n’importe quelle primitive est acceptée (on vérifie que la différence avec la primitive attendue est constante).
- Réponses numériques approchées : tolérance indiquée dans l’énoncé (ex. $10^{-2}$ pour le TVI, $10^{-3}$ pour la loi binomiale).
- Plusieurs réponses valides (Bézout, inverse modulaire, argument modulo $2\pi$) : vérificateur sur mesure qui accepte toute solution correcte.
- Récurrence : 8 modèles (sommes, somme géométrique, divisibilité, suite explicite, suite majorée, inégalité de Bernoulli). Les preuves sont générées avec ta structure Initialisation / Hérédité / En effet / Conclusion ; le mode « compléter » est aussi un générateur (il revient en révision). Le mode « rédiger » se termine par une check-list et une auto-évaluation.
- Chapitres sans générateur (fonctions trigonométriques, sommes de VA) : présents dans la liste, révisés via tes cartes / points clés importés.

## SES
- « Glisser les idées dans 3 paragraphes » (RDD) est fait par des boutons 1 / 2 / 3 plutôt qu’un vrai glisser-déposer : plus fiable au doigt sur téléphone. Le brouillon est sauvegardé localement en continu.
- EC1 : la comparaison avec ta fiche est une auto-évaluation partie par partie (✓ / ✗) ; la note FSRS est calculée à partir de la proportion retrouvée. Pas de correction automatique de texte libre (trop peu fiable).
- Calculs EC2 : réponses arrondies avec tolérance d’une demi-unité du dernier chiffre demandé ; virgule française acceptée.

## Philo, HG, blurting
- Blurting : les points « retrouvés » sont pré-cochés par recherche de mots-clés (sans accents, pluriels simplifiés) mais c’est toi qui valides ; la note FSRS vient de la proportion retrouvée (≥ 90 % facile, ≥ 65 % bien, ≥ 35 % difficile).
- La révision d’une notion de philo = écrire de mémoire (repères, références, liens) puis comparer avec ton cours importé et s’auto-évaluer.
- Les check-lists de dissertation / explication / plan HG portent uniquement sur la méthode (pas de contenu de cours).
- Chronologie « placer sur la frise » : on demande l’année ; la réponse est juste si l’année est exacte. Une frise est ensuite dessinée avec tes événements.
