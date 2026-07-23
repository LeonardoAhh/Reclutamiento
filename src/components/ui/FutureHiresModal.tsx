import { useMemo } from 'react';
import { Copy, Users } from 'lucide-react';
import { Modal } from './Modal';
import { StarliteBadge } from './StarliteBadge';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Employee } from '@/lib/types';
import { formatShortDate } from '@/lib/dates';
import { splitCandidateName } from '@/lib/names';
import './FutureHiresModal.css';

interface FutureHiresModalProps {
  isOpen: boolean;
  onClose: () => void;
  futureHires: Employee[];
}

export function FutureHiresModal({
  isOpen,
  onClose,
  futureHires,
}: FutureHiresModalProps) {
  const isMobile = useIsMobile();

  const sortedFutureHires = useMemo(() => {
    return [...futureHires].sort((a, b) => {
      const cmpArea = (a.area || '').localeCompare(b.area || '');
      if (cmpArea !== 0) return cmpArea;
      return (a.seccion || '').localeCompare(b.seccion || '');
    });
  }, [futureHires]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const map = new Map<string, number>();
    for (const emp of sortedFutureHires) {
      const starliteTag = emp.is_starlite ? ' ★ Starlite' : '';
      let turno = 'General';
      if (emp.seccion) {
        const match = emp.seccion.match(/\b(?:1ER|1RA|2DO|2DA|3ER|3RA|4TO|4TA|[1-9]O|[1-9]A|NOCTURNO|DIURNO|MATUTINO|VESPERTINO)\.?\s*TURNO\b/i);
        if (match) turno = match[0].toUpperCase().replace(/\s+/g, ' ').trim();
      }
      const key = `${emp.area || 'Sin área'} - ${turno} - ${emp.puesto}${starliteTag}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    const text = Array.from(map.entries()).map(([k, v]) => `${k}: ${v}`).join('\n');
    navigator.clipboard.writeText(`Próximos ingresos programados:\n\n${text}`);
  };

  const renderHiresTable = (hiresToRender: Employee[]) => (
    <div className="future-hires-modal__section">
      {isMobile ? (
        <div className="future-hires-modal__mobile-list">
          {hiresToRender.map((e) => {
            const { apellidos, nombres } = splitCandidateName(e.nombre);
            return (
              <div key={e.num_empleado} className="future-hires-modal__mobile-card">
                <div className="future-hires-modal__mobile-card-header">
                  <span className="future-hires-modal__mobile-name">
                    <span className="future-hires-modal__mobile-apellidos">{apellidos.toUpperCase()}</span>
                    {nombres && <span className="future-hires-modal__mobile-nombres">{nombres.toUpperCase()}</span>}
                    {e.is_starlite && <StarliteBadge compact />}
                  </span>
                  <span className="future-hires-modal__mobile-date">{formatShortDate(e.fecha_ingreso)}</span>
                </div>
                <div className="future-hires-modal__mobile-card-body">
                  <div className="future-hires-modal__mobile-puesto">{e.puesto}</div>
                  <div className="future-hires-modal__mobile-area">
                    {e.area} {e.seccion ? `· ${e.seccion}` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="future-hires-modal__table-wrap">
          <table className="future-hires-modal__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Área · Sección</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {hiresToRender.map((e) => (
                <tr key={e.num_empleado}>
                  <td className="future-hires-modal__cell-mono">
                    {e.num_empleado}
                  </td>
                  <td>
                    <div className="future-hires-modal__cell-name">
                      <span className="future-hires-modal__name-text">{e.nombre}</span>
                      {e.is_starlite && <StarliteBadge compact />}
                    </div>
                  </td>
                  <td>{e.puesto}</td>
                  <td>
                    <div className="future-hires-modal__cell-area">
                      {e.area}
                    </div>
                    <div className="future-hires-modal__cell-seccion">
                      {e.seccion}
                    </div>
                  </td>
                  <td className="future-hires-modal__cell-mono">
                    {formatShortDate(e.fecha_ingreso)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Próximos ingresos programados"
      icon={<Users size={20} />}
      size={isMobile ? 'md' : 'xl'}
      fullscreenMobile={true}
    >
      <div className="modal-body future-hires-modal">
        {futureHires.length > 0 ? (
          <>
            <div className="future-hires-modal__header-actions">
              <p className="future-hires-modal__hint">
                Procesos cerrados con caratula y fecha de ingreso programada.
              </p>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleCopy}
                title="Copiar resumen"
              >
                <Copy size={16} aria-hidden="true" />
              </button>
            </div>
            {renderHiresTable(sortedFutureHires)}
          </>
        ) : (
          <div className="future-hires-modal__empty">
            No hay próximos ingresos programados en este momento.
          </div>
        )}
      </div>
    </Modal>
  );
}
