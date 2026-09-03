import { useEffect, useId, useState } from 'react';
import { CircleCheckBig, CircleAlert, Trash2 } from 'lucide-react';
import { CircleCheckBig as CheckCircleIconData } from 'lucide';
import { Modal } from '@/components/ui/Modal';
import { AnimatedSubmitButton } from '@/components/ui/AnimatedSubmitButton';
import type { Baja } from '@/lib/types';
import { localTodayIso, formatReadableDate } from '@/lib/dates';
import './CubrirVacanteModal.css';

interface CubrirVacanteModalProps {
  isOpen: boolean;
  baja: Baja | null;
  onClose: () => void;
  onSave: (
    num_empleado: string,
    fecha: string,
    nota: string | null
  ) => Promise<{ ok: boolean; message?: string }>;
  onClear?: (num_empleado: string) => Promise<{ ok: boolean; message?: string }>;
}

export function CubrirVacanteModal({
  isOpen,
  baja,
  onClose,
  onSave,
  onClear,
}: CubrirVacanteModalProps) {
  const [fecha, setFecha] = useState<string>('');
  const [nota, setNota] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorId = useId();

  useEffect(() => {
    if (!isOpen || !baja) return;
    setFecha(baja.cubierta_fecha || localTodayIso());
    setNota(baja.cubierta_nota ?? '');
    setErrorMsg(null);
    setSubmitting(false);
    setIsSuccess(false);
  }, [isOpen, baja]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !baja) return;
    setErrorMsg(null);
    if (!fecha) {
      setErrorMsg('La fecha de cobertura es obligatoria.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await onSave(baja.num_empleado, fecha, nota.trim() || null);
      if (!res.ok) {
        setErrorMsg(res.message ?? 'No se pudo guardar.');
        setSubmitting(false);
        return;
      }
      setIsSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch {
      setErrorMsg('Error inesperado al registrar la cobertura.');
      setSubmitting(false);
    }
  }

  async function handleClear() {
    if (!baja || !onClear || submitting) return;
    setErrorMsg(null);
    try {
      setSubmitting(true);
      const res = await onClear(baja.num_empleado);
      if (!res.ok) {
        setErrorMsg(res.message ?? 'No se pudo quitar la cobertura.');
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!baja) return null;

  const isMarcada = Boolean(baja.cubierta_manual);

  const footerActions = (
    <div className="cubrir-vacante-modal__footer">
      {isMarcada && onClear && (
        <button
          type="button"
          className="btn-secondary cubrir-vacante-modal__btn-clear"
          onClick={handleClear}
          disabled={submitting}
        >
          <Trash2 size={14} aria-hidden="true" />
          <span>Quitar cobertura</span>
        </button>
      )}
      <button
        type="button"
        className="btn-secondary"
        onClick={onClose}
        disabled={submitting}
      >
        Cancelar
      </button>
      <AnimatedSubmitButton
        isSubmitting={submitting}
        isSuccess={isSuccess}
        idleText={isMarcada ? 'Actualizar' : 'Marcar cubierta'}
        loadingText="Guardando..."
        successText="¡Guardado!"
        idleIcon={CheckCircleIconData}
        className="btn-primary"
        form="cubrir-vacante-form"
      />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="cubrir-vacante-modal"
      size="sm"
      icon={
        <CircleCheckBig
          size={20}
          className="cubrir-vacante-modal__icon"
          aria-hidden="true"
        />
      }
      title={isMarcada ? 'Editar cobertura de vacante' : 'Marcar vacante como cubierta'}
      footerActions={footerActions}
    >
      <form
        id="cubrir-vacante-form"
        onSubmit={handleSubmit}
        className="cubrir-vacante-modal__form"
        noValidate
      >
        {/* Contexto limpio de la baja */}
        <div className="cubrir-vacante-modal__context">
          <div className="cubrir-vacante-modal__context-top">
            <span className="cubrir-vacante-modal__puesto">{baja.puesto}</span>
            <span className="cubrir-vacante-modal__empleado-num">
              #{baja.num_empleado}
            </span>
          </div>
          <div className="cubrir-vacante-modal__context-details">
            <span>{baja.nombre}</span>
            <span className="cubrir-vacante-modal__dot" aria-hidden="true">·</span>
            <span>{baja.area}{baja.seccion ? ` · ${baja.seccion}` : ''}</span>
            <span className="cubrir-vacante-modal__dot" aria-hidden="true">·</span>
            <span className="cubrir-vacante-modal__baja-date">
              Baja: {formatReadableDate(baja.fecha_baja)}
            </span>
          </div>
        </div>

        {/* Campo Fecha */}
        <div className="cubrir-vacante-modal__field">
          <label htmlFor="cubierta-fecha" className="cubrir-vacante-modal__label">
            Fecha en que se cubrió <span aria-hidden="true">*</span>
          </label>
          <input
            id="cubierta-fecha"
            type="date"
            className="cubrir-vacante-modal__input"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            min={baja.fecha_baja || undefined}
            required
            aria-describedby={errorMsg ? errorId : undefined}
            aria-invalid={errorMsg ? true : undefined}
          />
        </div>

        {/* Campo Nota */}
        <div className="cubrir-vacante-modal__field">
          <label htmlFor="cubierta-nota" className="cubrir-vacante-modal__label">
            Nota <span className="cubrir-vacante-modal__optional">(opcional)</span>
          </label>
          <input
            id="cubierta-nota"
            type="text"
            className="cubrir-vacante-modal__input"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. Promoción interna, transferencia de almacén…"
            maxLength={240}
          />
        </div>

        {/* Alerta de error accesible */}
        {errorMsg && (
          <div id={errorId} className="cubrir-vacante-modal__error" role="alert">
            <CircleAlert size={14} aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}
