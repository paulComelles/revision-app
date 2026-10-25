/** JSON backup / restore of the whole local database. */
import { BACKUP_TABLES, db, type BackupTable } from './db';

export const BACKUP_APP = 'revision-app';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  tables: Partial<Record<BackupTable, unknown[]>>;
}

const BLOB_TAG = '__blob__';

async function blobToDataUrl(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return `data:${b.type || 'application/octet-stream'};base64,${btoa(bin)}`;
}

function dataUrlToBlob(url: string): Blob {
  const [head, data] = url.split(',');
  const type = /data:([^;]*)/.exec(head)?.[1] ?? 'application/octet-stream';
  const bin = atob(data);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}

async function encode(v: unknown): Promise<unknown> {
  if (v instanceof Blob) return { [BLOB_TAG]: await blobToDataUrl(v) };
  if (Array.isArray(v)) return Promise.all(v.map(encode));
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) out[k] = await encode(x);
    return out;
  }
  return v;
}

function decode(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(decode);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o[BLOB_TAG] === 'string' && Object.keys(o).length === 1) return dataUrlToBlob(o[BLOB_TAG] as string);
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(o)) out[k] = decode(x);
    return out;
  }
  return v;
}

export async function exportBackup(): Promise<BackupFile> {
  const tables: BackupFile['tables'] = {};
  for (const t of BACKUP_TABLES) tables[t] = (await encode(await db.table(t).toArray())) as unknown[];
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables };
}

export function validateBackup(data: unknown): { ok: true; file: BackupFile } | { ok: false; message: string } {
  if (!data || typeof data !== 'object') return { ok: false, message: 'Fichier JSON invalide.' };
  const f = data as Partial<BackupFile>;
  if (f.app !== BACKUP_APP) return { ok: false, message: 'Ce fichier n’est pas une sauvegarde de cette app.' };
  if (typeof f.version !== 'number' || f.version > BACKUP_VERSION) return { ok: false, message: 'Version de sauvegarde non prise en charge.' };
  if (!f.tables || typeof f.tables !== 'object') return { ok: false, message: 'Sauvegarde incomplète (tables manquantes).' };
  for (const [k, v] of Object.entries(f.tables)) {
    if (!(BACKUP_TABLES as readonly string[]).includes(k)) return { ok: false, message: `Table inconnue : ${k}` };
    if (!Array.isArray(v)) return { ok: false, message: `Table ${k} invalide.` };
  }
  return { ok: true, file: f as BackupFile };
}

/** Replace the whole database with the backup content. */
export async function restoreBackup(file: BackupFile): Promise<void> {
  await db.transaction('rw', BACKUP_TABLES.map((t) => db.table(t)), async () => {
    for (const t of BACKUP_TABLES) {
      await db.table(t).clear();
      const rows = file.tables[t];
      if (rows?.length) await db.table(t).bulkPut(decode(rows) as unknown[]);
    }
  });
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
