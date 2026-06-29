import { useState, useRef } from 'react';
import { MapPin, Bus, Users, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRutas, RutaAgrupada } from '@/hooks/useRutas';
import { RutaEmployeesModal } from '@/components/ui/RutaEmployeesModal';
import './Rutas.css';

/* ─────────────────────────────────────────
   Subcomponents
───────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="ruta-skeleton" aria-hidden="true">
      <div className="ruta-skeleton__icon skeleton-pulse" />
      <div className="ruta-skeleton__lines">
        <div className="ruta-skeleton__line ruta-skeleton__line--title skeleton-pulse" />
        <div className="ruta-skeleton__line ruta-skeleton__line--sub skeleton-pulse" />
      </div>
    </div>
  );
}

interface RutaCardProps {
  ruta: RutaAgrupada;
  isActive: boolean;
  onClick: () => void;
}

function RutaCard({ ruta, isActive, onClick }: RutaCardProps) {
  return (
    <button
      type="button"
      className={`ruta-card${isActive ? ' ruta-card--active' : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className="ruta-card__icon" aria-hidden="true">
        <Bus size={18} />
      </span>
      <div className="ruta-card__content">
        <h3 className="ruta-card__title type-heading-sm">{ruta.nombreRuta.split('-')[0].trim()}</h3>
        <span className="ruta-card__subtitle">
          {ruta.paradas.length} parada{ruta.paradas.length === 1 ? '' : 's'} · {ruta.totalEmpleados} pasajero{ruta.totalEmpleados === 1 ? '' : 's'}
        </span>
      </div>
      <ChevronRight size={18} aria-hidden="true" className="ruta-card__chevron" />
    </button>
  );
}

/* ─── Animated route SVG ─── */
interface RouteSvgProps {
  paradas: string[];
  animKey: number;
}

function RouteSvg({ paradas, animKey }: RouteSvgProps) {
  const count = Math.min(paradas.length, 6);
  const width = 480;
  const height = 80;
  const margin = 40;
  const step = count > 1 ? (width - margin * 2) / (count - 1) : 0;

  const points = Array.from({ length: count }, (_, i) => ({
    x: margin + i * step,
    y: height / 2 + (i % 2 === 0 ? -10 : 10),
    label: paradas[i],
  }));

  const pathD =
    count > 1
      ? `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
      : `M ${margin} ${height / 2} L ${width - margin} ${height / 2}`;

  const approxLen = count > 1 ? (width - margin * 2) * 1.1 : width - margin * 2;

  return (
    <svg
      key={animKey}
      className="route-svg"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={pathD}
        stroke="var(--color-route-track)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="route-svg__line"
        d={pathD}
        stroke="var(--color-route-line)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: approxLen, strokeDashoffset: approxLen } as React.CSSProperties}
      />
      {points.map((p, i) => (
        <g
          key={i}
          className="route-svg__stop"
          style={{ '--stop-delay': `${0.15 + i * 0.18}s` } as React.CSSProperties}
        >
          <circle
            cx={p.x}
            cy={p.y}
            r={i === 0 || i === count - 1 ? 7 : 5}
            fill={i === 0 || i === count - 1 ? 'var(--color-route-line)' : 'var(--color-route-stop)'}
            stroke="var(--color-route-line)"
            strokeWidth="1.5"
          />
        </g>
      ))}
    </svg>
  );
}

/* ─── Animated shift bars ─── */
interface ShiftBarsProps {
  turnosCount: Record<string, number>;
  maxCapacityPerShift: Record<string, number>;
  animKey: number;
}

function ShiftBars({ turnosCount, maxCapacityPerShift, animKey }: ShiftBarsProps) {
  const entries = Object.entries(turnosCount)
    .filter(([turno]) => turno !== '4')
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="shift-bars" key={animKey}>
      {entries.map(([turno, count], i) => {
        const assignedCapacity = maxCapacityPerShift[turno];
        const barMax = assignedCapacity || Math.max(count, 21);
        const pct = barMax > 0 ? Math.round((count / barMax) * 100) : 0;
        const isOverCapacity = count > barMax;

        return (
          <div
            key={turno}
            className={`shift-bars__row${isOverCapacity ? ' shift-bars__row--over' : ''}`}
            style={{ '--bar-delay': `${i * 0.08}s`, '--bar-pct': `${Math.min(pct, 100)}%` } as React.CSSProperties}
          >
            <span className="shift-bars__label type-body-sm">Turno {turno}</span>
            <div
              className="shift-bars__track"
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={barMax}
              aria-label={`Turno ${turno}`}
            >
              <div className="shift-bars__fill" />
            </div>
            <span
              className={`shift-bars__count type-body-sm${isOverCapacity ? ' shift-bars__count--over' : ''}`}
            >
              {assignedCapacity ? `${count} / ${assignedCapacity}` : count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Animated daily capacity bars ─── */
interface DailyCapacityBarsProps {
  capacityPerDay: Record<string, number>;
  animKey: number;
}

function DailyCapacityBars({ capacityPerDay, animKey }: DailyCapacityBarsProps) {
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const RESTING_SHIFTS: Record<string, string> = {
    Lunes:     'T2',
    Martes:    'T2',
    Miércoles: 'T3',
    Jueves:    'T3',
    Viernes:   'T4',
    Sábado:    'T4',
    Domingo:   'T1',
  };

  return (
    <div className="daily-capacity-list" key={`daily-${animKey}`}>
      <div className="daily-capacity-list__header">
        <span>Día</span>
        <div className="daily-capacity-list__header-cols">
          <span className="daily-capacity-list__header-col">Pasajeros</span>
          <span className="daily-capacity-list__header-col">Descansa</span>
        </div>
      </div>
      <div className="daily-capacity-list__rows">
        {DAYS_ORDER.map((day) => {
          const count = capacityPerDay[day] || 0;
          return (
            <div key={day} className="daily-capacity-list__row">
              <span className="daily-capacity-list__day">{day}</span>
              <div className="daily-capacity-list__cols">
                <span className="daily-capacity-list__count">{count}</span>
                <div className="daily-capacity-list__rest">
                  <span
                    className="daily-capacity-list__rest-badge"
                    title={`Descansa el Turno ${RESTING_SHIFTS[day].replace('T', '')}`}
                  >
                    {RESTING_SHIFTS[day]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Placeholder ─── */
function Placeholder() {
  return (
    <div className="rutas-placeholder">
      <div className="rutas-placeholder__animation" aria-hidden="true">
        <div className="mockup-path" />
        <div className="mockup-stop mockup-stop--start" />
        <div className="mockup-stop mockup-stop--end" />
        <div className="mockup-bus">
          <Bus size={18} />
        </div>
      </div>
      <h2 className="type-heading-md">Selecciona una ruta</h2>
      <p className="type-body-sm">Haz clic en cualquier tarjeta para ver sus detalles.</p>
    </div>
  );
}

/* ─── Detail panel ─── */
interface RutaDetailProps {
  ruta: RutaAgrupada;
  animKey: number;
  onOpenEmployeesModal: () => void;
}

function RutaDetail({ ruta, animKey, onOpenEmployeesModal }: RutaDetailProps) {
  return (
    <div className="ruta-detail ruta-detail--enter" key={animKey}>
      <div className="ruta-detail__body">
        {/* Route simulation */}
        <section className="ruta-section">
          <h3 className="ruta-section__title type-heading-sm">
            <MapPin size={16} aria-hidden="true" />
            {ruta.nombreRuta}
          </h3>
          <RouteSvg paradas={ruta.paradas} animKey={animKey} />
          <div className="ruta-stops">
            <p className="ruta-stops__heading type-caption-up">
              Paradas registradas ({ruta.paradas.length})
            </p>
            <ul className="ruta-stops__list">
              {ruta.paradas.map((parada, i) => (
                <li
                  key={i}
                  className="ruta-stops__item type-body-sm"
                  style={{ '--item-delay': `${0.05 + i * 0.06}s` } as React.CSSProperties}
                >
                  <span className="ruta-stops__dot" aria-hidden="true" />
                  {parada}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Dual column grids */}
        <div className="ruta-detail__grids">
          <section className="ruta-section">
            <h3 className="ruta-section__title ruta-section__title-wrapper type-heading-sm">
              <Users size={16} aria-hidden="true" className="ruta-section__title-icon" />
              Desglose por turno
              <button
                type="button"
                className="btn-secondary ruta-section__title-btn"
                onClick={onOpenEmployeesModal}
                title="Ver plantilla"
                aria-label="Ver plantilla"
              >
                <Users size={16} aria-hidden="true" />
              </button>
            </h3>

            <ShiftBars
              turnosCount={ruta.turnosCount}
              maxCapacityPerShift={ruta.maxCapacityPerShift}
              animKey={animKey}
            />
          </section>

          <section className="ruta-section">
            <h3 className="ruta-section__title ruta-section__title-wrapper type-heading-sm">
              <CalendarDays size={16} aria-hidden="true" className="ruta-section__title-icon" />
              Pasajeros por día
            </h3>
            <DailyCapacityBars
              capacityPerDay={ruta.capacityPerDay}
              animKey={animKey}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */

export function Rutas() {
  const { rutas, loading, errorMsg } = useRutas();
  const [selectedRuta, setSelectedRuta] = useState<RutaAgrupada | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  /**
   * mobileView controls which panel is shown on small screens.
   * On desktop both panels are always visible (CSS grid).
   */
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const listRef = useRef<HTMLElement>(null);

  function handleSelect(ruta: RutaAgrupada) {
    setSelectedRuta(ruta);
    setAnimKey((k) => k + 1);
    setMobileView('detail'); // push to detail on mobile
  }

  function handleBack() {
    setMobileView('list');
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('.ruta-card');
    if (!buttons?.length) return;
    const arr = Array.from(buttons);
    const idx = arr.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? arr[idx + 1] : arr[idx - 1];
    next?.focus();
  }

  return (
    <main className="rutas-page container" id="main-content" tabIndex={-1}>
      <header className="rutas-header">
        <h1 className="type-display-lg">Rutas de transporte</h1>
      </header>

      <div className="rutas-layout" data-mobile-view={mobileView}>
        {/* ── Left: route list ── */}
        <section
          ref={listRef}
          className="rutas-list"
          aria-label="Lista de rutas"
          onKeyDown={handleListKeyDown}
        >
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {errorMsg && (
            <div className="rutas-error" role="alert">
              <p className="type-body-strong">Error al cargar datos</p>
              <p className="type-body-sm">{errorMsg}</p>
            </div>
          )}

          {!loading && !errorMsg && rutas.length === 0 && (
            <p className="rutas-empty type-body-sm">
              No se encontraron rutas en el archivo.
            </p>
          )}

          {!loading &&
            !errorMsg &&
            rutas.map((ruta) => (
              <RutaCard
                key={ruta.nombreRuta}
                ruta={ruta}
                isActive={selectedRuta?.nombreRuta === ruta.nombreRuta}
                onClick={() => handleSelect(ruta)}
              />
            ))}
        </section>

        {/* ── Right: detail / placeholder ── */}
        <section className="rutas-detail-pane" aria-live="polite" aria-atomic="false">
          {/* Back button — mobile only, rendered via CSS display */}
          {selectedRuta && (
            <button
              type="button"
              className="rutas-back-btn"
              onClick={handleBack}
              aria-label="Volver a la lista de rutas"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Todas las rutas
            </button>
          )}

          {selectedRuta ? (
            <RutaDetail
              ruta={selectedRuta}
              animKey={animKey}
              onOpenEmployeesModal={() => setIsModalOpen(true)}
            />
          ) : (
            <Placeholder />
          )}
        </section>
      </div>

      <RutaEmployeesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ruta={selectedRuta}
      />
    </main>
  );
}
