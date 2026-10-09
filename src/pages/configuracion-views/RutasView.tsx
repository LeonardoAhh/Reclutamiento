import { useState, useRef, useMemo, useEffect } from "react";
import { PageHeading } from '@/components/layout/PageHeading';
import { Link, useLocation } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  BusFront,
  CalendarRange,
  Minus,
  Route,
  UserRoundSearch,
} from "lucide-react";
import { getShortName } from "@/lib/names";
import { formatReadableDate } from "@/lib/dates";
import {
  useRutas,
  ROUTE_DAYS,
  RutaAgrupada,
  type EmpleadoRuta,
} from "@/hooks/useRutas";
import { ROUTE_DAY_EMPLOYEES_PATH } from "@/lib/configuracionNavigation";
import { Tooltip } from "@/components/ui/Tooltip";
import { BackButton } from "@/components/ui/BackButton";
import { SearchField } from "@/components/ui/SearchField";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatRouteDay, getConfiguracionCopy } from "./configuracion-translations";

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
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
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
        <span className="ruta-card__heading">
          <span className="ruta-card__title">{routeCode.trim()}</span>
          {isOverCapacity && (
            <span className="ruta-card__capacity-alert">
              <span className="ruta-card__alert-dot" aria-hidden="true" />
              <span>{copy.overCapacity}</span>
            </span>
          )}
        </span>
        {routeName && <span className="ruta-card__subtitle">{routeName}</span>}
      </span>
      {matchCount !== undefined && matchCount > 0 && (
        <span
          className="ruta-card__match-badge"
          aria-label={`${matchCount} ${matchCount === 1 ? copy.match : copy.matches}`}
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
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
  const english = language === 'en';
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
          ? english
            ? `${added.length} ${copy.additions} and ${removed.length} ${copy.departures}`
            : `${added.length} alta${added.length === 1 ? "" : "s"} y ${removed.length} baja${removed.length === 1 ? "" : "s"}`
          : copy.noChanges;
        const trendClass = added.length > 0 && removed.length > 0
          ? "trend-mixed"
          : added.length > 0
            ? "trend-up"
            : removed.length > 0
              ? "trend-down"
              : "trend-flat";

        let iconNode;
        if (added.length > 0 && removed.length > 0) {
          iconNode = netChange > 0 ? <ArrowUpRight aria-hidden="true" /> :
                     netChange < 0 ? <ArrowDownRight aria-hidden="true" /> :
                     <ArrowLeftRight aria-hidden="true" />;
        } else if (added.length > 0) {
          iconNode = <ArrowUpRight aria-hidden="true" />;
        } else if (removed.length > 0) {
          iconNode = <ArrowDownRight aria-hidden="true" />;
        } else {
          iconNode = <Minus aria-hidden="true" />;
        }

        const tooltipContent =
          added.length > 0 || removed.length > 0 ? (
            <div className="trend-tooltip">
              {added.length > 0 && (
                <div className="trend-tooltip__section">
                  <strong className="trend-tooltip__title trend-tooltip__title--success">
                    <ArrowUpRight aria-hidden="true" /> {english ? `Added (${added.length}):` : `Altas (${added.length}):`}
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
                    <ArrowDownRight aria-hidden="true" /> {english ? `Departures (${removed.length}):` : `Bajas (${removed.length}):`}
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
            tabIndex={tooltipContent ? 0 : undefined}
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
              {copy.shift} {turno}
            </span>
            <div
              className="shift-bars__track"
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={Math.max(barMax, count)}
              aria-valuetext={
                assignedCapacity
                  ? `${count} ${copy.of} ${assignedCapacity} ${copy.employeesPlural.toLowerCase()}`
                  : `${count} ${copy.employeesPlural.toLowerCase()}`
              }
              aria-label={`${copy.shift} ${turno}`}
            >
              <div className="shift-bars__fill" />
            </div>
            <div
              className={`shift-bars__stats${hasComparison ? " shift-bars__stats--comparison" : ""}`}
            >
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
  routeName: string;
  searchTerm: string;
  animKey: number;
}

function DailyCapacityBars({
  capacityPerDay,
  routeName,
  searchTerm,
  animKey,
}: DailyCapacityBarsProps) {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
  return (
    <div className="daily-cards" key={`daily-${animKey}`}>
      {ROUTE_DAYS.map((day) => {
        const count = capacityPerDay[day] || 0;
        return (
          <Link
            key={day}
            className="daily-cards__card"
            to={`${ROUTE_DAY_EMPLOYEES_PATH}?${new URLSearchParams({ route: routeName, day: formatRouteDay(day, 'en').toLowerCase(), ...(searchTerm ? { search: searchTerm } : {}) })}`}
            aria-label={`${language === 'en' ? 'View' : 'Ver'} ${count} ${count === 1 ? copy.employee : copy.employeesPlural} ${language === 'en' ? 'on the route on' : 'de la ruta el'} ${formatRouteDay(day, language)}`}
          >
            <span className="daily-cards__day">{formatRouteDay(day, language)}</span>
            <div className="daily-cards__stats">
              <div className="daily-cards__stat">
                <span className="daily-cards__label">{copy.employees}</span>
                <span className="daily-cards__value">{count}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/*Placeholder*/
function Placeholder() {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
  return (
    <div className="rutas-placeholder">
      <span className="rutas-placeholder__icon" aria-hidden="true">
        <Route />
      </span>
      <h2 id="rutas-placeholder-title" className="type-heading-md">
        {copy.selectRoute}
      </h2>
      <p className="type-body-sm">
        {copy.selectRouteHelp}
      </p>
    </div>
  );
}

interface RouteSearchMatchesProps {
  employees: EmpleadoRuta[];
}

function RouteSearchMatches({ employees }: RouteSearchMatchesProps) {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
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
          {copy.foundEmployees}
        </h2>
        <span className="ruta-search-results__count">
          {employees.length} {employees.length === 1 ? copy.result : copy.results}
        </span>
      </header>

      <ul className="ruta-search-results__list">
        {employees.map((employee) => (
          <li key={employee.numeroEmpleado} className="ruta-search-result">
            <div className="ruta-search-result__identity">
              <strong>{employee.nombre}</strong>
              <span>
                #{employee.numeroEmpleado} · {copy.shift} {employee.turno}
              </span>
            </div>
            <dl className="ruta-search-result__details">
              <div>
                <dt>{copy.stop}</dt>
                <dd>{employee.parada || copy.noInformation}</dd>
              </div>
              <div>
                <dt>{copy.neighborhood}</dt>
                <dd>{employee.colonia || copy.noInformation}</dd>
              </div>
              <div>
                <dt>{copy.section}</dt>
                <dd>{employee.seccion || copy.noInformation}</dd>
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
  searchTerm: string;
  animKey: number;
  hasComparison: boolean;
  comparisonDate: string | null;
}

function RutaDetail({
  ruta,
  searchMatches,
  searchTerm,
  animKey,
  hasComparison,
  comparisonDate,
}: RutaDetailProps) {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
  return (
    <div className="ruta-detail" key={animKey}>
      <div className="ruta-detail__body">
        <RouteSearchMatches employees={searchMatches} />

        {/* Dual column grids */}
        <div className="ruta-detail__grids">
          <section className="ruta-section">
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
                ? `${copy.comparisonChanged} ${formatReadableDate(comparisonDate, language === 'en' ? 'en-US' : 'es-MX')}.`
                : copy.comparisonPending}
            </p>
          </section>

          <section className="ruta-section">
            <h2 className="ruta-section__title ruta-section__title-wrapper type-heading-sm">
              <CalendarRange
                aria-hidden="true"
                className="ruta-section__title-icon"
              />
              {copy.employeesByDay}
            </h2>
            <DailyCapacityBars
              capacityPerDay={ruta.capacityPerDay}
              routeName={ruta.nombreRuta}
              searchTerm={searchTerm}
              animKey={animKey}
            />
          </section>
        </div>


      </div>
    </div>
  );
}


export function RutasView() {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
  const english = language === 'en';
  const { rutas, lastUpdated, hasComparison, loading, errorMsg } = useRutas();
  const location = useLocation();
  const [selectedRuta, setSelectedRuta] = useState<RutaAgrupada | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(location.search).get("search") ?? "");
  
  /**
   * mobileView controls which panel is shown on small screens.
   * On desktop both panels are always visible (CSS grid).
   */
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const listRef = useRef<HTMLUListElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading || errorMsg) return;
    const routeName = new URLSearchParams(location.search).get("route");
    const route = rutas.find(item => item.nombreRuta === routeName);
    if (!route) return;
    setSelectedRuta(route);
    setMobileView("detail");
  }, [loading, errorMsg, location.search, rutas]);

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
      const routeFromUrl = new URLSearchParams(location.search).get("route");
      if (!selectedRuta && filteredRutas.some(item => item.nombreRuta === routeFromUrl)) return;
      const currentStillVisible =
        selectedRuta && searchMatchesByRoute.has(selectedRuta.nombreRuta);
      if (!currentStillVisible) {
        setSelectedRuta(filteredRutas[0]);
        setAnimKey((k) => k + 1);
      }
    }
  }, [searchNorm, filteredRutas, searchMatchesByRoute, location.search, selectedRuta]);

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
          <PageHeading id="rutas-page-title" className="config-page__title app-page-title">
            {copy.title}
          </PageHeading>

      <section
        className="config-results-controls rutas-toolbar"
        aria-label={copy.tools}
      >
        <div className="rutas-toolbar-flex">
          <div className="rutas-search-container">
            <SearchField
              id="rutas-search-input"
              ref={searchInputRef}
              label={copy.searchEmployee}
              placeholder={copy.search}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onClear={handleClearSearch}
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
            {searchNorm && (
              <p
                id="rutas-search-status"
                className="config-search__hint text-muted mt-xs"
                role="status"
                aria-live="polite"
              >
                {filteredRutas.length === 0
                  ? copy.noResults
                  : `${totalSearchMatches} ${totalSearchMatches === 1 ? copy.employee : copy.employeesPlural} ${copy.of} ${searchMatchesByRoute.size} ${english ? searchMatchesByRoute.size === 1 ? 'route' : 'routes' : `ruta${searchMatchesByRoute.size === 1 ? '' : 's'}`}`
                }
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
            <h2 id="rutas-list-title">{copy.routesAvailable}</h2>
            {!loading && !errorMsg && (
              <span className="rutas-list-panel__count">
                {filteredRutas.length} {copy.of} {rutas.length}
              </span>
            )}
          </header>

          <BoneyardSkeleton
            name="configuracion-rutas"
            loading={loading}
            loadingLabel={copy.loading}
          >
            <ul
              ref={listRef}
              className="rutas-list"
              aria-label={copy.routeList}
              onKeyDown={handleListKeyDown}
            >
              {errorMsg && (
                <li className="rutas-error">
                  <div role="alert">
                    <p className="type-body-strong">{copy.loadError}</p>
                    <p className="type-body-sm">{english ? "Check your connection and try again." : errorMsg}</p>
                  </div>
                </li>
              )}

              {!loading &&
                !errorMsg &&
                !searchNorm &&
                filteredRutas.length === 0 && (
                  <li className="rutas-empty type-body-sm">
                    {copy.noRoutesInFile}
                  </li>
                )}

              {!loading &&
                !errorMsg &&
                searchNorm &&
                filteredRutas.length === 0 && (
                  <li className="rutas-empty">
                    <p className="type-body-sm">
                      {copy.noMatchingRoutes}
                    </p>
                    <button
                      type="button"
                      className="btn-text"
                      onClick={handleClearSearch}
                    >
                      {copy.clearSearch}
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
          aria-label={selectedRuta?.nombreRuta}
          aria-labelledby={selectedRuta ? undefined : "rutas-placeholder-title"}
        >
          {/* Back button — mobile only, rendered via CSS display */}
          {selectedRuta && (
            <BackButton
              className="rutas-back-btn"
              onClick={handleBack}
              aria-label={copy.backToRouteList}
              label={selectedRuta.nombreRuta}
            />
          )}

          {selectedRuta ? (
            <RutaDetail
              ruta={selectedRuta}
              searchMatches={
                searchNorm
                  ? searchMatchesByRoute.get(selectedRuta.nombreRuta) ?? []
                  : []
              }
              searchTerm={searchTerm}
              animKey={animKey}
              hasComparison={hasComparison}
              comparisonDate={lastUpdated}
            />
          ) : (
            <Placeholder />
          )}
        </section>
      </div>




    </section>
  );
}
