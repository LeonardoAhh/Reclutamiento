import { useEffect, useMemo, useState } from 'react';
import { StickyNote, MessageSquarePlus } from 'lucide-react';
import { Modal } from './Modal';
import type { Candidate, CandidateNote } from '@/lib/types';
import './CommentModal.css';

interface CandidateNotesModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  notes: CandidateNote[];
  onClose: () => void;
  onSave: (
    note: Omit<CandidateNote, 'id' | 'created_at'>
  ) => Promise<{ ok: boolean; message?: string }> | void;
}

const MAX_LEN = 320;

export function CandidateNotesModal({
  isOpen,
  candidate,
  notes,
  onClose,
  onSave,
}: CandidateNotesModalProps) {
  const [autor, setAutor] = useState('');
  const [texto, setTexto] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTexto('');
      setSubmitting(false);
    }
  }, [isOpen, candidate?.id]);

  const candidateNotes = useMemo(() => {
    if (!candidate?.id) return [];
    return notes
      .filter((n) => n.candidate_id === candidate.id)
      .sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
  }, [notes, candidate?.id]);

  if (!candidate) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = texto.trim();
    if (!trimmed || submitting || !candidate?.id) return;
    try {
      setSubmitting(true);
      await onSave({
        candidate_id: candidate.id,
        autor: autor.trim() || null,
        texto: trimmed,
      });
      setTexto('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<StickyNote size={20} className="color-primary" aria-hidden="true" />}
      title={candidate.nombre}
      subtitle={`${candidate.puesto} · ${candidate.area}`}
    >
      <div className="modal-comments-list">
        <span className="modal-section-label">Notas</span>
        {candidateNotes.length === 0 ? (
          <p className="comment-empty">Sin notas todavía. Agrega la primera abajo.</p>
        ) : (
          candidateNotes.map((n, i) => (
            <article key={n.id ?? `${n.created_at}-${i}`} className="comment-item">
              <header className="comment-item__head">
                <span className="comment-item__type" data-type="otro">
                  {n.autor || 'Sin autor'}
                </span>
                <span className="comment-item__date">
                  {n.created_at
                    ? new Date(n.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : ''}
                </span>
              </header>
              <p className="comment-item__text">{n.texto}</p>
            </article>
          ))
        )}
      </div>

      <form className="modal-form" onSubmit={handleSubmit} noValidate>
        <span className="modal-section-label">Nueva nota</span>

        <div className="form-group">
          <label htmlFor="note-autor">Autor (opcional)</label>
          <input
            id="note-autor"
            type="text"
            value={autor}
            onChange={(e) => setAutor(e.target.value.slice(0, 60))}
            placeholder="Tu nombre o iniciales"
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="note-text">Nota</label>
          <textarea
            id="note-text"
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, MAX_LEN))}
            placeholder="Ej. Entrevista técnica buena, pendiente referencias laborales."
            rows={4}
            required
          />
          <span className="char-counter">{texto.length}/{MAX_LEN}</span>
        </div>

        <div className="modal-form__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cerrar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!texto.trim() || submitting || !candidate.id}
          >
            <MessageSquarePlus size={16} aria-hidden="true" />
            {submitting ? 'Guardando…' : 'Agregar nota'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
