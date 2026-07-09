import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Trash2, CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import { AnimatedSubmitButton } from '@/components/ui/AnimatedSubmitButton';
import type { Baja } from '@/lib/types';
import { localTodayIso } from '@/lib/dates';
import './IncapacidadModal.css';

interface CubrirVacanteSheetProps {
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

export function CubrirVacanteSheet({
  isOpen,
  baja,
  onClose,
  onSave,
  onClear,
}: CubrirVacanteSheetProps) {
  const [fecha, setFecha] = useState<string>('');
  const [nota, setNota] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setErrorMsg('La fecha es requerida.');
      return;
    }
    try {
      setSubmitting(true);
      
      // Retraso artificial para que se note la animación de pensando
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const res = await onSave(baja.num_empleado, fecha, nota.trim() || null);
      if (!res.ok) {
        setErrorMsg(res.message ?? 'No se pudo guardar.');
        setSubmitting(false);
        return;
      }
      setIsSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setErrorMsg('Error inesperado.');
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
        setErrorMsg(res.message ?? 'No se pudo quitar la marca.');
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
    <>
      {isMarcada && onClear && (
        <button
          type="button"
          className="btn-secondary"
          onClick={handleClear}
          disabled={submitting}
        >
          <Trash2 size={14} aria-hidden="true" />
          <span>Quitar cobertura</span>
        </button>
      )}
      <AnimatedSubmitButton
        isSubmitting={submitting}
        isSuccess={isSuccess}
        idleText={isMarcada ? 'Actualizar' : 'Marcar cubierta'}
        loadingText="Guardando..."
        successText="¡Guardado!"
        idleIcon={CheckCircle}
        className="btn-primary"
        form="cubrir-vacante-form"
      />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="cubrir-vacante-sheet"
      icon={
        <CheckCircle2
          size={20}
          className="incapacidad-modal__icon"
          aria-hidden="true"
        />
      }
      title={isMarcada ? 'Cobertura de vacante' : 'Marcar vacante como cubierta'}
      subtitle={`${baja.nombre} · #${baja.num_empleado}`}
      footerActions={footerActions}
      fullscreenMobile={false}
    >
      <form id="cubrir-vacante-form" onSubmit={handleSubmit} className="cubrir-vacante-sheet__form" noValidate>
        <div className="incapacidad-modal__meta">
          <span>
            <strong>{baja.puesto}</strong>
          </span>
          <span className="incapacidad-modal__meta-sub">
            {baja.area} · {baja.seccion} · baja: {baja.fecha_baja}
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="cubierta-fecha">Fecha en que se cubrió</label>
          <input
            id="cubierta-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            min={baja.fecha_baja || undefined}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cubierta-nota">
            Nota <span className="incapacidad-modal__optional">(opcional)</span>
          </label>
          <input
            id="cubierta-nota"
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. Promoción interna, transferencia de almacén…"
            maxLength={240}
          />
        </div>

        {errorMsg && (
          <div className="incapacidad-modal__error" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {errorMsg}
          </div>
        )}
      </form>
    </Modal>
  );
}
