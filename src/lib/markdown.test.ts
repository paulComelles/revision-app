import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('escapes HTML outside math', () => {
    const html = renderMarkdown('<script>alert(1)</script> **gras**');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<strong>gras</strong>');
  });
  it('renders inline and display math', () => {
    const html = renderMarkdown('Soit $x^2$ et $$\\frac{1}{2}$$');
    expect(html).toContain('katex');
    expect(html).toContain('katex-display');
  });
  it('does not apply markdown inside math', () => {
    const html = renderMarkdown('$a*b*c$');
    expect(html).not.toContain('<em>');
  });
  it('renders lists and tables', () => {
    expect(renderMarkdown('- a\n- b')).toContain('<ul><li>a</li><li>b</li></ul>');
    expect(renderMarkdown('1. a\n2. b')).toContain('<ol>');
    const t = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |');
    expect(t).toContain('<table>');
    expect(t).toContain('<td>2</td>');
  });
  it('keeps escaped dollars', () => {
    expect(renderMarkdown('costs \\$5 and \\$7')).toContain('$5 and $7');
  });
});
