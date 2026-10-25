/** Ready-to-copy prompt to convert course notes with Claude (also in CONTENT_FORMAT.md). */
export const CONVERSION_PROMPT = `Tu vas convertir mes notes de cours en un fichier YAML pour mon app de révision.
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
`;
