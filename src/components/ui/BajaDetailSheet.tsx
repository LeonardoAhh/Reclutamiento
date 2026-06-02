import { AlertCircle, CheckCircle2, FileText, ClipboardList } from 'lucide-react';
import { Sheet } from './Sheet';
import { Badge } from './Badge';
import type { BajaWithCobertura } from '@/lib/bajas';
import { formatShortDate } from '@/lib/dates';
import './BajaDetailSheet.css';

/**
 * Badge de estado de cobertura de una baja. Centraliza la lógica que antes
 * vivía inline en la tabla de `Bajas`, para reutilizarla en la tabla compacta
 * y en el detalle.
 */
export function BajaCoberturaBadge({ baja }: { baja: BajaWithCobertura }) {
  if (baja.soloInduccion) {
    return (
      <Badge variant="default">
        <AlertCircle size={11} aria-hidden="true" /> Solo Inducción
      </Badge>
    );
  }
  if (baja.cubiertaPor === 'manual') {
    return (
      <span title={baja.cubierta_nota ?? undefined}>
        <Badge variant="success">
          <CheckCircle2 size={11} aria-hidden="true" /> Cubierta
          {baja.coberturaDias != null ? ` · ${baja.coberturaDias}d` : ''}
        </Badge>
      </span>
    );
  }
  if (baja.cubiertaEn10d) {
    return <Badge variant="success">≤10d · {baja.coberturaDias}d</Badge>;
  }
  if (baja.coberturaDias !== null) {
    return <Badge variant="amber">{baja.coberturaDias}d</Badge>;
  }
  return <Badge variant="error">No cubierta</Badge>;
}

interface BajaDetailSheetProps {
  isOpen: boolean;
  baja: BajaWithCobertura | null;
  /** Código VAC-NN asociado a esta baja (si existe). */
  requisicionCode?: string | null;
  onClose: () => void;
  /** Abrir el flujo de "marcar cubierta" para esta baja. */
  onCubrir: (baja: BajaWithCobertura) => void;
  /** Abrir el flujo de requisición para esta baja. */
  onRequisicion: (baja: BajaWithCobertura) => void;
}

/**
 * Detalle de una baja en panel lateral (patrón master-detail). La tabla de
 * `Bajas` queda compacta (3 columnas) y todo el detalle vive aquí, junto con
 * las acciones de cobertura / requisición.
 */
export function BajaDetailSheet({
  isOpen,
  baja,
  requisicionCode,
  onClose,
  onCubrir,
  onRequisicion,
}: BajaDetailSheetProps) {
  if (!baja) return null;

  const quienCubre = baja.coberturaEmpleado
    ? `${baja.coberturaEmpleado.nombre} · #${baja.coberturaEmpleado.num_empleado}`
    : baja.cubiertaPor === 'manual' && baja.cubierta_nota
      ? `${baja.cubierta_nota} · Manual`
      : null;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      className="baja-detail-sheet"
      side="right"
      width="sm"
      icon={<ClipboardList size={20} aria-hidden="true" />}
      title={baja.nombre}
      subtitle={`#${baja.num_empleado} · ${baja.puesto}`}
    >
      <div className="sheet__body baja-detail-sheet__body">
        <dl className="baja-detail-sheet__list">
          <div className="baja-detail-sheet__field">
            <dt>Área · Sección</dt>
            <dd>{baja.area} · {baja.seccion}</dd>
          </div>
          <div className="baja-detail-sheet__field">
            <dt>Fecha de baja</dt>
            <dd>{formatShortDate(baja.fecha_baja)}</dd>
          </div>
          <div className="baja-detail-sheet__field">
            <dt>Tipo / Motivo</dt>
            <dd>
              <span className="baja-detail-sheet__tipo">{baja.tipo_baja || '—'}</span>
              <span className="baja-detail-sheet__motivo">{baja.motivo_baja || '—'}</span>
            </dd>
          </div>
          <div className="baja-detail-sheet__field">
            <dt>Cobertura</dt>
            <dd><BajaCoberturaBadge baja={baja} /></dd>
          </div>
          {!baja.soloInduccion && (
            <div className="baja-detail-sheet__field">
              <dt>Cubre vacante</dt>
              <dd>{quienCubre ?? <span className="baja-detail-sheet__muted">—</span>}</dd>
            </div>
          )}
          {requisicionCode && (
            <div className="baja-detail-sheet__field">
              <dt>Requisición</dt>
              <dd>{requisicionCode}</dd>
            </div>
          )}
        </dl>
      </div>

      <footer className="sheet__footer baja-detail-sheet__footer">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cerrar
        </button>
        {!baja.soloInduccion && (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onRequisicion(baja)}
            >
              <FileText size={14} aria-hidden="true" />
              {requisicionCode ?? 'Requisición'}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onCubrir(baja)}
            >
              <CheckCircle2 size={14} aria-hidden="true" />
              {baja.cubierta_manual ? 'Editar cobertura' : 'Marcar cubierta'}
            </button>
          </>
        )}
      </footer>
    </Sheet>
  );
}
