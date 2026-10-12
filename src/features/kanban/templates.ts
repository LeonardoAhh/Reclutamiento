import type { KanbanCopy } from './copy';
import type { TaskKind } from './types';

export function templateSteps(kind: TaskKind, copy: KanbanCopy): string[] {
  return [...copy.templates[kind]];
}
