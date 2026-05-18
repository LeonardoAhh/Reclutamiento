import { useEffect, useState } from 'react';
import { MessageSquarePlus, MessageSquare } from 'lucide-react';
import { COMMENT_TYPE_LABELS } from '@/lib/constants';
import type { PositionComment } from '@/lib/types';
import { TZ_MX } from '@/lib/dates';
import { Modal } from './Modal';
import './CommentModal.css';

interface CommentModalProps {
  isOpen: boolean;
  area: string;
  seccion: string;
  puesto: string;
  existingComments: PositionComment[];
  onClose: () => void;
  onSave: (comment: PositionComment) => void | Promise<unknown>;
}

const MAX_LEN = 280;

export function CommentModal({
  isOpen,
  area,
  seccion,
  puesto,
  existingComments,
  onClose,
  onSave,
}: CommentModalProps) {
  const [tipo, setTipo] = useState<PositionComment['tipo']>('proceso_activo');
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTipo('proceso_activo');
      setComentario('');
      setSubmitting(false);
    }
  }, [isOpen, puesto]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = comentario.trim();
    if (!trimmed || submitting) return;
    try {
      setSubmitting(true);
      await onSave({
        area,
        seccion,
        puesto,
        comentario: trimmed,
        tipo,
        fecha: new Date().toISOString(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...existingComments].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<MessageSquare size={20} className="color-primary" aria-hidden="true" />}
      title={puesto || 'Comentario'}
      subtitle={`${area}${seccion ? ` · ${seccion}` : ''}`}
    >
      {sorted.length > 0 && (
        <div className="modal-comments-list">
          <span className="modal-section-label">Comentarios existentes</span>
          {sorted.map((c, i) => (
            <article key={c.id ?? `${c.fecha}-${i}`} className="comment-item">
              <header className="comment-item__head">
                <span className="comment-item__type" data-type={c.tipo}>
                  {COMMENT_TYPE_LABELS[c.tipo]}
                </span>
                <span className="comment-item__date">
                  {new Date(c.fecha).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    timeZone: TZ_MX,
                  })}
                </span>
              </header>
              <p className="comment-item__text">{c.comentario}</p>
            </article>
          ))}
        </div>
      )}

      <form className="modal-form" onSubmit={handleSubmit} noValidate>
        <span className="modal-section-label">Nuevo comentario</span>

        <div className="form-group">
          <label htmlFor="comment-type">Tipo</label>
          <select
            id="comment-type"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as PositionComment['tipo'])}
          >
            {Object.entries(COMMENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="comment-text">Comentario</label>
          <textarea
            id="comment-text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value.slice(0, MAX_LEN))}
            placeholder="Ej. Candidato en segunda entrevista, pendiente referencias…"
            rows={4}
            required
          />
          <span className="char-counter">{comentario.length}/{MAX_LEN}</span>
        </div>

        <div className="modal-form__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!comentario.trim() || submitting}
          >
            <MessageSquarePlus size={16} aria-hidden="true" />
            {submitting ? 'Guardando…' : 'Guardar comentario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
