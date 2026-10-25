/**
 * Minimal Markdown + KaTeX renderer to an HTML string. All non-math text is
 * HTML-escaped. Supports paragraphs, line breaks, **bold**, *italic*, `code`,
 * headings (#), lists (- / 1.), quotes (>), pipe tables, $inline$ / $$display$$ math.
 */
import katex from 'katex';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cache = new Map<string, string>();

function renderTex(tex: string, display: boolean): string {
  const key = (display ? 'D' : 'I') + tex;
  const hit = cache.get(key);
  if (hit) return hit;
  let html: string;
  try {
    html = katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' });
  } catch {
    html = `<code>${escapeHtml(tex)}</code>`;
  }
  if (cache.size > 2000) cache.clear();
  cache.set(key, html);
  return html;
}

export function renderMarkdown(src: string): string {
  // 1. pull out math so Markdown never touches it
  const math: string[] = [];
  const holder = (i: number) => `\u0000${i}\u0000`;
  let text = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => {
    math.push(renderTex(t.trim(), true));
    return holder(math.length - 1);
  });
  text = text.replace(/(^|[^\\])\$([^$\n]+?)\$/g, (_, pre, t) => {
    math.push(renderTex(t, false));
    return pre + holder(math.length - 1);
  });
  text = text.replace(/\\\$/g, '$');

  const inline = (s: string) =>
    escapeHtml(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>');

  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`);
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') {
      flush();
      continue;
    }
    // table
    if (/^\|.*\|$/.test(trimmed) && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      flush();
      const row = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = row(trimmed);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) body.push(row(lines[i++]));
      i--;
      out.push(
        `<div class="md-table"><table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      );
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (h) {
      flush();
      const lvl = Math.min(6, h[1].length + 2);
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }
    if (/^[-*•]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      flush();
      const ordered = /^\d+[.)]\s+/.test(trimmed);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+[.)]\s+/.test(lines[i]) : /^\s*[-*•]\s+/.test(lines[i]))) {
        items.push(lines[i].trim().replace(ordered ? /^\d+[.)]\s+/ : /^[-*•]\s+/, ''));
        i++;
      }
      i--;
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (trimmed.startsWith('>')) {
      flush();
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) q.push(lines[i++].trim().replace(/^>\s?/, ''));
      i--;
      out.push(`<blockquote>${q.map(inline).join('<br>')}</blockquote>`);
      continue;
    }
    para.push(trimmed);
  }
  flush();
  // 2. put math back
  // eslint-disable-next-line no-control-regex
  return out.join('').replace(/\u0000(\d+)\u0000/g, (_, n) => math[Number(n)]);
}
