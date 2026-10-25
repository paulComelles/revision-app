import Dexie, { type EntityTable } from 'dexie';
import type {
  Attempt,
  AudioClip,
  BlurtResult,
  Chapter,
  DrillLog,
  FocusSession,
  Mistake,
  MockResult,
  Photo,
  QbEntry,
  ReviewLogEntry,
  Settings,
  SrsItem,
} from '../types';
import type { ContentItem } from '../content/types';

export class RevisionDB extends Dexie {
  settings!: EntityTable<Settings, 'id'>;
  chapters!: EntityTable<Chapter, 'id'>;
  srs!: EntityTable<SrsItem, 'id'>;
  reviewLogs!: EntityTable<ReviewLogEntry, 'id'>;
  attempts!: EntityTable<Attempt, 'id'>;
  mistakes!: EntityTable<Mistake, 'id'>;
  photos!: EntityTable<Photo, 'id'>;
  focus!: EntityTable<FocusSession, 'id'>;
  content!: EntityTable<ContentItem, 'id'>;
  qb!: EntityTable<QbEntry, 'id'>;
  mocks!: EntityTable<MockResult, 'id'>;
  blurts!: EntityTable<BlurtResult, 'id'>;
  drills!: EntityTable<DrillLog, 'id'>;
  audio!: EntityTable<AudioClip, 'id'>;

  constructor(name = 'revision-app') {
    super(name);
    this.version(1).stores({
      settings: 'id',
      chapters: 'id, subject, status',
      srs: 'id, kind, subject, chapterId, refId, due',
      reviewLogs: '++id, itemId, at, subject',
      attempts: '++id, at, subject, skill, generatorId, chapterId',
      mistakes: 'id, createdAt, subject, resolved, generatorId',
      photos: 'id',
      focus: '++id, start, subject',
      content: 'id, type, subject, chapterId, [type+subject]',
      qb: 'id, questionId, pdf, skill, result',
      mocks: '++id, at',
      blurts: '++id, at, chapterId',
      drills: '++id, at, subject, kind',
      audio: 'id, createdAt',
    });
  }
}

export const db = new RevisionDB();

/** Tables included in the JSON backup (photos/audio are included as data URLs). */
export const BACKUP_TABLES = [
  'settings',
  'chapters',
  'srs',
  'reviewLogs',
  'attempts',
  'mistakes',
  'photos',
  'focus',
  'content',
  'qb',
  'mocks',
  'blurts',
  'drills',
  'audio',
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];
