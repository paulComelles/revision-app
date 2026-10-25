import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { parseImport, SECTION_LABELS, type ImportResult } from '../content/import';
import { applyImport, deleteContent } from '../db/contentRepo';
import { CONVERSION_PROMPT } from '../content/prompt';
import type { ContentItem, ContentType } from '../content/types';
import { SUBJECTS } from '../types';
import { Badge, Banner, Button, Card, Chip, inputCls, PageTitle } from '../components/ui';
import { Md } from '../components/Md';

const TYPE_LABELS: Record<ContentType, string> = {
  card: 'Cartes',
  checklist: 'Points clés',
  ses_plan: 'Plans EC1',
  philo_notion: 'Notions philo',
  reference: 'Références',
  hg_event: 'Événements HG',
  sujet: 'Sujets',
  dossier: 'Dossiers RDD',
  grand_oral: 'Grand oral',
};

function itemTitle(it: ContentItem): string {
  switch (it.type) {
    case 'card':
      return it.front;
    case 'checklist':
      return `${it.title} (${it.points.length} points)`;
    case 'ses_plan':
      return `EC1 N°${it.numero} — Objectif ${it.objectifNumero} · ${it.sujet}`;
    case 'philo_notion':
      return `${it.chapterId} · ${it.contenu.slice(0, 80)}`;
    case 'reference':
      return `${it.auteur} — ${it.texte.slice(0, 80)}`;
    case 'hg_event':
      return `${it.date} · ${it.label}`;
    case 'sujet':
      return `[${it.kind}] ${it.texte}`;
    case 'dossier':
      return `${it.sujet} (${it.documents.length} doc.)`;
    case 'grand_oral':
      return it.question;
  }
}

const EXAMPLE = `# EXEMPLE — à remplacer par ton propre contenu
cartes:
  - matiere: maths
    chapitre: "Dérivation et convexité"
    recto: "EXEMPLE — à remplacer : ta question"
    verso: "EXEMPLE — à remplacer : ta réponse"
`;

export function ImportPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [browse, setBrowse] = useState<ContentType>('card');
  const content = useLiveQuery(() => db.content.toArray(), []) ?? [];

  const check = async () => {
    const chapters = await db.chapters.toArray();
    setResult(parseImport(text, chapters));
    setDone(null);
  };
  const apply = async () => {
    if (!result || result.errors.length) return;
    const r = await applyImport(result.items, result.chapters);
    setDone(`${r.added} élément(s) ajouté(s), ${r.updated} mis à jour${result.chapters.length ? `, ${result.chapters.length} chapitre(s) créé(s)` : ''}.`);
    setResult(null);
    setText('');
  };

  const counts = content.reduce<Partial<Record<ContentType, number>>>((c, it) => ({ ...c, [it.type]: (c[it.type] ?? 0) + 1 }), {});
  const browsing = content.filter((c) => c.type === browse);

  return (
    <div className="space-y-4">
      <PageTitle sub="Format YAML ou JSON décrit dans CONTENT_FORMAT.md">Importer du contenu</PageTitle>

      <Card title="1. Convertir tes notes avec Claude">
        <p className="mb-2 text-sm">Copie ce prompt dans Claude (chat), colle tes notes à la suite, puis colle le YAML obtenu ci-dessous.</p>
        <Button
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(CONVERSION_PROMPT);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? '✓ Copié' : '📋 Copier le prompt'}
        </Button>
      </Card>

      <Card title="2. Coller ou charger le fichier">
        <textarea className={`${inputCls} font-mono text-xs`} rows={12} placeholder={EXAMPLE} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button onClick={check} disabled={!text.trim()}>
            Vérifier
          </Button>
          <label className="cursor-pointer rounded-lg bg-slate-200 px-4 py-2 text-sm dark:bg-slate-800">
            Charger un fichier
            <input type="file" accept=".yaml,.yml,.json,.txt,.md" className="hidden" onChange={async (e) => e.target.files?.[0] && setText(await e.target.files[0].text())} />
          </label>
        </div>
        {done && (
          <div className="mt-3">
            <Banner tone="ok">✓ {done}</Banner>
          </div>
        )}
        {result && (
          <div className="mt-3 space-y-2">
            {result.errors.length > 0 ? (
              <Banner tone="error">
                <div className="font-semibold">{result.errors.length} erreur(s) — rien n’a été importé :</div>
                <ul className="mt-1 list-disc pl-5">
                  {result.errors.slice(0, 40).map((e, i) => (
                    <li key={i}>
                      <code>{e.path}</code> — {e.message}
                    </li>
                  ))}
                </ul>
              </Banner>
            ) : (
              <Banner tone="ok">
                Prêt à importer :{' '}
                {Object.entries(result.counts)
                  .map(([k, v]) => `${v} ${SECTION_LABELS[k as keyof typeof SECTION_LABELS].toLowerCase()}`)
                  .join(', ')}
              </Banner>
            )}
            {result.warnings.length > 0 && (
              <Banner tone="warn">
                <ul className="list-disc pl-5">
                  {result.warnings.map((w, i) => (
                    <li key={i}>
                      <code>{w.path}</code> — {w.message}
                    </li>
                  ))}
                </ul>
              </Banner>
            )}
            {result.errors.length === 0 && <Button onClick={apply}>Importer</Button>}
          </div>
        )}
      </Card>

      <Card title="Contenu enregistré">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(Object.keys(TYPE_LABELS) as ContentType[]).map((t) => (
            <Chip key={t} active={browse === t} onClick={() => setBrowse(t)}>
              {TYPE_LABELS[t]} · {counts[t] ?? 0}
            </Chip>
          ))}
        </div>
        {browsing.length === 0 ? (
          <p className="text-sm text-slate-500">Rien pour l’instant.</p>
        ) : (
          <ul className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
            {browsing.slice(0, 200).map((it) => (
              <li key={it.id} className="flex items-start gap-2 py-2">
                <Badge color={SUBJECTS[it.subject].color}>{SUBJECTS[it.subject].short}</Badge>
                <Md text={itemTitle(it)} className="min-w-0 flex-1 [&>p]:m-0" />
                <button
                  type="button"
                  className="shrink-0 text-xs text-red-500"
                  onClick={() => {
                    if (confirm('Supprimer cet élément ?')) void deleteContent(it.id);
                  }}
                >
                  Suppr.
                </button>
              </li>
            ))}
          </ul>
        )}
        {browsing.length > 200 && <p className="mt-2 text-xs text-slate-500">200 premiers affichés.</p>}
      </Card>
    </div>
  );
}
