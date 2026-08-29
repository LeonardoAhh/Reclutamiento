import { useMemo, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { Check, Copy } from 'lucide';
import { MorphingIcon } from './MorphingIcon';
import { Modal } from './Modal';
import { Tooltip } from './Tooltip';
import { StarliteBadge } from './Badge';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Employee } from '@/lib/types';
import { formatShortDate } from '@/lib/dates';

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
  const [copied, setCopied] = useState(false);

  const sortedFutureHires = useMemo(() => {
    return [...futureHires].sort((a, b) => {
      const cmpPuesto = (a.puesto || '').localeCompare(b.puesto || '');
      if (cmpPuesto !== 0) return cmpPuesto;
      return (a.seccion || '').localeCompare(b.seccion || '');
    });
  }, [futureHires]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();

    const capitalizeTitle = (str: string) => {
      if (!str) return '';
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const rolesCount: Record<string, number> = {};

    for (const emp of sortedFutureHires) {
      const puesto = emp.is_starlite ? 'Starlite' : capitalizeTitle(emp.puesto || '');
      const seccion = emp.seccion ? capitalizeTitle(emp.seccion) : '';
      const key = seccion ? `${puesto} - ${seccion}` : puesto;
      rolesCount[key] = (rolesCount[key] || 0) + 1;
    }

    const fecha = sortedFutureHires.length > 0 ? formatShortDate(sortedFutureHires[0].fecha_ingreso) : '';
    const textParts = [`Próximos Ingresos: ${fecha}`];

    textParts.push('');
    for (const [roleKey, count] of Object.entries(rolesCount)) {
      const plural = count === 1 ? 'Ingreso' : 'Ingresos';
      textParts.push(`${roleKey}: ${count} ${plural}`);
    }

    if (sortedFutureHires.length > 0) {
      textParts.push('');
      textParts.push(`Total: ${sortedFutureHires.length}`);
    }

    navigator.clipboard.writeText(textParts.join('\n'));

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const renderHiresTable = (hiresToRender: Employee[]) => (
    <div className="future-hires-modal__section">
      {isMobile ? (
        <div className="future-hires-modal__mobile-list">
          {hiresToRender.map((e, idx) => (
              <div key={e.num_empleado ?? idx} className="future-hires-modal__mobile-card">
                <div className="future-hires-modal__mobile-card-header">
                  <span className="future-hires-modal__mobile-name">
                    <span className="future-hires-modal__mobile-apellidos">{e.puesto}</span>
                    {e.is_starlite && <StarliteBadge compact />}
                  </span>
                  <span className="future-hires-modal__mobile-date">{formatShortDate(e.fecha_ingreso)}</span>
                </div>
                <div className="future-hires-modal__mobile-card-body">
                  <div className="future-hires-modal__mobile-seccion">
                    {e.seccion || '-'}
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="future-hires-modal__table-wrap">
          <table className="future-hires-modal__table">
            <thead>
              <tr>
                <th>Puesto</th>
                <th>Sección</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {hiresToRender.map((e) => (
                <tr key={e.num_empleado}>
                  <td>
                    <div className="future-hires-modal__cell-name">
                      <span>{e.puesto}</span>
                      {e.is_starlite && <StarliteBadge compact />}
                    </div>
                  </td>
                  <td>
                    <div className="future-hires-modal__cell-seccion">
                      {e.seccion || '-'}
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
      title="Próximos ingresos"
      icon={<UsersRound size={20} />}
      size="md"
      fullscreenMobile={false}
    >
      <div className="modal-body future-hires-modal">
        {futureHires.length > 0 ? (
          <>
            <div className="future-hires-modal__header-actions">
              <p className="future-hires-modal__hint">
                Procesos cerrados con fecha programada.
              </p>
              <Tooltip content={copied ? "Copiado" : "Copiar"}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={handleCopy}
                >
                  <MorphingIcon icon={copied ? Check : Copy} size={16} />
                </button>
              </Tooltip>
            </div>
            {renderHiresTable(sortedFutureHires)}
          </>
        ) : (
          <div className="future-hires-modal__empty">
            No hay ingresos programados.
          </div>
        )}
      </div>
    </Modal>
  );
}
