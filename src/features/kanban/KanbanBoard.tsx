import { useId, useRef, useState } from 'react';
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/Tabs';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DESKTOP_MEDIA_QUERY, LAYOUT_BREAKPOINTS } from '@/lib/layout';
import { isTaskStatus, TASK_STATUSES, type KanbanTask, type TaskDraft, type TaskStatus } from './types';
import { TaskForm } from './TaskForm';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';
import { STATUS_ICONS } from './KanbanBadge';
import { kanbanCollision, kanbanKeyboardCoordinates, resolveTaskDrop } from './drag';
import type { KanbanCopy } from './copy';
import { playSound } from '@/lib/sound';

export interface KanbanEditor {
  id: string;
  task: KanbanTask | null;
  status: TaskStatus;
}
interface KanbanBoardProps {
  layoutMode: 'grid' | 'list';
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
function KanbanList({ tasks, copy: t, locked, now, pageSize, onEdit, editButtonRef }: {
  tasks: readonly KanbanTask[];
  copy: KanbanCopy;
  locked: boolean;
  now: number;
  pageSize: number;
  onEdit: (task: KanbanTask) => void;
  editButtonRef: (taskId: string, node: HTMLButtonElement | null) => void;
}) {
  const orderedTasks = TASK_STATUSES.flatMap(status => tasks.filter(task => task.status === status));
  const pagination = usePagination(orderedTasks, pageSize);
  return <section className="kanban-list-view" aria-label={t.listView}>
    {tasks.length === 0 ? <p className="kanban-list-view__empty type-body-md">{t.boardEmpty}</p>
      : <SortableContext items={pagination.pageItems.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <ul className="kanban-list-view__items">
          {pagination.pageItems.map(task => <li key={task.id} className="kanban-list-view__item">
            <KanbanTaskCard task={task} copy={t} disabled={locked} now={now} layout="list"
              onEdit={() => onEdit(task)} editButtonRef={node => editButtonRef(task.id, node)} />
          </li>)}
        </ul>
      </SortableContext>}
    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages}
      onPageChange={pagination.goToPage} canGoPrev={pagination.canGoPrev} canGoNext={pagination.canGoNext}
      ariaLabel={`${t.paginationFor} ${t.listView}`} />
  </section>;
}
export function KanbanBoard({ layoutMode, tasks, copy: t, disabled, busy, error, editor,
  getAddButton, onEdit, onDelete, onMove, onArchive, now, onSave, onCloseEditor }: KanbanBoardProps) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [pendingDropStatus, setPendingDropStatus] = useState<TaskStatus | null>(null);
  const [activeStatus, setActiveStatus] = useState<TaskStatus>('pending');
  const isTablet = useMediaQuery(`(min-width: ${LAYOUT_BREAKPOINTS.tablet}px)`);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const listView = isTablet && layoutMode === 'list';
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
    if (!isTablet) setActiveStatus(status);
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
  const statusTabs = <TabsList variant="outlined" aria-label={t.status}>
    {TASK_STATUSES.map(status => {
      const Icon = STATUS_ICONS[status];
      return <TabsTrigger key={status} value={status}
        id={`${id}-tab-${status}`} aria-controls={`${id}-panel-${status}`}
        className="kanban-status-tabs__trigger" disabled={dragging || locked}>
        <Icon size="var(--icon-size-sm)" aria-hidden="true" />
        <span>{t.statuses[status]}</span>
      </TabsTrigger>;
    })}
  </TabsList>;
  function renderColumn(status: TaskStatus) {
    const headingId = `${id}-${status}`;
    const tabPanel = !dragging && !isTablet;
    const hidden = !dragging && !isTablet && activeStatus !== status;
    return <TabsContent key={status} value={status} forceMount
      id={`${id}-panel-${status}`} className="kanban-board__panel"
      hidden={hidden} role={tabPanel ? 'tabpanel' : 'group'}
      aria-labelledby={tabPanel ? `${id}-tab-${status}` : headingId}
      tabIndex={tabPanel ? 0 : undefined}>
      <KanbanColumn status={status} tasks={tasks.filter(task => task.status === status)} copy={t}
        locked={locked} dragging={dragging} pending={pendingDropStatus === status} now={now}
        headingId={headingId} headingRef={node => { headings.current[status] = node; }}
        editButtonRef={(taskId, node) => { editButtons.current[taskId] = node; }}
        onEdit={onEdit} pageSize={pageSize} />
    </TabsContent>;
  }
  return (
    <TabsRoot className="kanban-board-navigation" value={activeStatus}
      onValueChange={value => {
        if (value !== activeStatus) playSound('select');
        if (isTaskStatus(value)) setActiveStatus(value);
      }}>
    <DndContext id={id} sensors={sensors} collisionDetection={kanbanCollision}
      onDragStart={() => { playSound('select'); setDragging(true); }}
      onDragCancel={() => setDragging(false)} onDragEnd={endDrag}
      accessibility={{ screenReaderInstructions: { draggable: listView ? t.listDragInstructions : t.dragInstructions }, announcements: {
        onDragStart: ({ active }) => `${t.drag}: ${taskTitle(active.id)}. ${listView ? t.listDragInstructions : t.dragInstructions}`,
        onDragOver: ({ over }) => moveAnnouncement(over?.id),
        onDragEnd: ({ over }) => moveAnnouncement(over?.id),
        onDragCancel: () => t.dragCancel,
      } }}>
      {!isTablet && statusTabs}
      {listView ? <KanbanList tasks={tasks} copy={t} locked={locked} now={now}
        pageSize={pageSize * TASK_STATUSES.length} onEdit={onEdit}
        editButtonRef={(taskId, node) => { editButtons.current[taskId] = node; }} />
        : <div className="kanban-board">
          {TASK_STATUSES.map(renderColumn)}
        </div>}
      {form()}
    </DndContext>
    </TabsRoot>
  );
}
