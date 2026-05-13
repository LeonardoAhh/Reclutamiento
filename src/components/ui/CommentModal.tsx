import { useState } from 'react';
import { X, MessageSquarePlus } from 'lucide-react';
import { COMMENT_TYPE_LABELS } from '@/lib/constants';
import type { PositionComment } from '@/lib/types';
import './CommentModal.css';

interface CommentModalProps {
  isOpen: boolean;
  area: string;
  seccion: string;
  puesto: string;
  existingComments: PositionComment[];
  onClose: () => void;
  onSave: (comment: PositionComment) => void;
}

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

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comentario.trim()) return;

    onSave({
      area,
      seccion,
      puesto,
      comentario: comentario.trim(),
      tipo,
      fecha: new Date().toISOString(),
    });

    setComentario('');
    setTipo('proceso_activo');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header__info">
            <h3>{puesto}</h3>
            <span className="modal-header__area">{area}</span>
          </div>
          <button
            id="btn-close-comment-modal"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Existing comments */}
        {existingComments.length > 0 && (
          <div className="modal-comments-list">
            <span className="modal-section-label">Comentarios existentes</span>
            {existingComments.map((c, i) => (
              <div key={i} className="comment-item">
                <span
                  className="comment-item__type"
                  data-type={c.tipo}
                >
                  {COMMENT_TYPE_LABELS[c.tipo]}
                </span>
                <p className="comment-item__text">{c.comentario}</p>
                <span className="comment-item__date">
                  {new Date(c.fecha).toLocaleDateString('es-MX')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* New comment form */}
        <form className="modal-form" onSubmit={handleSubmit}>
          <span className="modal-section-label">Nuevo comentario</span>

          <div className="modal-form__field">
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

          <div className="modal-form__field">
            <label htmlFor="comment-text">Comentario</label>
            <textarea
              id="comment-text"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ej: Candidato en segunda entrevista, pendiente referencias..."
              rows={3}
            />
          </div>

          <button
            id="btn-save-comment"
            type="submit"
            className="btn-primary"
            disabled={!comentario.trim()}
          >
            <MessageSquarePlus size={16} />
            Guardar Comentario
          </button>
        </form>
      </div>
    </div>
  );
}
