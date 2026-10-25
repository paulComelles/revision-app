import { useEffect, useState } from 'react';
import { db } from '../db/db';

export function PhotoView({ id, className = '' }: { id: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    let alive = true;
    db.photos.get(id).then((p) => {
      if (!alive || !p) return;
      u = URL.createObjectURL(p.blob);
      setUrl(u);
    });
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Photo de l’exercice" className={`max-h-80 rounded-lg border border-slate-200 dark:border-slate-800 ${className}`} />
    </a>
  );
}
