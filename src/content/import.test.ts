import { describe, expect, it } from 'vitest';
import { parseHistDate, parseImport } from './import';
import { defaultChapters } from '../db/seed';

const CH = defaultChapters();

describe('parseImport', () => {
  it('imports every section type', () => {
    const yaml = `
chapitres:
  - matiere: hg
    titre: EXEMPLE — chapitre perso
cartes:
  - matiere: maths
    chapitre: Dérivation et convexité
    recto: "EXEMPLE — à remplacer : question"
    verso: "EXEMPLE — à remplacer : réponse $f'(x)$"
points_cles:
  - matiere: ses
    chapitre: ses-chomage
    points: [EXEMPLE 1, EXEMPLE 2]
plans_ec1:
  - chapitre: Comment lutter contre le chômage ?
    numero: 1
    objectif_numero: 2
    objectif: EXEMPLE
    sujet: EXEMPLE
    intro: EXEMPLE
    arguments:
      - { affirmation: A, explication: E, illustration: I }
      - { affirmation: A, explication: E, illustration: I }
      - { affirmation: A, explication: E, illustration: I }
    conclusion: EXEMPLE
notions_philo:
  - notion: La liberté
    contenu: EXEMPLE
    liees: [Le devoir, la justice]
references:
  - notions: [La liberté]
    auteur: EXEMPLE
    texte: EXEMPLE
    type: idee
evenements_hg:
  - chapitre: EXEMPLE — chapitre perso
    date: "1900"
    titre: EXEMPLE
sujets:
  - matiere: philo
    type: dissertation
    texte: EXEMPLE ?
dossiers_rdd:
  - sujet: EXEMPLE
    documents:
      - titre: Document 1
        contenu: EXEMPLE
grand_oral:
  - matiere: maths
    question: EXEMPLE ?
`;
    const r = parseImport(yaml, CH);
    expect(r.errors).toEqual([]);
    expect(r.chapters).toHaveLength(1);
    expect(r.items.map((i) => i.type).sort()).toEqual(
      ['card', 'checklist', 'dossier', 'grand_oral', 'hg_event', 'philo_notion', 'reference', 'ses_plan', 'sujet'].sort(),
    );
    const card = r.items.find((i) => i.type === 'card')!;
    expect(card.chapterId).toBe('maths-derivation');
    const notion = r.items.find((i) => i.type === 'philo_notion')!;
    expect(notion.type === 'philo_notion' && notion.liees).toEqual(['philo-devoir', 'philo-justice']);
  });

  it('gives stable ids so re-importing does not duplicate', () => {
    const y = 'cartes:\n  - matiere: maths\n    recto: Q\n    verso: R\n';
    expect(parseImport(y, CH).items[0].id).toBe(parseImport(y, CH).items[0].id);
  });

  it('reports clear errors with paths', () => {
    const r = parseImport(
      `cartes:\n  - matiere: maths\n    recto: Q\n  - matiere: chimie\n    recto: Q\n    verso: R\n  - matiere: maths\n    chapitre: Chapitre inexistant\n    recto: Q\n    verso: R\ncarte:\n  - x: 1\n`,
      CH,
    );
    const msgs = r.errors.map((e) => `${e.path}: ${e.message}`).join('\n');
    expect(msgs).toContain('cartes[1].verso');
    expect(msgs).toContain('chimie');
    expect(msgs).toContain('Chapitre inexistant');
    expect(msgs).toContain('Section inconnue « carte »');
  });

  it('reports YAML syntax errors with a line number', () => {
    const r = parseImport('cartes:\n  - recto: "abc\n    verso: x\n', CH);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0].message).toMatch(/YAML/);
  });

  it('accepts JSON', () => {
    const r = parseImport('{"cartes":[{"matiere":"ses","recto":"Q","verso":"R"}]}', CH);
    expect(r.errors).toEqual([]);
    expect(r.items).toHaveLength(1);
  });
});

describe('parseHistDate', () => {
  it('parses common formats in order', () => {
    const ds = ['1914', '06/1919', '1929-10-24', '24/10/1929', 'octobre 1930', '3 septembre 1939', '-52'];
    const keys = ds.map(parseHistDate);
    expect(keys.every((k) => k !== null)).toBe(true);
    expect(keys.slice(0, 6)).toEqual([...keys.slice(0, 6)].sort((a, b) => a! - b!));
    expect(keys[6]).toBeLessThan(0);
    expect(parseHistDate('bientôt')).toBeNull();
  });
});
