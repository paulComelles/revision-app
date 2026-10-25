/**
 * Content import: YAML (or JSON, which is valid YAML) in a human-editable
 * format documented in CONTENT_FORMAT.md. Pure parsing + validation here;
 * applyImport() writes to IndexedDB.
 */
import { parseAllDocuments } from 'yaml';
import { z } from 'zod';
import { hashString } from '../lib/rng';
import type { Chapter, SubjectId } from '../types';
import type { ContentItem } from './types';

const SUBJECT_ALIASES: Record<string, SubjectId> = {
  maths: 'maths',
  math: 'maths',
  'maths spe': 'maths',
  'maths specialite': 'maths',
  mathematiques: 'maths',
  expertes: 'expertes',
  'maths expertes': 'expertes',
  ses: 'ses',
  philo: 'philo',
  philosophie: 'philo',
  hg: 'hg',
  'histoire-geo': 'hg',
  'histoire geo': 'hg',
  'histoire-geographie': 'hg',
  histoire: 'hg',
  geographie: 'hg',
  sat: 'sat',
};

export function normalizeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const str = (label: string) => z.string({ required_error: `${label} : champ obligatoire`, invalid_type_error: `${label} : texte attendu` }).trim().min(1, `${label} : ne doit pas être vide`);
const optStr = z.union([z.string(), z.number()]).transform(String).optional();
const strOrNum = (label: string) =>
  z.union([z.string(), z.number()], { required_error: `${label} : champ obligatoire`, invalid_type_error: `${label} : texte ou nombre attendu` }).transform((v) => String(v).trim());
const strList = z.array(z.union([z.string(), z.number()]).transform(String)).optional();

const subjectField = z
  .string({ required_error: 'matiere : champ obligatoire (maths, expertes, ses, philo, hg)' })
  .transform((s, ctx) => {
    const k = SUBJECT_ALIASES[normalizeKey(s).replace(/ /g, ' ')];
    if (!k) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `matiere « ${s} » inconnue (maths, expertes, ses, philo, hg)` });
      return z.NEVER;
    }
    return k;
  });

const schemas = {
  chapitres: z.object({ id: optStr, matiere: subjectField, titre: str('titre'), sur_le_bac: z.boolean().optional() }),
  cartes: z.object({
    id: optStr,
    matiere: subjectField,
    chapitre: optStr,
    recto: str('recto'),
    verso: str('verso'),
    tags: strList,
  }),
  points_cles: z.object({
    id: optStr,
    matiere: subjectField,
    chapitre: str('chapitre'),
    titre: optStr,
    points: z.array(z.union([z.string(), z.number()]).transform(String), { required_error: 'points : liste obligatoire' }).min(1, 'points : au moins un point'),
  }),
  plans_ec1: z.object({
    id: optStr,
    chapitre: optStr,
    numero: strOrNum('numero'),
    objectif_numero: strOrNum('objectif_numero'),
    objectif: str('objectif'),
    sujet: str('sujet'),
    intro: str('intro'),
    arguments: z
      .array(z.object({ affirmation: str('affirmation'), explication: str('explication'), illustration: str('illustration') }), {
        required_error: 'arguments : liste obligatoire (A / E / I)',
      })
      .min(1, 'arguments : au moins un argument')
      .max(4, 'arguments : 4 au maximum'),
    conclusion: str('conclusion'),
  }),
  notions_philo: z.object({ id: optStr, notion: str('notion'), contenu: str('contenu'), liees: strList }),
  references: z.object({
    id: optStr,
    notions: z.array(z.string(), { required_error: 'notions : liste obligatoire' }).min(1),
    auteur: str('auteur'),
    oeuvre: optStr,
    texte: str('texte'),
    type: z.enum(['citation', 'idee', 'exemple'], { errorMap: () => ({ message: 'type : citation, idee ou exemple' }) }).optional(),
  }),
  evenements_hg: z.object({ id: optStr, chapitre: optStr, date: strOrNum('date'), titre: str('titre'), description: optStr }),
  sujets: z.object({
    id: optStr,
    matiere: subjectField,
    type: z.enum(['dissertation', 'explication', 'plan', 'ec1', 'rdd', 'autre'], {
      errorMap: () => ({ message: 'type : dissertation, explication, plan, ec1, rdd ou autre' }),
    }),
    chapitre: optStr,
    texte: str('texte'),
    extrait: optStr,
    auteur: optStr,
    plan: strList,
    notions: strList,
  }),
  dossiers_rdd: z.object({
    id: optStr,
    chapitre: optStr,
    sujet: str('sujet'),
    documents: z
      .array(z.object({ titre: str('titre'), source: optStr, contenu: str('contenu') }), { required_error: 'documents : liste obligatoire' })
      .min(1, 'documents : au moins un document'),
  }),
  grand_oral: z.object({ id: optStr, matiere: subjectField, question: str('question'), notes: optStr }),
};

export type SectionKey = keyof typeof schemas;
export const SECTION_KEYS = Object.keys(schemas) as SectionKey[];

export const SECTION_LABELS: Record<SectionKey, string> = {
  chapitres: 'Chapitres',
  cartes: 'Cartes',
  points_cles: 'Listes de points clés',
  plans_ec1: 'Plans EC1',
  notions_philo: 'Notions de philo',
  references: 'Références philo',
  evenements_hg: 'Événements HG',
  sujets: 'Sujets',
  dossiers_rdd: 'Dossiers RDD',
  grand_oral: 'Questions de grand oral',
};

export interface ImportIssue {
  path: string;
  message: string;
}

export interface ImportResult {
  items: ContentItem[];
  chapters: Chapter[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  counts: Partial<Record<SectionKey, number>>;
}

const MONTHS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};

/** "1929", "1929-10-24", "24/10/1929", "10/1929", "octobre 1929", "-52" -> decimal year */
export function parseHistDate(raw: string): number | null {
  const s = normalizeKey(raw.replace(/^-/, 'moins '));
  const neg = raw.trim().startsWith('-') || /av j c|avant j c/.test(s);
  let m: RegExpExecArray | null;
  const out = (y: number, mo = 1, d = 1) => (neg ? -y : y) + ((mo - 1) * 31 + (d - 1)) / 400;
  const t = raw.trim();
  if ((m = /^-?(\d{1,4})$/.exec(t))) return out(+m[1]);
  if ((m = /^(\d{1,4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(t))) return out(+m[1], +m[2], m[3] ? +m[3] : 1);
  if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{1,4})$/.exec(t))) return out(+m[3], +m[2], +m[1]);
  if ((m = /^(\d{1,2})\/(\d{1,4})$/.exec(t))) return out(+m[2], +m[1]);
  const words = s.replace(/^moins /, '').split(' ');
  // "24 octobre 1929" / "octobre 1929"
  const yi = words.findIndex((w) => /^\d{1,4}$/.test(w) && w.length >= 3);
  if (yi >= 0) {
    const mi = words.findIndex((w) => w in MONTHS);
    const day = mi > 0 && /^\d{1,2}$/.test(words[mi - 1]) ? +words[mi - 1] : 1;
    return out(+words[yi], mi >= 0 ? MONTHS[words[mi]] : 1, day);
  }
  return null;
}

function makeId(prefix: string, ...parts: (string | undefined)[]): string {
  return `${prefix}-${hashString(parts.map((p) => p ?? '').join('|')).toString(36)}`;
}

export function parseImport(text: string, existingChapters: Chapter[]): ImportResult {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const items: ContentItem[] = [];
  const newChapters: Chapter[] = [];
  const counts: ImportResult['counts'] = {};

  let docs: unknown[];
  try {
    const parsed = parseAllDocuments(text);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    docs = [];
    for (const d of arr) {
      if (d.errors.length) {
        for (const e of d.errors) {
          const line = e.linePos?.[0];
          errors.push({ path: line ? `ligne ${line.line}, colonne ${line.col}` : 'fichier', message: `Syntaxe YAML : ${e.message.split('\n')[0]}` });
        }
      } else docs.push(d.toJS());
    }
  } catch (e) {
    return { items, chapters: [], errors: [{ path: 'fichier', message: `Fichier illisible : ${(e as Error).message}` }], warnings, counts };
  }
  if (errors.length) return { items, chapters: [], errors, warnings, counts };

  const allChapters = [...existingChapters];
  const findChapter = (subject: SubjectId | undefined, ref: string | undefined, path: string): string | undefined => {
    if (!ref) return undefined;
    const k = normalizeKey(ref);
    const pool = subject ? allChapters.filter((c) => c.subject === subject) : allChapters;
    const hit =
      pool.find((c) => c.id === ref) ??
      pool.find((c) => normalizeKey(c.title) === k) ??
      pool.find((c) => normalizeKey(c.title).includes(k) && k.length >= 4);
    if (!hit) {
      errors.push({
        path,
        message: `chapitre « ${ref} » introuvable${subject ? ` en ${subject}` : ''}. Chapitres possibles : ${pool
          .slice(0, 14)
          .map((c) => c.title)
          .join(' ; ')}${pool.length > 14 ? '…' : ''} (ou ajoute-le dans la section « chapitres »)`,
      });
      return undefined;
    }
    return hit.id;
  };

  const philoNotion = (ref: string, path: string) => findChapter('philo', ref, path);

  for (const [di, doc] of docs.entries()) {
    if (doc === null || doc === undefined) continue;
    if (typeof doc !== 'object' || Array.isArray(doc)) {
      errors.push({ path: `document ${di + 1}`, message: 'Le fichier doit contenir des sections (cartes:, points_cles:, …), pas une liste seule.' });
      continue;
    }
    const obj = doc as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      if (!(key in schemas)) {
        const near = SECTION_KEYS.find((s) => normalizeKey(s).replace(/ /g, '') === normalizeKey(key).replace(/ /g, ''));
        errors.push({ path: key, message: `Section inconnue « ${key} ».${near ? ` Voulais-tu « ${near} » ?` : ''} Sections possibles : ${SECTION_KEYS.join(', ')}` });
      }
    }
    // chapters first so later sections can reference them
    const order: SectionKey[] = ['chapitres', ...SECTION_KEYS.filter((k) => k !== 'chapitres')];
    for (const key of order) {
      const raw = obj[key];
      if (raw === undefined || raw === null) continue;
      if (!Array.isArray(raw)) {
        errors.push({ path: key, message: `« ${key} » doit être une liste (chaque élément commence par « - »).` });
        continue;
      }
      raw.forEach((entry, i) => {
        const path = `${key}[${i + 1}]`;
        const res = schemas[key].safeParse(entry);
        if (!res.success) {
          for (const iss of res.error.issues) {
            const field = iss.path.length ? iss.path.join('.') : '';
            let msg = iss.message;
            if (iss.code === 'invalid_type' && iss.received === 'undefined') msg = `${field} : champ obligatoire`;
            errors.push({ path: field ? `${path}.${field}` : path, message: msg });
          }
          return;
        }
        counts[key] = (counts[key] ?? 0) + 1;
        switch (key) {
          case 'chapitres': {
            const c = res.data as z.infer<typeof schemas.chapitres>;
            const existing = allChapters.find((x) => x.subject === c.matiere && normalizeKey(x.title) === normalizeKey(c.titre));
            if (existing) {
              warnings.push({ path, message: `chapitre « ${c.titre} » existe déjà : ignoré.` });
              return;
            }
            const ch: Chapter = {
              id: c.id ?? makeId(c.matiere, c.titre),
              subject: c.matiere,
              title: c.titre,
              order: 100 + allChapters.filter((x) => x.subject === c.matiere).length,
              status: 'todo',
              verified: true,
              onBac: c.matiere === 'ses' ? (c.sur_le_bac ?? null) : undefined,
            };
            allChapters.push(ch);
            newChapters.push(ch);
            return;
          }
          case 'cartes': {
            const c = res.data as z.infer<typeof schemas.cartes>;
            items.push({
              type: 'card',
              id: c.id ?? makeId('card', c.matiere, c.recto),
              subject: c.matiere,
              chapterId: findChapter(c.matiere, c.chapitre, `${path}.chapitre`),
              front: c.recto,
              back: c.verso,
              tags: c.tags,
            });
            return;
          }
          case 'points_cles': {
            const c = res.data as z.infer<typeof schemas.points_cles>;
            const chapterId = findChapter(c.matiere, c.chapitre, `${path}.chapitre`);
            items.push({
              type: 'checklist',
              id: c.id ?? makeId('check', c.matiere, c.chapitre, c.titre),
              subject: c.matiere,
              chapterId,
              title: c.titre ?? c.chapitre,
              points: c.points,
            });
            return;
          }
          case 'plans_ec1': {
            const c = res.data as z.infer<typeof schemas.plans_ec1>;
            if (c.arguments.length !== 3) warnings.push({ path: `${path}.arguments`, message: `${c.arguments.length} argument(s) au lieu de 3.` });
            items.push({
              type: 'ses_plan',
              id: c.id ?? makeId('ec1', c.numero, c.sujet),
              subject: 'ses',
              chapterId: findChapter('ses', c.chapitre, `${path}.chapitre`),
              numero: c.numero,
              objectifNumero: c.objectif_numero,
              objectif: c.objectif,
              sujet: c.sujet,
              intro: c.intro,
              arguments: c.arguments,
              conclusion: c.conclusion,
            });
            return;
          }
          case 'notions_philo': {
            const c = res.data as z.infer<typeof schemas.notions_philo>;
            const chapterId = philoNotion(c.notion, `${path}.notion`);
            if (!chapterId) return;
            const liees = (c.liees ?? []).map((l, j) => philoNotion(l, `${path}.liees[${j + 1}]`)).filter((x): x is string => !!x);
            items.push({ type: 'philo_notion', id: c.id ?? makeId('pn', chapterId, c.contenu.slice(0, 80)), subject: 'philo', chapterId, contenu: c.contenu, liees });
            return;
          }
          case 'references': {
            const c = res.data as z.infer<typeof schemas.references>;
            const ids = c.notions.map((n, j) => philoNotion(n, `${path}.notions[${j + 1}]`)).filter((x): x is string => !!x);
            items.push({
              type: 'reference',
              id: c.id ?? makeId('ref', c.auteur, c.texte.slice(0, 80)),
              subject: 'philo',
              chapterIds: ids,
              auteur: c.auteur,
              oeuvre: c.oeuvre,
              texte: c.texte,
              kind: c.type,
            });
            return;
          }
          case 'evenements_hg': {
            const c = res.data as z.infer<typeof schemas.evenements_hg>;
            const sortKey = parseHistDate(c.date);
            if (sortKey === null) {
              errors.push({ path: `${path}.date`, message: `date « ${c.date} » illisible (ex. 1929, 24/10/1929, 1929-10-24, octobre 1929)` });
              return;
            }
            items.push({
              type: 'hg_event',
              id: c.id ?? makeId('hg', c.titre, c.date),
              subject: 'hg',
              chapterId: findChapter('hg', c.chapitre, `${path}.chapitre`),
              label: c.titre,
              date: c.date,
              sortKey,
              description: c.description,
            });
            return;
          }
          case 'sujets': {
            const c = res.data as z.infer<typeof schemas.sujets>;
            if (c.type === 'explication' && !c.extrait) warnings.push({ path, message: 'explication de texte sans « extrait ».' });
            items.push({
              type: 'sujet',
              id: c.id ?? makeId('sujet', c.matiere, c.type, c.texte),
              subject: c.matiere,
              chapterId: findChapter(c.matiere, c.chapitre, `${path}.chapitre`),
              kind: c.type,
              texte: c.texte,
              extrait: c.extrait,
              auteur: c.auteur,
              plan: c.plan,
              notions: c.notions?.map((n) => (c.matiere === 'philo' ? (philoNotion(n, `${path}.notions`) ?? n) : n)),
            });
            return;
          }
          case 'dossiers_rdd': {
            const c = res.data as z.infer<typeof schemas.dossiers_rdd>;
            items.push({
              type: 'dossier',
              id: c.id ?? makeId('rdd', c.sujet),
              subject: 'ses',
              chapterId: findChapter('ses', c.chapitre, `${path}.chapitre`),
              sujet: c.sujet,
              documents: c.documents,
            });
            return;
          }
          case 'grand_oral': {
            const c = res.data as z.infer<typeof schemas.grand_oral>;
            items.push({ type: 'grand_oral', id: c.id ?? makeId('go', c.question), subject: c.matiere, question: c.question, notes: c.notes });
            return;
          }
        }
      });
    }
  }
  // duplicate ids inside the file
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.id)) warnings.push({ path: it.id, message: 'élément en double dans le fichier (même id ou même contenu) : le dernier remplace le premier.' });
    seen.add(it.id);
  }
  if (!errors.length && !items.length && !newChapters.length) errors.push({ path: 'fichier', message: 'Aucun contenu trouvé. Vérifie les noms de sections (voir CONTENT_FORMAT.md).' });
  return { items, chapters: newChapters, errors, warnings, counts };
}
