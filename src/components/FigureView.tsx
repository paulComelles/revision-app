import type { Figure } from '../generators/types';
import { Md } from './Md';

export function FigureView({ figure }: { figure: Figure }) {
  if (figure.kind === 'svg') {
    return (
      <figure className="figure text-slate-800 dark:text-slate-200" aria-label={figure.alt}>
        <div dangerouslySetInnerHTML={{ __html: figure.svg }} />
        <figcaption className="sr-only">{figure.alt}</figcaption>
      </figure>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto border-collapse text-sm">
        {figure.caption && <caption className="mb-1 text-xs text-slate-500">{figure.caption}</caption>}
        <thead>
          <tr>
            {figure.headers.map((h, i) => (
              <th key={i} className="border border-slate-300 bg-slate-100 px-2 py-1 font-semibold dark:border-slate-700 dark:bg-slate-800">
                <Md text={h} className="[&>p]:m-0" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {figure.rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="border border-slate-300 px-2 py-1 text-center dark:border-slate-700">
                  <Md text={c} className="[&>p]:m-0" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
