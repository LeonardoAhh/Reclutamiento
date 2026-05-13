import { useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Candidate, CandidateStatus } from '@/lib/types';
import { CANDIDATE_STATUSES } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';
import './PipelineKanban.css';

interface PipelineKanbanProps {
  candidates: Candidate[];
  notesCount?: (c: Candidate) => number;
  onEdit: (c: Candidate) => void;
  onDelete: (c: Candidate) => void;
  onNotes?: (c: Candidate) => void;
  onHire?: (c: Candidate) => void;
  onStatusChange: (candidate: Candidate, status: CandidateStatus) => void;
}

export function PipelineKanban({
  candidates,
  notesCount,
  onEdit,
  onDelete,
  onNotes,
  onHire,
  onStatusChange,
}: PipelineKanbanProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const byStatus = useMemo(() => {
    const groups: Record<CandidateStatus, Candidate[]> = {
      aplico: [],
      revision: [],
      entrevista_1: [],
      entrevista_2: [],
      oferta: [],
      contratado: [],
      rechazado: [],
    };
    for (const c of candidates) groups[c.status].push(c);
    return groups;
  }, [candidates]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith('col-')) return;
    const targetStatus = overId.slice('col-'.length) as CandidateStatus;
    const candidate = candidates.find(
      (c) => (c.id ?? c.nombre) === String(active.id)
    );
    if (!candidate) return;
    if (candidate.status === targetStatus) return;
    onStatusChange(candidate, targetStatus);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="kanban" role="region" aria-label="Pipeline de candidatos">
        {CANDIDATE_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            candidates={byStatus[status]}
            notesCount={notesCount}
            onEdit={onEdit}
            onDelete={onDelete}
            onNotes={onNotes}
            onHire={onHire}
          />
        ))}
      </div>
    </DndContext>
  );
}
