import { useState } from 'react';
import { useKanbanCover } from './useKanbanCover';
import type { KanbanCopy } from './copy';

export function KanbanCover({ path, copy }: { path: string | null; copy: KanbanCopy }) {
  const cover = useKanbanCover(path);
  return <KanbanCoverView path={path} copy={copy} cover={cover} />;
}

export function KanbanCoverView({ path, copy, cover, variant = 'card' }: {
  path: string | null;
  copy: KanbanCopy;
  cover: ReturnType<typeof useKanbanCover>;
  variant?: 'card' | 'detail';
}) {
  const [failedImagePath, setFailedImagePath] = useState<string | null>(null);
  const className = variant === 'detail' ? 'kanban-task-preview__cover' : 'kanban-task__cover';
  if (!path) return null;
  if (cover.error || failedImagePath === path) {
    return <span className="kanban-task__cover-error type-body-sm">{copy.coverLoadFailed}</span>;
  }
  if (!cover.url) return <span className={`${className} kanban-task__cover-loading`} aria-hidden="true" />;
  return <img className={className} src={cover.url} alt=""
    onError={() => setFailedImagePath(path)} />;
}
