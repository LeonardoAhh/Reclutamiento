import { pointerWithin, type CollisionDetection, type KeyboardCoordinateGetter } from '@dnd-kit/core';
import { isTaskStatus, TASK_STATUSES, type KanbanTask } from './types';

export const kanbanCollision: CollisionDetection = args => {
  const pointerCoordinates = args.pointerCoordinates ?? {
    x: args.collisionRect.left + args.collisionRect.width / 2,
    y: args.collisionRect.top + args.collisionRect.height / 2,
  };
  const hits = pointerWithin({ ...args, pointerCoordinates });
  const cards = hits.filter(hit => !isTaskStatus(hit.id) && hit.id !== args.active.id);
  return cards.length ? cards : hits.filter(hit => hit.id !== args.active.id);
};

export function resolveTaskDrop(tasks: readonly KanbanTask[], activeId: string, overId: string, after: boolean) {
  const active = tasks.find(task => task.id === activeId);
  const target = tasks.find(task => task.id === overId);
  const status = isTaskStatus(overId) ? overId : target?.status;
  if (!active || !status || activeId === overId) return null;
  const rows = tasks.filter(task => task.status === status && task.id !== activeId);
  const targetIndex = target ? rows.findIndex(task => task.id === target.id) : rows.length;
  const index = target ? targetIndex + (after ? 1 : 0) : rows.length;
  const beforeId = rows[index]?.id ?? null;
  if (active.status === status) {
    const original = tasks.filter(task => task.status === status);
    if (original.findIndex(task => task.id === activeId) === index) return null;
  }
  return { status, beforeId };
}

// Izquierda/derecha recorre estados incluso cuando las columnas se apilan en móvil.
export const kanbanKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates, context }) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) return;
  event.preventDefault();
  const overId = context.over?.id ?? context.active?.id;
  const over = overId ? context.droppableContainers.get(overId) : undefined;
  const status: unknown = isTaskStatus(overId) ? overId : over?.data.current?.status ?? context.active?.data.current?.status;
  if (!isTaskStatus(status)) return;
  let targetId: string | number | undefined;
  if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
    targetId = TASK_STATUSES[TASK_STATUSES.indexOf(status) + (event.code === 'ArrowRight' ? 1 : -1)];
  } else {
    const cards = context.droppableContainers.getEnabled().filter(item => !isTaskStatus(item.id) && item.data.current?.status === status);
    cards.sort((a, b) => (context.droppableRects.get(a.id)?.top ?? 0) - (context.droppableRects.get(b.id)?.top ?? 0));
    const currentId = isTaskStatus(overId) && context.active?.data.current?.status === status ? context.active.id : overId;
    const current = cards.findIndex(item => item.id === currentId);
    const next = current < 0 ? (event.code === 'ArrowDown' ? 0 : cards.length - 1)
      : current + (event.code === 'ArrowDown' ? 1 : -1);
    targetId = cards[next]?.id;
  }
  const target = targetId ? context.droppableRects.get(targetId) : undefined;
  const rect = context.collisionRect;
  if (!target || !rect) return;
  return {
    x: currentCoordinates.x + target.left + target.width / 2 - rect.left - rect.width / 2,
    y: currentCoordinates.y + target.top + target.height / 2 - rect.top - rect.height / 2,
  };
};
