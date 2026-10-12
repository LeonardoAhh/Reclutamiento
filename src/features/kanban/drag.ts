import { closestCenter, pointerWithin, type CollisionDetection, type KeyboardCoordinateGetter } from '@dnd-kit/core';
import { isTaskStatus, TASK_STATUSES } from './types';

export const kanbanCollision: CollisionDetection = args =>
  args.pointerCoordinates ? pointerWithin(args) : closestCenter(args);

// Las flechas recorren columnas también cuando se apilan en móvil.
export const kanbanKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates, context }) => {
  const direction = event.code === 'ArrowRight' || event.code === 'ArrowDown' ? 1
    : event.code === 'ArrowLeft' || event.code === 'ArrowUp' ? -1 : 0;
  if (!direction) return;
  event.preventDefault();
  const currentStatus: unknown = context.over?.id ?? context.active?.data.current?.status;
  if (!isTaskStatus(currentStatus)) return;
  const nextStatus = TASK_STATUSES[TASK_STATUSES.indexOf(currentStatus) + direction];
  if (!nextStatus) return;
  const target = context.droppableRects.get(nextStatus);
  const rect = context.collisionRect;
  if (!target || !rect) return;
  return {
    x: currentCoordinates.x + target.left + target.width / 2 - rect.left - rect.width / 2,
    y: currentCoordinates.y + target.top + target.height / 2 - rect.top - rect.height / 2,
  };
};
