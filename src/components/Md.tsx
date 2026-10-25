import { memo, useMemo } from 'react';
import { renderMarkdown } from '../lib/markdown';

/** Renders Markdown + $TeX$ (all non-math text is escaped). */
export const Md = memo(function Md({ text, className = '' }: { text: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(text), [text]);
  return <div className={`md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
});

export const Tex = memo(function Tex({ tex, className = '' }: { tex: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(`$${tex}$`), [tex]);
  return <span className={`md inline-block [&>p]:m-0 ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
});
