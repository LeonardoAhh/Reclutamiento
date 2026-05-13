import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, StickyNote, BadgeCheck } from 'lucide-react';
import type { Candidate } from '@/lib/types';

interface KanbanCardProps {
  candidate: Candidate;
  notesCount?: number;
  onEdit: (c: Candidate) => void;
  onDelete: (c: Candidate) => void;
  onNotes?: (c: Candidate) => void;
  onHire?: (c: Candidate) => void;
}

function formatShortDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '—';
  }
}

export function KanbanCard({
  candidate,
  notesCount = 0,
  onEdit,
  onDelete,
  onNotes,
  onHire,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: candidate.id ?? candidate.nombre });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`kanban-card${isDragging ? ' kanban-card--dragging' : ''}`}
      aria-label={`Candidato ${candidate.nombre}`}
    >
      <button
        type="button"
        className="kanban-card__handle"
        aria-label={`Mover a ${candidate.nombre}`}
        title="Arrastrar para mover"
        {...listeners}
        {...attributes}
      >
        <GripVertical size={14} aria-hidden="true" />
      </button>

      <div className="kanban-card__body">
        <header className="kanban-card__head">
          <h3 className="kanban-card__name">{candidate.nombre}</h3>
          {candidate.employee_num && (
            <span
              className="kanban-card__hired-tag"
              title={`Empleado #${candidate.employee_num}`}
              aria-label={`Empleado #${candidate.employee_num}`}
            >
              <BadgeCheck size={11} aria-hidden="true" />
              #{candidate.employee_num}
            </span>
          )}
        </header>
        <p className="kanban-card__puesto">{candidate.puesto}</p>
        <p className="kanban-card__area">{candidate.area}</p>

        <dl className="kanban-card__meta">
          {candidate.reclutador && (
            <div className="kanban-card__meta-row">
              <dt>Reclutador</dt>
              <dd>{candidate.reclutador}</dd>
            </div>
          )}
          {candidate.source && (
            <div className="kanban-card__meta-row">
              <dt>Fuente</dt>
              <dd>{candidate.source}</dd>
            </div>
          )}
          <div className="kanban-card__meta-row">
            <dt>Aplicó</dt>
            <dd>{formatShortDate(candidate.fecha_aplicacion)}</dd>
          </div>
        </dl>

        <footer className="kanban-card__actions">
          {onHire && candidate.status === 'contratado' && !candidate.employee_num && (
            <button
              type="button"
              className="kanban-card__action-btn kanban-card__action-btn--primary"
              onClick={() => onHire(candidate)}
              aria-label={`Contratar a ${candidate.nombre}`}
              title="Contratar (crear empleado)"
            >
              <BadgeCheck size={14} aria-hidden="true" />
            </button>
          )}
          {onNotes && (
            <button
              type="button"
              className="kanban-card__action-btn"
              onClick={() => onNotes(candidate)}
              aria-label={`Notas de ${candidate.nombre}`}
              title={`Notas (${notesCount})`}
            >
              <StickyNote size={14} aria-hidden="true" />
              {notesCount > 0 && (
                <span className="kanban-card__action-badge">{notesCount}</span>
              )}
            </button>
          )}
          <button
            type="button"
            className="kanban-card__action-btn"
            onClick={() => onEdit(candidate)}
            aria-label={`Editar ${candidate.nombre}`}
            title="Editar"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="kanban-card__action-btn kanban-card__action-btn--danger"
            onClick={() => onDelete(candidate)}
            aria-label={`Eliminar ${candidate.nombre}`}
            title="Eliminar"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </footer>
      </div>
    </article>
  );
}
