import { useState, useRef, useMemo, useEffect } from "react";
import {
  ArrowRightLeft,
  BusFront,
  CalendarRange,
  ChevronLeft,
  Gauge,
  Minus,
  Route,
  TrendingDown,
  TrendingUp,
  UserRoundSearch,
} from "lucide-react";
// NOTE: MorphingIcon espera IconInput de 'morphicons', compatible solo con
// las definiciones crudas del paquete base 'lucide' (no 'lucide-react').
import { UserRoundSearch as SearchData, X as XIconData } from "lucide";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { getShortName } from "@/lib/names";
import { formatReadableDate } from "@/lib/dates";
import {
  useRutas,
  RutaAgrupada,
  type EmpleadoRuta,
} from "@/hooks/useRutas";
import { RutaDayEmployeesModal } from "@/components/ui/RutaDayEmployeesModal";
import { Tooltip } from "@/components/ui/Tooltip";

import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import "./Rutas.css";

interface RutaCardProps {
  ruta: RutaAgrupada;
  isActive: boolean;
  onClick: () => void;
}

function RutaCard({
  ruta,
  isActive,
  onClick,
  matchCount,
}: RutaCardProps & { matchCount?: number }) {
  const [routeCode, ...routeNameParts] = ruta.nombreRuta.split("-");
  const routeName = routeNameParts.join("-").trim();
  const isOverCapacity = Object.entries(ruta.turnosCount).some(
    ([t, c]) => ruta.maxCapacityPerShift[t] && c > ruta.maxCapacityPerShift[t],
  );

  return (
    <button
      type="button"
      className={`ruta-card${isActive ? " ruta-card--active" : ""}${matchCount ? " ruta-card--has-match" : ""}`}
      onClick={onClick}
      aria-pressed={isActive}
      aria-controls="rutas-detail-pane"
    >
      <span className="ruta-card__icon" aria-hidden="true">
        <BusFront />
      </span>
      <span className="ruta-card__copy">
        <span className="ruta-card__title">{routeCode.trim()}</span>
        {routeName && <span className="ruta-card__subtitle">{routeName}</span>}
        {isOverCapacity && (
          <span className="ruta-card__capacity-alert">
            <span className="ruta-card__alert-dot" aria-hidden="true" />
            <span>Sobrecupo</span>
          </span>
        )}
      </span>
      {matchCount !== undefined && matchCount > 0 && (
        <span
          className="ruta-card__match-badge"
          aria-label={`${matchCount} coincidencia${matchCount === 1 ? "" : "s"}`}
        >
          {matchCount}
        </span>
      )}
    </button>
  );
}

/* Shift capacity bars */
interface ShiftBarsProps {
  turnosCount: Record<string, number>;
  turnosCountPrev: Record<string, number>;
  maxCapacityPerShift: Record<string, number>;
  empleados: EmpleadoRuta[];
  empleadosPrev: EmpleadoRuta[];
  hasComparison: boolean;
  animKey: number;
}

function ShiftBars({
  turnosCount,
  turnosCountPrev,
  maxCapacityPerShift,
  empleados = [],
  empleadosPrev = [],
  hasComparison,
  animKey,
}: ShiftBarsProps) {
  const entries = Array.from(
    new Set([...Object.keys(turnosCount), ...Object.keys(turnosCountPrev)]),
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return (
    <div className="shift-bars" key={animKey}>
      {entries.map((turno) => {
        const count = turnosCount[turno] ?? 0;
        const assignedCapacity = maxCapacityPerShift[turno];
        const barMax = assignedCapacity || Math.max(count, 21);
        const pct = barMax > 0 ? Math.round((count / barMax) * 100) : 0;
        const isOverCapacity = count > barMax;

        const currentEmps = empleados.filter((e) => e.turno === turno);
        const prevEmps = empleadosPrev.filter((e) => e.turno === turno);
        const added = currentEmps.filter(
          (curr) =>
            !prevEmps.some(
              (prev) => prev.numeroEmpleado === curr.numeroEmpleado,
            ),
        );
        const removed = prevEmps.filter(
          (prev) =>
            !currentEmps.some(
              (curr) => curr.numeroEmpleado === prev.numeroEmpleado,
            ),
        );
        const netChange = added.length - removed.length;
        const trendAria = added.length > 0 || removed.length > 0
          ? `${added.length} alta${added.length === 1 ? "" : "s"} y ${removed.length} baja${removed.length === 1 ? "" : "s"}`
          : "Sin cambios";
        const trendClass = added.length > 0 && removed.length > 0
          ? "trend-mixed"
          : added.length > 0
            ? "trend-up"
            : removed.length > 0
              ? "trend-down"
              : "trend-flat";

        let iconNode;
        if (added.length > 0 && removed.length > 0) {
          iconNode = netChange > 0 ? <TrendingUp aria-hidden="true" /> :
                     netChange < 0 ? <TrendingDown aria-hidden="true" /> :
                     <ArrowRightLeft aria-hidden="true" />;
        } else if (added.length > 0) {
          iconNode = <TrendingUp aria-hidden="true" />;
        } else if (removed.length > 0) {
          iconNode = <TrendingDown aria-hidden="true" />;
        } else {
          iconNode = <Minus aria-hidden="true" />;
        }

        const tooltipContent =
          added.length > 0 || removed.length > 0 ? (
            <div className="trend-tooltip">
              {added.length > 0 && (
                <div className="trend-tooltip__section">
                  <strong className="trend-tooltip__title trend-tooltip__title--success">
                    <TrendingUp aria-hidden="true" /> Altas ({added.length}):
                  </strong>
                  <ul className="trend-tooltip__list">
                    {added.map((e) => (
                      <li key={e.numeroEmpleado}>
                        {e.numeroEmpleado} &middot; {getShortName(e.nombre)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {removed.length > 0 && (
                <div className="trend-tooltip__section">
                  <strong className="trend-tooltip__title trend-tooltip__title--danger">
                    <TrendingDown aria-hidden="true" /> Bajas ({removed.length}):
                  </strong>
                  <ul className="trend-tooltip__list">
                    {removed.map((e) => (
                      <li key={e.numeroEmpleado}>
                        {e.numeroEmpleado} &middot; {getShortName(e.nombre)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null;

        const textContent = (added.length > 0 && removed.length > 0)
          ? (netChange > 0 ? `+${netChange}` : netChange < 0 ? `−${Math.abs(netChange)}` : "0")
          : added.length > 0
            ? `+${added.length}`
            : removed.length > 0
              ? `−${removed.length}`
              : "0";

        const trendBadge = (
          <span
            tabIndex={0}
            className={`shift-bars__trend ${trendClass}`}
            aria-label={trendAria}
          >
            {iconNode}
            <span aria-hidden="true">{textContent}</span>
          </span>
        );

        return (
          <div
            key={turno}
            className={`shift-bars__row${isOverCapacity ? " shift-bars__row--over" : ""}`}
            style={
              {
                "--bar-pct": `${Math.min(pct, 100)}%`,
              } as React.CSSProperties
            }
          >
            <span className="shift-bars__label type-body-sm">
              Turno {turno}
            </span>
            <div
              className="shift-bars__track"
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={Math.max(barMax, count)}
              aria-valuetext={
                assignedCapacity
                  ? `${count} de ${assignedCapacity} empleados`
                  : `${count} empleados`
              }
              aria-label={`Turno ${turno}`}
            >
              <div className="shift-bars__fill" />
            </div>
            <div className="shift-bars__stats">
              <span
                className={`shift-bars__count type-body-sm${isOverCapacity ? " shift-bars__count--over" : ""}`}
              >
                {assignedCapacity ? `${count} / ${assignedCapacity}` : count}
              </span>
              {hasComparison &&
                (tooltipContent ? (
                  <Tooltip content={tooltipContent} side="top">
                    {trendBadge}
                  </Tooltip>
                ) : (
                  trendBadge
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Daily capacity */
interface DailyCapacityBarsProps {
  capacityPerDay: Record<string, number>;
  animKey: number;
  onSelectDay: (day: string) => void;
}

function DailyCapacityBars({
  capacityPerDay,
  animKey,
  onSelectDay,
}: DailyCapacityBarsProps) {
  const DAYS_ORDER = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  return (
    <div className="daily-cards" key={`daily-${animKey}`}>
      {DAYS_ORDER.map((day) => {
        const count = capacityPerDay[day] || 0;
        return (
          <button
            key={day}
            type="button"
            className="daily-cards__card"
            onClick={() => onSelectDay(day)}
            aria-haspopup="dialog"
            aria-label={`Ver ${count} empleados de la ruta el ${day}`}
          >
            <span className="daily-cards__day">{day}</span>
            <div className="daily-cards__stats">
              <div className="daily-cards__stat">
                <span className="daily-cards__label">Empleados</span>
                <span className="daily-cards__value">{count}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/*Placeholder*/
function Placeholder() {
  return (
    <div className="rutas-placeholder">
      <span className="rutas-placeholder__icon" aria-hidden="true">
        <Route />
      </span>
      <h2 id="rutas-placeholder-title" className="type-heading-md">
        Selecciona una ruta
      </h2>
      <p className="type-body-sm">
        Toca cualquier tarjeta para ver sus detalles.
      </p>
    </div>
  );
}

interface RouteSearchMatchesProps {
  employees: EmpleadoRuta[];
}

function RouteSearchMatches({ employees }: RouteSearchMatchesProps) {
  if (employees.length === 0) return null;

  return (
    <section
      id="rutas-search-results"
      className="ruta-search-results"
      aria-labelledby="ruta-search-results-title"
    >
      <header className="ruta-search-results__header">
        <h2
          id="ruta-search-results-title"
          className="ruta-section__title ruta-section__title-wrapper type-heading-sm"
        >
          <UserRoundSearch
            aria-hidden="true"
            className="ruta-section__title-icon"
          />
          Empleados encontrados
        </h2>
        <span className="ruta-search-results__count">
          {employees.length} resultado{employees.length === 1 ? "" : "s"}
        </span>
      </header>

      <ul className="ruta-search-results__list">
        {employees.map((employee) => (
          <li key={employee.numeroEmpleado} className="ruta-search-result">
            <div className="ruta-search-result__identity">
              <strong>{employee.nombre}</strong>
              <span>
                #{employee.numeroEmpleado} · Turno {employee.turno}
              </span>
            </div>
            <dl className="ruta-search-result__details">
              <div>
                <dt>Parada</dt>
                <dd>{employee.parada || "Sin información"}</dd>
              </div>
              <div>
                <dt>Colonia</dt>
                <dd>{employee.colonia || "Sin información"}</dd>
              </div>
              <div>
                <dt>Sección</dt>
                <dd>{employee.seccion || "Sin información"}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

/*Detail panel*/
interface RutaDetailProps {
  ruta: RutaAgrupada;
  searchMatches: EmpleadoRuta[];
  animKey: number;
  hasComparison: boolean;
  comparisonDate: string | null;
  onSelectDay: (day: string) => void;
}

function RutaDetail({
  ruta,
  searchMatches,
  animKey,
  hasComparison,
  comparisonDate,
  onSelectDay,
}: RutaDetailProps) {
  return (
    <div className="ruta-detail" key={animKey}>
      <div className="ruta-detail__body">
        <RouteSearchMatches employees={searchMatches} />

        {/* Dual column grids */}
        <div className="ruta-detail__grids">
          <section className="ruta-section">
            <h2
              id="ruta-detail-title"
              className="ruta-section__title ruta-section__title-wrapper type-heading-sm"
            >
              <Gauge
                aria-hidden="true"
                className="ruta-section__title-icon"
              />
              {ruta.nombreRuta}
            </h2>

            <ShiftBars
              turnosCount={ruta.turnosCount}
              turnosCountPrev={ruta.turnosCountPrev}
              maxCapacityPerShift={ruta.maxCapacityPerShift}
              empleados={ruta.empleados}
              empleadosPrev={ruta.empleadosPrev}
              hasComparison={hasComparison}
              animKey={animKey}
            />
            <p className="shift-bars__comparison-note">
              {hasComparison
                ? `Cambios desde la captura del ${formatReadableDate(comparisonDate)}.`
                : "El comparativo aparecerá después de la próxima actualización de rutas."}
            </p>
          </section>

          <section className="ruta-section">
            <h2 className="ruta-section__title ruta-section__title-wrapper type-heading-sm">
              <CalendarRange
                aria-hidden="true"
                className="ruta-section__title-icon"
              />
              Empleados por día
            </h2>
            <DailyCapacityBars
              capacityPerDay={ruta.capacityPerDay}
              animKey={animKey}
              onSelectDay={onSelectDay}
            />
          </section>
        </div>


      </div>
    </div>
  );
}


export function RutasView() {
  const { rutas, lastUpdated, hasComparison, loading, errorMsg } = useRutas();
  const [selectedRuta, setSelectedRuta] = useState<RutaAgrupada | null>(null);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  /**
   * mobileView controls which panel is shown on small screens.
   * On desktop both panels are always visible (CSS grid).
   */
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const listRef = useRef<HTMLUListElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter routes based on search term (by employee number or name)
  const searchNorm = searchTerm.trim().toLowerCase();

  const searchMatchesByRoute = useMemo(() => {
    if (!searchNorm) return new Map<string, EmpleadoRuta[]>();
    const map = new Map<string, EmpleadoRuta[]>();
    for (const ruta of rutas) {
      const matches = ruta.empleados.filter(
        (emp) =>
          emp.numeroEmpleado.toLowerCase().includes(searchNorm) ||
          emp.nombre.toLowerCase().includes(searchNorm),
      );
      if (matches.length > 0) map.set(ruta.nombreRuta, matches);
    }
    return map;
  }, [rutas, searchNorm]);

  const totalSearchMatches = useMemo(
    () =>
      Array.from(searchMatchesByRoute.values()).reduce(
        (total, matches) => total + matches.length,
        0,
      ),
    [searchMatchesByRoute],
  );

  const filteredRutas = useMemo(() => {
    if (!searchNorm) return rutas;
    return rutas.filter((ruta) => searchMatchesByRoute.has(ruta.nombreRuta));
  }, [rutas, searchNorm, searchMatchesByRoute]);

  const handleClearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  // Auto-select first matching route when search changes
  useEffect(() => {
    if (searchNorm && filteredRutas.length > 0) {
      const currentStillVisible =
        selectedRuta && searchMatchesByRoute.has(selectedRuta.nombreRuta);
      if (!currentStillVisible) {
        setSelectedRuta(filteredRutas[0]);
        setAnimKey((k) => k + 1);
      }
    }
  }, [searchNorm, filteredRutas, searchMatchesByRoute]);

  function handleSelect(ruta: RutaAgrupada) {
    setSelectedRuta(ruta);
    setAnimKey((k) => k + 1);
    setMobileView("detail"); // push to detail on mobile
  }

  function handleBack() {
    setMobileView("list");
    window.requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLButtonElement>('.ruta-card[aria-pressed="true"]')
        ?.focus();
    });
  }

  useEffect(() => {
    if (mobileView !== "detail") return;
    const frame = window.requestAnimationFrame(() => {
      detailRef.current
        ?.querySelector<HTMLButtonElement>(".rutas-back-btn")
        ?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobileView]);

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(".ruta-card") ?? [],
    );
    if (!buttons.length) return;
    const currentIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (Math.max(currentIndex, 0) +
              (event.key === "ArrowDown" ? 1 : -1) +
              buttons.length) %
            buttons.length;
    buttons[nextIndex]?.focus();
  };

  return (
    <section
      className="rutas-page config-page"
      data-mobile-view={mobileView}
      aria-labelledby="rutas-page-title"
    >
      <header className="rutas-header">
        <div className="rutas-header__copy">
          <h1 id="rutas-page-title" className="config-page__title">
            Rutas
          </h1>
        </div>
      </header>

      <section
        className="config-results-controls rutas-toolbar"
        aria-label="Herramientas de rutas"
      >
        <div className="rutas-toolbar-flex">
          <div className="form-group config-search rutas-search-container">
            <label
              htmlFor="rutas-search-input"
              className="config-filter-label type-caption-sm text-muted"
            >
              Buscar empleado
            </label>
            <div className="config-search__wrapper">
              <button
                type="button"
                className={`config-search__icon rutas-search-clear-btn ${searchTerm ? "rutas-search-clear-btn--active" : "rutas-search-clear-btn--inactive"}`}
                onClick={handleClearSearch}
                disabled={!searchTerm}
                aria-label={searchTerm ? "Limpiar búsqueda" : "Buscar"}
                tabIndex={searchTerm ? 0 : -1}
              >
                <MorphingIcon
                  icon={searchTerm ? XIconData : SearchData}
                  className="text-muted"
                  aria-hidden="true"
                />
              </button>
              <input
                id="rutas-search-input"
                ref={searchInputRef}
                type="search"
                placeholder="Buscar por número de empleado o nombres"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-describedby={
                  searchNorm ? "rutas-search-status" : undefined
                }
                aria-controls={
                  searchNorm && totalSearchMatches > 0
                    ? "rutas-search-results"
                    : undefined
                }
                autoComplete="off"
              />
            </div>
            {searchNorm && (
              <p
                id="rutas-search-status"
                className="config-search__hint text-muted mt-xs"
                role="status"
                aria-live="polite"
              >
                {filteredRutas.length === 0
                  ? "Sin resultados"
                  : `${totalSearchMatches} empleado${totalSearchMatches === 1 ? "" : "s"} en ${searchMatchesByRoute.size} ruta${searchMatchesByRoute.size === 1 ? "" : "s"}`}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="rutas-layout" data-mobile-view={mobileView}>
        <section
          className="rutas-list-panel"
          aria-labelledby="rutas-list-title"
        >
          <header className="rutas-list-panel__header">
            <h2 id="rutas-list-title">Rutas disponibles</h2>
            {!loading && !errorMsg && (
              <span className="rutas-list-panel__count">
                {filteredRutas.length} de {rutas.length}
              </span>
            )}
          </header>

          <BoneyardSkeleton
            name="configuracion-rutas"
            loading={loading}
            loadingLabel="Cargando rutas…"
          >
            <ul
              ref={listRef}
              className="rutas-list"
              aria-label="Lista de rutas"
              onKeyDown={handleListKeyDown}
            >
              {errorMsg && (
                <li className="rutas-error">
                  <div role="alert">
                    <p className="type-body-strong">Error al cargar datos</p>
                    <p className="type-body-sm">{errorMsg}</p>
                  </div>
                </li>
              )}

              {!loading &&
                !errorMsg &&
                !searchNorm &&
                filteredRutas.length === 0 && (
                  <li className="rutas-empty type-body-sm">
                    No se encontraron rutas en el archivo.
                  </li>
                )}

              {!loading &&
                !errorMsg &&
                searchNorm &&
                filteredRutas.length === 0 && (
                  <li className="rutas-empty">
                    <p className="type-body-sm">
                      No hay rutas con empleados que coincidan con la búsqueda.
                    </p>
                    <button
                      type="button"
                      className="btn-text"
                      onClick={handleClearSearch}
                    >
                      Limpiar búsqueda
                    </button>
                  </li>
                )}

              {!loading &&
                !errorMsg &&
                filteredRutas.map((ruta) => (
                  <li key={ruta.nombreRuta} className="rutas-list__item">
                    <RutaCard
                      ruta={ruta}
                      isActive={selectedRuta?.nombreRuta === ruta.nombreRuta}
                      onClick={() => handleSelect(ruta)}
                      matchCount={
                        searchNorm
                          ? searchMatchesByRoute.get(ruta.nombreRuta)?.length
                          : undefined
                      }
                    />
                  </li>
                ))}
            </ul>
          </BoneyardSkeleton>
        </section>

        {/* Right: detail / placeholder */}
        <section
          id="rutas-detail-pane"
          ref={detailRef}
          className="rutas-detail-pane"
          aria-labelledby={
            selectedRuta ? "ruta-detail-title" : "rutas-placeholder-title"
          }
        >
          {/* Back button — mobile only, rendered via CSS display */}
          {selectedRuta && (
            <button
              type="button"
              className="btn-text rutas-back-btn"
              onClick={handleBack}
              aria-label="Volver a la lista de rutas"
            >
              <ChevronLeft aria-hidden="true" />
              Todas las rutas
            </button>
          )}

          {selectedRuta ? (
            <RutaDetail
              ruta={selectedRuta}
              searchMatches={
                searchNorm
                  ? searchMatchesByRoute.get(selectedRuta.nombreRuta) ?? []
                  : []
              }
              animKey={animKey}
              hasComparison={hasComparison}
              comparisonDate={lastUpdated}
              onSelectDay={setSelectedDia}
            />
          ) : (
            <Placeholder />
          )}
        </section>
      </div>

      <RutaDayEmployeesModal
        isOpen={selectedDia !== null}
        onClose={() => setSelectedDia(null)}
        ruta={selectedRuta}
        dia={selectedDia}
      />



    </section>
  );
}
