# Format de contenu (import)

L'app ne contient **aucun contenu de cours** : tout vient de toi, via la page **Importer** (menu Plus → Importer).
Le format est du **YAML** (ou du JSON, qui est aussi accepté). Un fichier contient une ou plusieurs **sections** ;
chaque section est une **liste** (chaque élément commence par `-`).

Règles générales :

- `matiere` : `maths`, `expertes`, `ses`, `philo`, `hg` (accepte aussi « Maths spé », « Philosophie », « Histoire-Géo »…).
- `chapitre` : l'**id** ou le **titre** d'un chapitre existant (Réglages → Chapitres). Insensible aux accents et majuscules.
  S'il n'existe pas, ajoute-le dans la section `chapitres` du même fichier.
- Texte : Markdown simple (`**gras**`, `*italique*`, listes `-`, tableaux `| a | b |`) et maths en LaTeX entre `$...$` ou `$$...$$`.
- Textes sur plusieurs lignes : bloc `|` (voir exemples). Mets des guillemets si le texte contient `: ` ou commence par `[`, `{`, `*`, `#`, `-`.
- `id` (optionnel) : sinon un id stable est calculé à partir du contenu, donc **ré-importer le même fichier ne crée pas de doublons**
  (modifier le recto d'une carte crée une nouvelle carte : supprime l'ancienne dans « Contenu enregistré », ou donne des `id`).
- La page Importer **vérifie tout avant d'importer** : en cas d'erreur, rien n'est importé et chaque erreur indique son emplacement
  (ex. `cartes[3].verso — champ obligatoire`).

## Sections

| Section | Sert à | Champs obligatoires | Champs optionnels |
|---|---|---|---|
| `chapitres` | créer un chapitre | `matiere`, `titre` | `id`, `sur_le_bac` (SES) |
| `cartes` | cartes question/réponse (répétition espacée) | `matiere`, `recto`, `verso` | `chapitre`, `tags`, `id` |
| `points_cles` | liste des points à savoir d'un chapitre (blurting, révisions) | `matiere`, `chapitre`, `points` | `titre`, `id` |
| `plans_ec1` | fiches EC1 de SES | `numero`, `objectif_numero`, `objectif`, `sujet`, `intro`, `arguments` (A/E/I), `conclusion` | `chapitre`, `id` |
| `notions_philo` | ton cours sur une des 17 notions | `notion`, `contenu` | `liees` (autres notions), `id` |
| `references` | références philo (auteurs, idées, citations de ton cours) | `notions`, `auteur`, `texte` | `oeuvre`, `type` (`citation`/`idee`/`exemple`), `id` |
| `evenements_hg` | chronologie | `date`, `titre` | `chapitre`, `description`, `id` |
| `sujets` | sujets de dissertation, explication, plan, EC1, RDD | `matiere`, `type`, `texte` | `chapitre`, `extrait`, `auteur`, `plan` (liste), `notions`, `id` |
| `dossiers_rdd` | RDD SES : sujet + documents | `sujet`, `documents` (`titre`, `contenu`, `source`?) | `chapitre`, `id` |
| `grand_oral` | tes questions de grand oral | `matiere`, `question` | `notes`, `id` |

Formats de date HG acceptés : `1929`, `1929-10-24`, `24/10/1929`, `10/1929`, `24 octobre 1929`, `-52` (avant J.-C.).
Mets la date entre guillemets : `date: "1929"`.

## Exemples (EXEMPLE — à remplacer)

```yaml
chapitres:
  - matiere: hg
    titre: "EXEMPLE — mon chapitre"

cartes:
  - matiere: maths
    chapitre: "Dérivation et convexité"
    recto: "EXEMPLE — à remplacer : ta question avec $f(x)$"
    verso: |
      EXEMPLE — à remplacer : ta réponse,
      sur plusieurs lignes.

points_cles:
  - matiere: ses
    chapitre: "Comment lutter contre le chômage ?"
    points:
      - "EXEMPLE — point 1"
      - "EXEMPLE — point 2"

plans_ec1:
  - chapitre: "Comment lutter contre le chômage ?"
    numero: 1
    objectif_numero: 1
    objectif: "EXEMPLE — à remplacer"
    sujet: "EXEMPLE — à remplacer"
    intro: "EXEMPLE — définitions courtes"
    arguments:
      - affirmation: "EXEMPLE A1"
        explication: "EXEMPLE E1"
        illustration: "EXEMPLE I1"
      - affirmation: "EXEMPLE A2"
        explication: "EXEMPLE E2"
        illustration: "EXEMPLE I2"
      - affirmation: "EXEMPLE A3"
        explication: "EXEMPLE E3"
        illustration: "EXEMPLE I3"
    conclusion: "EXEMPLE — à remplacer"

notions_philo:
  - notion: "La liberté"
    contenu: |
      EXEMPLE — à remplacer par ton cours.
    liees: ["Le devoir", "La justice"]

references:
  - notions: ["La liberté"]
    auteur: "EXEMPLE"
    oeuvre: "EXEMPLE"
    texte: "EXEMPLE — idée ou citation exacte de ton cours"
    type: idee

evenements_hg:
  - chapitre: "EXEMPLE — mon chapitre"
    date: "1900"
    titre: "EXEMPLE — événement"
    description: "EXEMPLE"

sujets:
  - matiere: philo
    type: dissertation
    texte: "EXEMPLE — sujet ?"
  - matiere: philo
    type: explication
    auteur: "EXEMPLE"
    texte: "EXEMPLE — consigne"
    extrait: |
      EXEMPLE — le texte à expliquer.
  - matiere: hg
    type: plan
    chapitre: "EXEMPLE — mon chapitre"
    texte: "EXEMPLE — sujet de composition"
    plan: ["EXEMPLE I", "EXEMPLE II", "EXEMPLE III"]

dossiers_rdd:
  - chapitre: "Comment lutter contre le chômage ?"
    sujet: "EXEMPLE — sujet de RDD"
    documents:
      - titre: "Document 1"
        source: "EXEMPLE"
        contenu: |
          | Année | Valeur |
          |---|---|
          | EXEMPLE | EXEMPLE |

grand_oral:
  - matiere: maths
    question: "EXEMPLE — ta question ?"
    notes: "EXEMPLE"
```

Le même contenu en JSON fonctionne aussi : `{"cartes": [{"matiere": "maths", "recto": "...", "verso": "..."}]}`.

## Ce que crée l'import

- Chaque **carte**, **liste de points clés** et **plan EC1** devient un élément de répétition espacée.
- Chaque **notion de philo** ayant du contenu entre dans la répétition espacée (une révision par notion).
- Les **événements HG** d'un chapitre forment une révision « chronologie » de ce chapitre.
- Sujets, références, dossiers et questions de grand oral alimentent les entraînements correspondants.

## Prompt prêt à copier pour Claude (chat)

Le même prompt est disponible avec un bouton « Copier » sur la page Importer.

```text
Tu vas convertir mes notes de cours en un fichier YAML pour mon app de révision.
Règles :
- N'invente RIEN : utilise uniquement ce qui est dans mes notes. Si une information manque, laisse le champ de côté ou écris "À COMPLÉTER".
- Réponds uniquement avec le YAML, dans un bloc de code, sans commentaire autour.
- Utilise des blocs « | » pour les textes de plusieurs lignes, et des guillemets si un texte contient « : » ou commence par un caractère spécial.
- Formules de maths en LaTeX entre $...$ (ex. $f'(x) = 2x$).
- matiere vaut : maths, expertes, ses, philo ou hg.
- chapitre : recopie le titre exact du chapitre tel que je te le donne.

Sections possibles (n'utilise que celles qui correspondent à mes notes) :

cartes:            # question / réponse
  - matiere: ses
    chapitre: "Comment lutter contre le chômage ?"
    recto: "Question"
    verso: "Réponse"
points_cles:       # liste des points à savoir d'un chapitre (sert au blurting)
  - matiere: maths
    chapitre: "Dérivation et convexité"
    points:
      - "point 1"
      - "point 2"
plans_ec1:         # mes fiches EC1 de SES
  - chapitre: "..."
    numero: 1
    objectif_numero: 1
    objectif: "..."
    sujet: "..."
    intro: |
      définitions courtes
    arguments:
      - affirmation: "..."
        explication: "..."
        illustration: "..."
    conclusion: "..."
notions_philo:
  - notion: "La liberté"
    contenu: |
      mon cours sur la notion
    liees: ["Le devoir", "La justice"]
references:        # références philo
  - notions: ["La liberté"]
    auteur: "..."
    oeuvre: "..."
    texte: "idée ou citation exacte de mon cours"
    type: citation   # citation, idee ou exemple
evenements_hg:
  - chapitre: "..."
    date: "1929"     # ou 24/10/1929
    titre: "..."
    description: "..."
sujets:            # sujets de dissertation, d'explication, de plan…
  - matiere: philo
    type: dissertation   # dissertation, explication, plan, ec1, rdd, autre
    texte: "Le sujet"
    extrait: |           # seulement pour une explication de texte
      le texte
    auteur: "..."
dossiers_rdd:      # SES : sujet + documents
  - chapitre: "..."
    sujet: "..."
    documents:
      - titre: "Document 1"
        source: "..."
        contenu: |
          texte ou tableau Markdown (| a | b |)

Voici mes notes :
[colle tes notes ici]
```
