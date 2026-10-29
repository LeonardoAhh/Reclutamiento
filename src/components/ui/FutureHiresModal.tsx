import { useMemo } from 'react';
import { UsersRound } from 'lucide-react';
import { Copy } from 'lucide-react';
import { Modal } from './Modal';
import { FormSheet } from './FormSheet';
import { StarliteBadge } from './Badge';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Employee } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
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

function buildFutureHiresMessage(futureHires: Employee[], language: 'es' | 'en'): string {
  const t = (text: string) => workforceText(language, text);
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const sectionMap = new Map<string, Map<string, FutureHireReportRow>>();
  const orderedHires = [...futureHires].sort((left, right) => {
    const dateComparison = left.fecha_ingreso.localeCompare(right.fecha_ingreso, 'es');
    if (dateComparison !== 0) return dateComparison;
    return left.area.localeCompare(right.area, 'es');
  });
  const scheduledDates = Array.from(
    new Set(orderedHires.map((employee) => formatReadableDate(employee.fecha_ingreso, locale))),
  );
  const hasMultipleDates = scheduledDates.length > 1;

  for (const employee of orderedHires) {
    const baseSectionTitle = employee.is_starlite
      ? 'Starlite'
      : toNaturalCase(employee.area || t('Sin área'));
    const date = formatReadableDate(employee.fecha_ingreso, locale);
    const sectionTitle = hasMultipleDates
      ? `${date} · ${baseSectionTitle}`
      : baseSectionTitle;
    let position = formatWhatsAppLabel(employee.puesto || t('Sin puesto'));
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
    title: t('Próximos ingresos'),
    date: scheduledDates.length === 1 ? scheduledDates[0] : t('Fechas programadas'),
    total: futureHires.length,
    sections,
    emptyMessage: t('Sin ingresos programados.'),
  });
}

export function FutureHiresModal({
  isOpen,
  onClose,
  futureHires,
}: FutureHiresModalProps) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const locale = language === 'en' ? 'en-US' : 'es-MX';
  const isMobile = useIsMobile();
  const Dialog = isMobile ? Modal : FormSheet;

  const sortedFutureHires = useMemo(() => {
    return [...futureHires].sort((a, b) => {
      const cmpPuesto = (a.puesto || '').localeCompare(b.puesto || '');
      if (cmpPuesto !== 0) return cmpPuesto;
      return (a.seccion || '').localeCompare(b.seccion || '');
    });
  }, [futureHires]);

  const message = useMemo(
    () => buildFutureHiresMessage(sortedFutureHires, language),
    [sortedFutureHires, language],
  );

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(message);
      toast.success({ title: t('Reporte copiado') });
    } catch {
      toast.error({ title: t('No se pudo copiar el reporte') });
    }
  };

  const renderHiresList = (hiresToRender: Employee[]) => (
    <div className="future-hires-modal__section">
      <div className="future-hires-modal__list" role="list">
        {hiresToRender.map((employee) => (
          <article
            key={employee.num_empleado}
            className="future-hires-modal__card"
            role="listitem"
          >
            <h3 className="future-hires-modal__position">
              <span>{employee.puesto}</span>
              {employee.is_starlite && <StarliteBadge compact />}
            </h3>
            <dl className="future-hires-modal__details">
              <div className="future-hires-modal__detail">
                <dt>{t('Turno')}</dt>
                <dd>{employee.turno || '-'}</dd>
              </div>
              <div className="future-hires-modal__detail">
                <dt>{t('Fecha')}</dt>
                <dd>{formatShortDate(employee.fecha_ingreso, locale)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t("Próximos ingresos")}
      icon={<UsersRound size={20} />}
      size="sm"
      footerActions={
        <button
          type="button"
          className="btn-primary future-hires-modal__action"
          onClick={handleCopy}
          disabled={futureHires.length === 0}
        >
          <span className="future-hires-modal__action-inner">
            <Copy size="var(--icon-size-sm)" aria-hidden="true" />
            {t('Copiar reporte')}
          </span>
        </button>
      }
    >
      <div className="modal-body future-hires-modal">
        {futureHires.length > 0 ? renderHiresList(sortedFutureHires) : (
          <div className="future-hires-modal__empty">
            {t('No hay ingresos programados.')}
          </div>
        )}
      </div>
    </Dialog>
  );
}
