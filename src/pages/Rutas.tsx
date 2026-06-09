import { useState, useRef } from 'react';
import { Map as MapIcon, MapPin, Bus, Users } from 'lucide-react';
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
      <div className="ruta-card__icon" aria-hidden="true">
        <MapIcon size={20} />
      </div>
      <div className="ruta-card__content">
        <h3 className="ruta-card__title type-heading-sm">{ruta.nombreRuta}</h3>
        <span className="ruta-card__subtitle type-body-sm">
          {ruta.totalEmpleados} empleados · {ruta.paradas.length} paradas
        </span>
      </div>
      <span className="ruta-card__check" aria-hidden="true">✓</span>
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
        points
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(' ')
      : `M ${margin} ${height / 2} L ${width - margin} ${height / 2}`;

  /* approximate total length for dasharray */
  const approxLen = count > 1 ? (width - margin * 2) * 1.1 : width - margin * 2;

  return (
    <svg
      key={animKey}
      className="route-svg"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* track */}
      <path
        d={pathD}
        stroke="var(--color-route-track)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* animated line */}
      <path
        className="route-svg__line"
        d={pathD}
        stroke="var(--color-route-line)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          {
            strokeDasharray: approxLen,
            strokeDashoffset: approxLen,
          } as React.CSSProperties
        }
      />
      {/* stops */}
      {points.map((p, i) => (
        <g key={i} className="route-svg__stop" style={{ '--stop-delay': `${0.15 + i * 0.18}s` } as React.CSSProperties}>
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
  total: number;
  animKey: number;
}

function ShiftBars({ turnosCount, total, animKey }: ShiftBarsProps) {
  const entries = Object.entries(turnosCount).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="shift-bars" key={animKey}>
      {entries.map(([turno, count], i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div
            key={turno}
            className="shift-bars__row"
            style={{ '--bar-delay': `${i * 0.08}s`, '--bar-pct': `${pct}%` } as React.CSSProperties}
          >
            <span className="shift-bars__label type-body-sm">Turno {turno}</span>
            <div className="shift-bars__track" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={total} aria-label={`Turno ${turno}`}>
              <div className="shift-bars__fill" />
            </div>
            <span className="shift-bars__count type-body-sm">{count}</span>
          </div>
        );
      })}
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
      <header className="ruta-detail__header">
        <h2 className="type-display-lg">{ruta.nombreRuta}</h2>
        <p className="type-body-md">Información activa de la ruta</p>
      </header>

      <div className="ruta-detail__body">
        {/* Route simulation */}
        <section className="ruta-section">
          <h3 className="ruta-section__title type-heading-sm">
            <MapPin size={16} aria-hidden="true" />
            Detalle de la ruta
          </h3>
          <RouteSvg paradas={ruta.paradas} animKey={animKey} />
          <div className="ruta-stops">
            <p className="ruta-stops__heading type-caption-up">
              Paradas registradas ({ruta.paradas.length})
            </p>
            <ul className="ruta-stops__list">
              {ruta.paradas.slice(0, 5).map((parada, i) => (
                <li
                  key={i}
                  className="ruta-stops__item type-body-sm"
                  style={{ '--item-delay': `${0.05 + i * 0.06}s` } as React.CSSProperties}
                >
                  <span className="ruta-stops__dot" aria-hidden="true" />
                  {parada}
                </li>
              ))}
              {ruta.paradas.length > 5 && (
                <li className="ruta-stops__more type-body-sm">
                  + {ruta.paradas.length - 5} paradas más
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* Shift breakdown */}
        <section className="ruta-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 className="ruta-section__title type-heading-sm" style={{ marginBottom: 0 }}>
              <Users size={16} aria-hidden="true" />
              Desglose por turno
            </h3>
            <button type="button" className="btn-secondary" onClick={onOpenEmployeesModal} style={{ height: '32px', padding: '0 12px', fontSize: '13px' }}>
              Ver plantilla
            </button>
          </div>
          <div className="ruta-capacity">
            <span className="ruta-capacity__label type-body-sm">Capacidad total requerida</span>
            <span className="ruta-capacity__value type-heading-md">{ruta.totalEmpleados} asientos</span>
          </div>
          <ShiftBars
            turnosCount={ruta.turnosCount}
            total={ruta.totalEmpleados}
            animKey={animKey}
          />
        </section>
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
  const listRef = useRef<HTMLElement>(null);

  /* bump animKey on each new selection to re-trigger CSS animations */
  function handleSelect(ruta: RutaAgrupada) {
    setSelectedRuta(ruta);
    setAnimKey((k) => k + 1);
  }

  /* keyboard navigation: up/down arrows between cards */
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
        <p className="type-body-md">
          Visualiza el detalle de cada ruta de transporte de personal.
        </p>
      </header>

      <div className="rutas-layout">
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
          {selectedRuta ? (
            <RutaDetail ruta={selectedRuta} animKey={animKey} onOpenEmployeesModal={() => setIsModalOpen(true)} />
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
