import { useEffect, useMemo, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { Check, Copy } from 'lucide';
import { MorphingIcon } from './MorphingIcon';
import { Modal } from './Modal';
import { StarliteBadge } from './Badge';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Employee } from '@/lib/types';
import { formatReadableDate, formatShortDate } from '@/lib/dates';
import { toast } from '@/lib/notify';
import { toNaturalCase } from '@/lib/utils';
import {
  buildWhatsAppReport,
  copyTextToClipboard,
  formatWhatsAppLabel,
  formatWhatsAppSection,
  type WhatsAppReportSection,
} from '@/lib/whatsappReport';

import './FutureHiresModal.css';

interface FutureHiresModalProps {
  isOpen: boolean;
  onClose: () => void;
  futureHires: Employee[];
}

interface FutureHireReportRow {
  label: string;
  count: number;
}

function buildFutureHiresMessage(futureHires: Employee[]): string {
  const sectionMap = new Map<string, Map<string, FutureHireReportRow>>();
  const orderedHires = [...futureHires].sort((left, right) => {
    const dateComparison = left.fecha_ingreso.localeCompare(right.fecha_ingreso, 'es');
    if (dateComparison !== 0) return dateComparison;
    return left.area.localeCompare(right.area, 'es');
  });
  const scheduledDates = Array.from(
    new Set(orderedHires.map((employee) => formatReadableDate(employee.fecha_ingreso))),
  );
  const hasMultipleDates = scheduledDates.length > 1;

  for (const employee of orderedHires) {
    const baseSectionTitle = employee.is_starlite
      ? 'Starlite'
      : toNaturalCase(employee.area || 'Sin área');
    const date = formatReadableDate(employee.fecha_ingreso);
    const sectionTitle = hasMultipleDates
      ? `${date} · ${baseSectionTitle}`
      : baseSectionTitle;
    let position = formatWhatsAppLabel(employee.puesto || 'Sin puesto');
    if (
      employee.is_starlite &&
      position.toLocaleLowerCase('es-MX').includes('operador de máquina')
    ) {
      position = 'Operador de Starlite';
    }
    const department = formatWhatsAppSection(employee.seccion, employee.area);
    const label = [position, department].filter(Boolean).join(' · ');
    const key = label;
    const items = sectionMap.get(sectionTitle) ?? new Map();
    const current = items.get(key);
    items.set(key, {
      label,
      count: (current?.count ?? 0) + 1,
    });
    sectionMap.set(sectionTitle, items);
  }

  const sectionEntries = Array.from(sectionMap.entries());
  if (!hasMultipleDates) {
    sectionEntries.sort(([left], [right]) => left.localeCompare(right, 'es'));
  }

  const sections: WhatsAppReportSection[] = sectionEntries
    .map(([title, items]) => ({
      title,
      items: Array.from(items.values())
        .sort((left, right) => left.label.localeCompare(right.label, 'es'))
        .map((item) => ({
          label: item.label,
          value: String(item.count),
        })),
    }));

  return buildWhatsAppReport({
    title: 'Próximos ingresos',
    date: scheduledDates.length === 1 ? scheduledDates[0] : 'Fechas programadas',
    total: futureHires.length,
    sections,
    emptyMessage: 'Sin ingresos programados.',
  });
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

  const message = useMemo(
    () => buildFutureHiresMessage(sortedFutureHires),
    [sortedFutureHires],
  );

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(message);
      setCopied(true);
    } catch {
      toast.error({ title: 'No se pudo copiar el reporte' });
    }
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
      footerActions={
        <button
          type="button"
          className="btn-primary future-hires-modal__action"
          onClick={handleCopy}
          disabled={futureHires.length === 0}
        >
          <span
            className="future-hires-modal__action-inner"
            aria-live="polite"
            aria-atomic="true"
          >
            <MorphingIcon icon={copied ? Check : Copy} size={16} />
            {copied ? 'Reporte copiado' : 'Copiar reporte'}
          </span>
        </button>
      }
    >
      <div className="modal-body future-hires-modal">
        {futureHires.length > 0 ? (
          <>
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
