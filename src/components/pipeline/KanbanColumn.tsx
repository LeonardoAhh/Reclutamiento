import { useDroppable } from '@dnd-kit/core';
import type { Candidate, CandidateStatus } from '@/lib/types';
import { CANDIDATE_STATUS_LABEL } from '@/lib/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: CandidateStatus;
  candidates: Candidate[];
  notesCount?: (c: Candidate) => number;
  onEdit: (c: Candidate) => void;
  onDelete: (c: Candidate) => void;
  onNotes?: (c: Candidate) => void;
  onHire?: (c: Candidate) => void;
}

const TONE_BY_STATUS: Record<CandidateStatus, string> = {
  entrevista: 'amber',
  entrega_documentos: 'amber',
  faltan_documentos: 'amber',
  feedback_pendiente: 'coral',
  contratado: 'success',
  rechazado: 'error',
  no_asistio: 'error',
};

export function KanbanColumn({
  status,
  candidates,
  notesCount,
  onEdit,
  onDelete,
  onNotes,
  onHire,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-col kanban-col--${TONE_BY_STATUS[status]}${isOver ? ' kanban-col--over' : ''}`}
      aria-label={`Columna ${CANDIDATE_STATUS_LABEL[status]}`}
    >
      <header className="kanban-col__head">
        <h2 className="kanban-col__title">{CANDIDATE_STATUS_LABEL[status]}</h2>
        <span className="kanban-col__count" aria-label={`${candidates.length} candidatos`}>
          {candidates.length}
        </span>
      </header>

      <div className="kanban-col__body">
        {candidates.length === 0 ? (
          <div className="kanban-col__empty">Sin candidatos</div>
        ) : (
          candidates.map((c) => (
            <KanbanCard
              key={c.id ?? c.nombre}
              candidate={c}
              notesCount={notesCount ? notesCount(c) : 0}
              onEdit={onEdit}
              onDelete={onDelete}
              onNotes={onNotes}
              onHire={onHire}
            />
          ))
        )}
      </div>
    </section>
  );
}
