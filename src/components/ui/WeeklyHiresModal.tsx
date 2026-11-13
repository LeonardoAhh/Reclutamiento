import { useMemo } from 'react';
import { Modal } from './Modal';
import { FormSheet } from './FormSheet';
import { ExpandableSection } from './ExpandableSection';
import { StarliteBadge } from './Badge';
import { CountRow } from './CountRow';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Baja, Employee } from '@/lib/types';
import { formatShortDate, type IsoWeekRange } from '@/lib/dates';
import { groupMovements } from '@/lib/movementGroups';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';

import './WeeklyHiresModal.css';

interface WeeklyHiresModalProps {
  isOpen: boolean;
  onClose: () => void;
  range: IsoWeekRange;
  rangeLabel: string;
  hires: Employee[];
  bajas: Baja[];
  previousRange: IsoWeekRange;
  previousRangeLabel: string;
  previousHires: Employee[];
  previousBajas: Baja[];
}

interface DeltaProps {
  current: number;
  previous: number;
  invert?: boolean;
}

function Delta({ current, previous, invert = false }: DeltaProps) {
  const diff = current - previous;
  if (diff === 0) {
    return <span className="weekly-hires-modal__delta weekly-hires-modal__delta--neutral">= 0</span>;
  }
  const positive = invert ? diff < 0 : diff > 0;
  const cls = positive ? 'weekly-hires-modal__delta--up' : 'weekly-hires-modal__delta--down';
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={`weekly-hires-modal__delta ${cls}`}>
      {sign}
      {diff}
    </span>
  );
}

interface WeekBlockProps {
  week: number;
  hires: Employee[];
  bajas: Baja[];
  /** Semana con la que comparar; sin ella el bloque no muestra variación. */
  previousHires?: Employee[];
  previousBajas?: Baja[];
  locale: string;
  language: Language;
}

/**
 * Una semana: sus dos cifras y, debajo, qué plazas la componen. Los ingresos y
 * las bajas van agrupados por puesto y fecha, así que la lista ya es el
 * resumen; antes convivían un recuento por puesto y un detalle fila por
 * persona que decían lo mismo.
 */
function WeekBlock({
  week,
  hires,
  bajas,
  previousHires,
  previousBajas,
  locale,
  language,
}: WeekBlockProps) {
  const t = (text: string) => workforceText(language, text);
  const noPosition = workforceText(language, 'Sin puesto');

  const hireGroups = useMemo(
    () =>
      groupMovements(
        hires.map((employee) => ({
          puesto: employee.puesto,
          dateIso: employee.fecha_ingreso,
          isStarlite: employee.is_starlite,
        })),
        noPosition,
      ),
    [hires, noPosition],
  );

  const bajaGroups = useMemo(
    () =>
      groupMovements(
        bajas.map((baja) => ({ puesto: baja.puesto, dateIso: baja.fecha_baja })),
        noPosition,
      ),
    [bajas, noPosition],
  );

  const unit = (count: number) => t(count === 1 ? 'persona' : 'personas');

  return (
    <ExpandableSection title={`${t('Semana')} ${week}`}>
      <div className="weekly-hires-modal__week-content">
        <div className="weekly-hires-modal__week-stats">
          <div className="weekly-hires-modal__week-stat">
            <span className="weekly-hires-modal__week-stat-label">{t('Ingresos')}</span>
            <span className="weekly-hires-modal__week-stat-value">
              {hires.length}
              {previousHires && <Delta current={hires.length} previous={previousHires.length} />}
            </span>
          </div>
          <div className="weekly-hires-modal__week-stat">
            <span className="weekly-hires-modal__week-stat-label">{t('Bajas')}</span>
            <span className="weekly-hires-modal__week-stat-value weekly-hires-modal__week-stat-value--bajas">
              {bajas.length}
              {previousBajas && (
                <Delta current={bajas.length} previous={previousBajas.length} invert />
              )}
            </span>
          </div>
        </div>

        {hireGroups.length > 0 && (
          <section className="weekly-hires-modal__group">
            <h5 className="weekly-hires-modal__group-title">{t('Ingresos')}</h5>
            <ul className="count-row-list">
              {hireGroups.map((group) => (
                <CountRow
                  key={group.key}
                  title={group.puesto}
                  badge={group.isStarlite ? <StarliteBadge compact /> : undefined}
                  meta={formatShortDate(group.dateIso, locale)}
                  count={group.count}
                  unit={unit(group.count)}
                />
              ))}
            </ul>
          </section>
        )}

        {bajaGroups.length > 0 && (
          <section className="weekly-hires-modal__group">
            <h5 className="weekly-hires-modal__group-title">{t('Bajas')}</h5>
            <ul className="count-row-list">
              {bajaGroups.map((group) => (
                <CountRow
                  key={group.key}
                  title={group.puesto}
                  meta={formatShortDate(group.dateIso, locale)}
                  count={group.count}
                  unit={unit(group.count)}
                  tone="negative"
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </ExpandableSection>
  );
}

export function WeeklyHiresModal({
  isOpen,
  onClose,
  range,
  hires,
  bajas,
  previousRange,
  previousHires,
  previousBajas,
}: WeeklyHiresModalProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  const t = (text: string) => workforceText(language, text);
  const locale = en ? 'en-US' : 'es-MX';
  const isMobile = useIsMobile();
  const Dialog = isMobile ? Modal : FormSheet;

  const totalHires = hires.length + previousHires.length;
  const totalBajas = bajas.length + previousBajas.length;
  const netMovement = totalHires - totalBajas;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="weekly-hires-modal"
      title={`${t('Ingresos')} · ${t('Semanas')} ${previousRange.week} ${en ? 'and' : 'y'} ${range.week}`}
      size="sm"
    >
      <div className="modal-body weekly-hires-modal__body">
        <header className="weekly-hires-modal__summary">
          <div className="weekly-hires-modal__stat">
            <div className="weekly-hires-modal__big-number">{totalHires}</div>
            <p className="weekly-hires-modal__big-label">{t(totalHires === 1 ? 'Ingreso' : 'Ingresos')}</p>
          </div>
          <div className="weekly-hires-modal__stat">
            <div className="weekly-hires-modal__big-number weekly-hires-modal__big-number--bajas">{totalBajas}</div>
            <p className="weekly-hires-modal__big-label">{t(totalBajas === 1 ? 'Baja' : 'Bajas')}</p>
          </div>
          <div className="weekly-hires-modal__stat">
            <div
              className={`weekly-hires-modal__big-number ${netMovement >= 0 ? 'weekly-hires-modal__big-number--positive' : 'weekly-hires-modal__big-number--negative'}`}
            >
              {netMovement > 0 ? '+' : ''}
              {netMovement}
            </div>
            <p className="weekly-hires-modal__big-label">{t('Balance neto')}</p>
          </div>
        </header>

        <div className="weekly-hires-modal__weeks-grid">
          <WeekBlock
            week={range.week}
            hires={hires}
            bajas={bajas}
            previousHires={previousHires}
            previousBajas={previousBajas}
            locale={locale}
            language={language}
          />
          <WeekBlock
            week={previousRange.week}
            hires={previousHires}
            bajas={previousBajas}
            locale={locale}
            language={language}
          />
        </div>
      </div>
    </Dialog>
  );
}
