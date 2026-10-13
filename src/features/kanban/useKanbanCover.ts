import { useEffect, useState } from 'react';
import { downloadKanbanCover } from './cover';

export function useKanbanCover(path: string | null) {
  const [cover, setCover] = useState<{ path: string; url: string } | null>(null);
  const [failedPath, setFailedPath] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let active = true;
    let objectUrl: string | null = null;
    void downloadKanbanCover(path).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setCover({ path, url: objectUrl });
      setFailedPath(null);
    }).catch(() => { if (active) setFailedPath(path); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path]);
  return { url: cover?.path === path ? cover.url : null, error: Boolean(path) && failedPath === path };
}
