import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent } from '@dnd-kit/core';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DESKTOP_MEDIA_QUERY, LAYOUT_BREAKPOINTS } from '@/lib/layout';
import { isTaskStatus, TASK_STATUSES, type KanbanTask, type TaskDraft, type TaskStatus } from './types';
import { TaskForm } from './TaskForm';
import { KanbanColumn } from './KanbanColumn';
import { kanbanCollision, kanbanKeyboardCoordinates, resolveTaskDrop } from './drag';
import type { KanbanCopy } from './copy';
import { playSound } from '@/lib/sound';

export interface KanbanEditor {
  id: string;
  task: KanbanTask | null;
  status: TaskStatus;
}
interface KanbanBoardProps {
  desktopTabsTarget: HTMLElement | null;
  tasks: readonly KanbanTask[];
  copy: KanbanCopy;
  disabled: boolean;
  busy: boolean;
  error: string;
  editor: KanbanEditor | null;
  getAddButton: () => HTMLButtonElement | null;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => Promise<boolean>;
  onMove: (task: KanbanTask, status: TaskStatus, beforeId: string | null) => Promise<boolean>;
  onArchive: (task: KanbanTask) => Promise<boolean>;
  now: number;
  onSave: (draft: TaskDraft, coverFile: File | null, coverUploadId: string | null) => Promise<boolean>;
  onCloseEditor: () => void;
}
export function KanbanBoard({ desktopTabsTarget, tasks, copy: t, disabled, busy, error, editor,
  getAddButton, onEdit, onDelete, onMove, onArchive, now, onSave, onCloseEditor }: KanbanBoardProps) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [pendingDropStatus, setPendingDropStatus] = useState<TaskStatus | null>(null);
  const [activeStatus, setActiveStatus] = useState<TaskStatus>('pending');
  const [desktopView, setDesktopView] = useState<'board' | 'notes'>('board');
  const isTablet = useMediaQuery(`(min-width: ${LAYOUT_BREAKPOINTS.tablet}px)`);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const selectedView = isDesktop ? desktopView : activeStatus;
  const pageSize = isDesktop ? 4 : 2;
  const headings = useRef<Partial<Record<TaskStatus, HTMLHeadingElement | null>>>({});
  const editButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: kanbanKeyboardCoordinates }),
  );
  const locked = disabled || editor !== null;
  function selectTaskView(status: TaskStatus) {
    if (isDesktop) setDesktopView(status === 'notes' ? 'notes' : 'board');
    else if (!isTablet) setActiveStatus(status);
  }
  function restoreEditorFocus(status: TaskStatus, taskId?: string) {
    selectTaskView(status);
    requestAnimationFrame(() => {
      const target = taskId ? editButtons.current[taskId] : null;
      (target ?? getAddButton() ?? headings.current[status])?.focus();
    });
  }
  function closeEditor() {
    if (!editor) return;
    onCloseEditor();
    restoreEditorFocus(editor.status, editor.task?.id);
  }
  async function save(draft: TaskDraft, coverFile: File | null, coverUploadId: string | null) {
    if (await onSave(draft, coverFile, coverUploadId)) restoreEditorFocus(draft.status, editor?.task?.id);
  }
  function endDrag({ active, over }: DragEndEvent) {
    setDragging(false);
    if (locked || !over) return;
    const rect = active.rect.current.translated;
    const source = tasks.find(task => task.id === active.id);
    const target = tasks.find(task => task.id === over.id);
    const originalRows = tasks.filter(task => task.status === source?.status);
    const sameColumnAfter = originalRows.findIndex(task => task.id === active.id) < originalRows.findIndex(task => task.id === over.id);
    const after = rect ? rect.top + rect.height / 2 > over.rect.top + over.rect.height / 2 : sameColumnAfter;
    const drop = resolveTaskDrop(tasks, String(active.id), String(over.id),
      target?.status === source?.status ? sameColumnAfter : after);
    if (source && drop) {
      const changingColumn = source.status !== drop.status;
      if (changingColumn) setPendingDropStatus(drop.status);
      void onMove(source, drop.status, drop.beforeId).then(saved => {
        setPendingDropStatus(null);
        if (saved) {
          selectTaskView(drop.status);
          requestAnimationFrame(() => editButtons.current[source.id]?.focus());
        }
      });
    }
  }
  async function archive() {
    if (!editor?.task) return;
    if (await onArchive(editor.task)) restoreEditorFocus(editor.status);
  }
  async function remove() {
    if (!editor?.task) return;
    if (await onDelete(editor.task)) restoreEditorFocus(editor.status);
  }
  function form() {
    return editor && <TaskForm key={editor.id} initial={editor.task} initialStatus={editor.status}
      copy={t} busy={busy} error={error} onClose={closeEditor} onSave={save} onDelete={editor.task ? remove : undefined}
      onArchive={editor.task ? archive : undefined} />;
  }
  const overStatus = (overId: string | number | undefined) => isTaskStatus(overId) ? overId : tasks.find(task => task.id === overId)?.status;
  const moveAnnouncement = (overId: string | number | undefined) => {
    const status = overStatus(overId);
    return status ? `${t.moveTo} ${t.statuses[status]}` : t.dragCancel;
  };
  const taskTitle = (taskId: string | number) => tasks.find(task => task.id === taskId)?.title ?? '';
  const desktopTabs = <Tabs.List className="kanban-status-tabs kanban-status-tabs--joined" aria-label={t.title}>
    {(['board', 'notes'] as const).map(view => <Tabs.Trigger key={view} value={view}
      id={`${id}-tab-${view}`} aria-controls={`${id}-panel-${view}`}
      className="kanban-status-tabs__trigger" disabled={dragging || locked}>
      {view === 'board' ? t.boardView : t.statuses.notes}
      {view === 'notes' && <> · {tasks.filter(task => task.status === 'notes').length}</>}
    </Tabs.Trigger>)}
  </Tabs.List>;
  const statusTabs = <Tabs.List className="kanban-status-tabs" aria-label={t.status}>
    {TASK_STATUSES.map(status => <Tabs.Trigger key={status} value={status}
      id={`${id}-tab-${status}`} aria-controls={`${id}-panel-${status}`}
      className="kanban-status-tabs__trigger" disabled={dragging || locked}>
      {t.statuses[status]}
    </Tabs.Trigger>)}
  </Tabs.List>;
  function renderColumn(status: TaskStatus) {
    const headingId = `${id}-${status}`;
    const tabPanel = !dragging && (!isTablet || (isDesktop && status === 'notes'));
    const hidden = !dragging && (isDesktop
      ? status === 'notes' && desktopView !== 'notes'
      : !isTablet && activeStatus !== status);
    return <Tabs.Content key={status} value={status} forceMount
      id={`${id}-panel-${status}`} className="kanban-board__panel"
      hidden={hidden} role={tabPanel ? 'tabpanel' : 'group'}
      aria-labelledby={tabPanel ? `${id}-tab-${status}` : headingId}
      tabIndex={tabPanel ? 0 : undefined}>
      <KanbanColumn status={status} tasks={tasks.filter(task => task.status === status)} copy={t}
        layout={isDesktop && status === 'notes' ? 'grid' : 'list'}
        locked={locked} dragging={dragging} pending={pendingDropStatus === status} now={now}
        headingId={headingId} headingRef={node => { headings.current[status] = node; }}
        editButtonRef={(taskId, node) => { editButtons.current[taskId] = node; }}
        onEdit={onEdit} pageSize={pageSize} />
    </Tabs.Content>;
  }
  return (
    <Tabs.Root className="kanban-board-navigation" value={selectedView}
      onValueChange={value => {
        if (value !== selectedView) playSound('select');
        if (isDesktop && (value === 'board' || value === 'notes')) setDesktopView(value);
        else if (isTaskStatus(value)) setActiveStatus(value);
      }}>
    <DndContext id={id} sensors={sensors} collisionDetection={kanbanCollision}
      onDragStart={() => { playSound('select'); setDragging(true); }}
      onDragCancel={() => setDragging(false)} onDragEnd={endDrag}
      accessibility={{ screenReaderInstructions: { draggable: t.dragInstructions }, announcements: {
        onDragStart: ({ active }) => `${t.drag}: ${taskTitle(active.id)}. ${t.dragInstructions}`,
        onDragOver: ({ over }) => moveAnnouncement(over?.id),
        onDragEnd: ({ over }) => moveAnnouncement(over?.id),
        onDragCancel: () => t.dragCancel,
      } }}>
      {!isTablet && statusTabs}
      {isDesktop && desktopTabsTarget && createPortal(desktopTabs, desktopTabsTarget)}
      <div className="kanban-board" data-dragging={dragging || undefined} data-view={isDesktop ? desktopView : undefined}>
        <Tabs.Content value="board" forceMount id={`${id}-panel-board`} className="kanban-board__work"
          hidden={isDesktop && !dragging && desktopView !== 'board'}
          role={isDesktop && !dragging ? 'tabpanel' : 'group'}
          aria-labelledby={isDesktop && !dragging ? `${id}-tab-board` : undefined}
          aria-label={!isDesktop || dragging ? t.boardView : undefined}
          tabIndex={isDesktop && !dragging ? 0 : undefined}>
          {TASK_STATUSES.filter(status => status !== 'notes').map(renderColumn)}
        </Tabs.Content>
        {renderColumn('notes')}
      </div>
      {form()}
    </DndContext>
    </Tabs.Root>
  );
}
