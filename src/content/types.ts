import type { SubjectId } from '../types';

/** Content imported by the user (never invented by the app). */

export interface CardContent {
  type: 'card';
  id: string;
  subject: SubjectId;
  chapterId?: string;
  front: string;
  back: string;
  tags?: string[];
}

export interface ChecklistContent {
  type: 'checklist';
  id: string;
  subject: SubjectId;
  chapterId?: string;
  title: string;
  points: string[];
}

export interface SesArgument {
  affirmation: string;
  explication: string;
  illustration: string;
}

export interface SesPlanContent {
  type: 'ses_plan';
  id: string;
  subject: 'ses';
  chapterId?: string;
  numero: string;
  objectifNumero: string;
  objectif: string;
  sujet: string;
  intro: string;
  arguments: SesArgument[];
  conclusion: string;
}

export interface PhiloNotionContent {
  type: 'philo_notion';
  id: string;
  subject: 'philo';
  /** id of one of the 17 notions (chapter id) */
  chapterId: string;
  contenu: string;
  liees?: string[];
}

export interface ReferenceContent {
  type: 'reference';
  id: string;
  subject: 'philo';
  chapterIds: string[];
  auteur: string;
  oeuvre?: string;
  texte: string;
  kind?: 'citation' | 'idee' | 'exemple';
}

export interface HgEventContent {
  type: 'hg_event';
  id: string;
  subject: 'hg';
  chapterId?: string;
  label: string;
  /** as written by the user: "1929", "24/10/1929", "1947-03" */
  date: string;
  /** sortable decimal year, computed from date */
  sortKey: number;
  description?: string;
}

export interface SujetContent {
  type: 'sujet';
  id: string;
  subject: SubjectId;
  chapterId?: string;
  kind: 'dissertation' | 'explication' | 'plan' | 'ec1' | 'rdd' | 'autre';
  texte: string;
  /** explication de texte: the excerpt and author */
  extrait?: string;
  auteur?: string;
  /** optional reference plan from the user's course (for comparison) */
  plan?: string[];
  notions?: string[];
}

export interface DossierDocument {
  titre: string;
  source?: string;
  contenu: string;
}

export interface DossierContent {
  type: 'dossier';
  id: string;
  subject: 'ses';
  chapterId?: string;
  sujet: string;
  documents: DossierDocument[];
}

export interface GrandOralContent {
  type: 'grand_oral';
  id: string;
  subject: SubjectId;
  question: string;
  notes?: string;
}

export type ContentItem =
  | CardContent
  | ChecklistContent
  | SesPlanContent
  | PhiloNotionContent
  | ReferenceContent
  | HgEventContent
  | SujetContent
  | DossierContent
  | GrandOralContent;

export type ContentType = ContentItem['type'];

export type ContentOf<T extends ContentType> = Extract<ContentItem, { type: T }>;
