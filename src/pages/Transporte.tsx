import { useMemo, useState } from 'react';
import { Bus, Search, Upload, Users, Route as RouteIcon, X } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonTable } from '@/components/ui/PageSkeletons';
import { TransporteImporter } from '@/components/transporte/TransporteImporter';
import { buildRouteCapacity, type RouteCapacity } from '@/lib/transporte';
import {
  getRutaCapacidad,
  mapClaveHorarioToTurno,
  TRANSPORTE_DIAS,
  TRANSPORTE_NA,
  TRANSPORTE_RUTAS,
  TRANSPORTE_TURNOS,
  TURNO_DIAS,
  TURNO_HORARIO,
  turnoLabel,
  rutaShortCode,
} from '@/lib/transporte-routes';
import type { Employee } from '@/lib/types';
import './Transporte.css';

/**
 * /transporte — control de capacidad por ruta.
 *
 * Reusa la tabla `empleados` extendida con `ruta` y `parada` (migración 014).
 * No crea tablas nuevas. La capacidad por ruta es **fija** (definida en
 * `RUTA_CAPACIDAD` del catálogo) y se comparte entre los 4 turnos: la barra
 * muestra ocupación total vs cupo, y el breakdown por turno es informativo.
 */
export function Transporte() {
  const { employees, loading, assignTransporte } = useSupabaseData();
  const [search, setSearch] = useState('');
  const [importerOpen, setImporterOpen] = useState(false);

  // Construye el dashboard de rutas: catálogo oficial siempre presente, más
  // cualquier ruta huérfana que haya quedado en `empleados` (raro pero
  // posible si el catálogo cambió).
  const routes = useMemo(
    () => buildRouteCapacity(employees, TRANSPORTE_RUTAS),
    [employees]
  );

  // Stats globales del header. Distinguimos tres estados de empleados:
  //   - `conRuta`: tienen una ruta real del catálogo (consumen capacidad).
  //   - `naRuta`: declarados explícitamente como `N/A` (no toman transporte).
  //   - `sinAsignar`: campo `ruta` null (pendiente de captura).
  const stats = useMemo(() => {
    let conRuta = 0;
    let naRuta = 0;
    for (const emp of employees) {
      if (!emp.ruta) continue;
      if (emp.ruta === TRANSPORTE_NA) naRuta += 1;
      else conRuta += 1;
    }
    return {
      total: employees.length,
      conRuta,
      naRuta,
      sinAsignar: employees.length - conRuta - naRuta,
      rutasActivas: routes.filter((r) => r.total > 0).length,
    };
  }, [employees, routes]);

  // Empleados visibles bajo la barra de búsqueda. Solo muestra los que ya
  // tienen ruta real — N/A y sin asignar no aparecen en esta tabla
  // (la página es de gestión de transporte real, no de plantilla completa).
  const filteredEmployees = useMemo(() => {
    const withRuta = employees.filter(
      (e) => e.ruta && e.ruta !== TRANSPORTE_NA
    );
    const q = search.trim().toLowerCase();
    if (!q) return withRuta;
    return withRuta.filter((e) => {
      const haystack = [
        e.num_empleado,
        e.nombre,
        e.area,
        e.seccion,
        e.puesto,
        e.ruta,
        e.parada,
        e.turno,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [employees, search]);

  if (loading) {
    return (
      <main className="transporte container">
        <header className="transporte__hero">
          <div className="transporte__hero-content">
            <h1>Transporte</h1>
          </div>
        </header>
        <section className="transporte__stats" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={72} radius="var(--rounded-lg)" />
          ))}
        </section>
        <section className="transporte__capacity">
          <div className="transporte__route-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={130} radius="var(--rounded-lg)" />
            ))}
          </div>
        </section>
        <section className="transporte__list">
          <SkeletonTable rows={8} columns={['22%', '34%', '24%', '20%']} />
        </section>
      </main>
    );
  }

  return (
    <main className="transporte container">
      <header className="transporte__hero">
        <div className="transporte__hero-content">
          <h1>Transporte</h1>
        </div>
        <div className="transporte__hero-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setImporterOpen(true)}
          >
            <Upload size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="transporte__stats" aria-label="Resumen de transporte">
        <StatTile
          icon={<Users size={16} aria-hidden="true" />}
          label="Empleados"
          value={stats.total}
        />
        <StatTile
          icon={<Bus size={16} aria-hidden="true" />}
          label="Con ruta"
          value={stats.conRuta}
        />
        <StatTile
          icon={<RouteIcon size={16} aria-hidden="true" />}
          label="Rutas activas"
          value={stats.rutasActivas}
        />
      </section>

      <section
        className="transporte__capacity"
        aria-label="Capacidad por ruta"
      >
        <header className="transporte__section-head">
          <h2>Capacidad por ruta</h2>
        </header>
        <div className="transporte__route-grid">
          {routes.map((route) => (
            <RouteCard key={route.ruta} route={route} />
          ))}
        </div>
      </section>

      <section
        className="transporte__matrix-section"
        aria-label="Capacidad por turno y día"
      >
        <header className="transporte__section-head">
          <h2>Cupo por turno y día</h2>
        </header>
        <div className="transporte__matrix-grid">
          {routes.map((route) => (
            <RouteMatrix key={route.ruta} route={route} />
          ))}
        </div>
      </section>

      <section
        className="transporte__list"
        aria-label="Empleados con ruta asignada"
      >
        <header className="transporte__section-head transporte__section-head--with-search">
          <div>
            <h2>Empleados asignados</h2>
          </div>
          <div className="transporte__search">
            <label htmlFor="transporte-search-input" className="sr-only">Buscar empleados</label>
            <Search
              size={16}
              aria-hidden="true"
              className="transporte__search-icon"
            />
            <input
              id="transporte-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, nombre, ruta…"
              className="transporte__search-input"
              aria-label="Buscar empleados"
            />
            {search && (
              <button
                type="button"
                className="transporte__search-clear"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </header>

        <EmployeesTable employees={filteredEmployees} />
      </section>

      <TransporteImporter
        isOpen={importerOpen}
        onClose={() => setImporterOpen(false)}
        employees={employees}
        onConfirm={assignTransporte}
      />
    </main>
  );
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  muted?: boolean;
}

function StatTile({ icon, label, value, muted = false }: StatTileProps) {
  return (
    <article
      className={`transporte__stat${muted ? ' transporte__stat--muted' : ''}`}
    >
      <span className="transporte__stat-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="transporte__stat-body">
        <span className="transporte__stat-value">{value}</span>
        <span className="transporte__stat-label">{label}</span>
      </div>
    </article>
  );
}

interface RouteCardProps {
  route: RouteCapacity;
}

function RouteCard({ route }: RouteCardProps) {
  // Mantiene el orden canónico de turnos (1–5) y mueve al final cualquier
  // valor inesperado que haya quedado en datos históricos. Cada turno se
  // compara individualmente contra el cupo de la ruta (el cupo aplica por
  // turno, no compartido entre turnos).
  const turnoBreakdown = useMemo(() => {
    const byTurno = new Map(route.turnos.map((t) => [t.turno, t.total] as const));
    const ordered: Array<{ turno: string; total: number }> = [];
    for (const t of TRANSPORTE_TURNOS) {
      ordered.push({ turno: t, total: byTurno.get(t) ?? 0 });
    }
    for (const { turno, total } of route.turnos) {
      if (!(TRANSPORTE_TURNOS as ReadonlyArray<string>).includes(turno)) {
        ordered.push({ turno, total });
      }
    }
    return ordered;
  }, [route.turnos]);

  const capacidad = getRutaCapacidad(route.ruta);
  const occupied = route.total;

  // Turnos que rebasan el cupo individual. Solo aplica si la ruta está en
  // el catálogo (capacidad != null).
  const turnosSobre = useMemo(() => {
    if (capacidad == null) return [] as Array<{ turno: string; total: number }>;
    return turnoBreakdown.filter(({ total }) => total > capacidad);
  }, [turnoBreakdown, capacidad]);

  // Asientos disponibles sumando solo los turnos canónicos (T1–T5). No
  // contamos los extras históricos porque no representan corridas activas.
  const availableCanonical = useMemo(() => {
    if (capacidad == null) return null;
    let total = 0;
    for (const t of TRANSPORTE_TURNOS) {
      const occ = turnoBreakdown.find((x) => x.turno === t)?.total ?? 0;
      total += Math.max(capacidad - occ, 0);
    }
    return total;
  }, [turnoBreakdown, capacidad]);

  const overCapacity = turnosSobre.length > 0;
  const status: 'libre' | 'lleno' | 'sobre' = overCapacity
    ? 'sobre'
    : availableCanonical === 0
      ? 'lleno'
      : 'libre';

  return (
    <article
      className={`transporte__route transporte__route--${status}`}
      data-empty={occupied === 0}
    >
      <header className="transporte__route-head">
        <span className="transporte__route-code">{rutaShortCode(route.ruta)}</span>
        <h3 className="transporte__route-name">{route.ruta}</h3>
        <span
          className="transporte__route-total"
          aria-label={`${occupied} empleados asignados a la ruta`}
        >
          <strong>{occupied}</strong>
        </span>
      </header>

      <p className="transporte__route-foot">
        {capacidad == null ? (
          <span className="transporte__turno-hint">
            Ruta fuera del catálogo
          </span>
        ) : overCapacity ? (
          <span className="transporte__turno-over-msg">
            {turnosSobre.length} turno
            {turnosSobre.length === 1 ? '' : 's'} sobre el cupo:{' '}
            {turnosSobre.map((t) => turnoLabel(t.turno)).join(', ')}
          </span>
        ) : (
          <span>
          </span>
        )}
      </p>

      <ul className="transporte__turnos" aria-label="Distribución por turno">
        {turnoBreakdown.map(({ turno, total }) => {
          const turnoSobre = capacidad != null && total > capacidad;
          return (
            <li
              key={turno}
              className={`transporte__turno${turnoSobre ? ' transporte__turno--over' : ''}`}
              title={
                capacidad != null
                  ? `${total} de ${capacidad} asientos en turno ${turno}`
                  : undefined
              }
            >
              <span className="transporte__turno-label">{turnoLabel(turno)}</span>
              <span className="transporte__turno-count">{total}</span>
            </li>
          );
        })}
      </ul>

      {route.paradas.length > 0 && (
        <details className="transporte__paradas">
          <summary>Paradas ({route.paradas.length})</summary>
          <ul className="transporte__paradas-list">
            {route.paradas.map((p) => (
              <li key={p.parada}>
                <span className="transporte__parada-name">{p.parada}</span>
                <span className="transporte__parada-count">{p.total}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

interface RouteMatrixProps {
  route: RouteCapacity;
}

/**
 * Matriz turno × día por ruta. Filas T1–T4 (T5 sin calendario documentado),
 * columnas L→D. Cada celda muestra `ocupados/cupo` cuando el turno corre ese
 * día, o `—` cuando no.
 */
function RouteMatrix({ route }: RouteMatrixProps) {
  const capacidad = getRutaCapacidad(route.ruta);
  const occByTurno = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of route.turnos) m.set(t.turno, t.total);
    return m;
  }, [route.turnos]);

  const turnosMostrar = ['1', '2', '3', '4'] as const;

  return (
    <article className="transporte__matrix">
      <header className="transporte__matrix-head">
        <span className="transporte__route-code">{rutaShortCode(route.ruta)}</span>
        <h3 className="transporte__matrix-name">{route.ruta}</h3>
      </header>
      <table className="transporte__matrix-table">
        <thead>
          <tr>
            <th scope="col" aria-label="Turno"></th>
            {TRANSPORTE_DIAS.map(({ key, label }) => (
              <th key={key} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {turnosMostrar.map((t) => {
            const occ = occByTurno.get(t) ?? 0;
            const dias = TURNO_DIAS[t];
            const horario = TURNO_HORARIO[t];
            return (
              <tr key={t}>
                <th scope="row" className="transporte__matrix-row-label">
                  <span className="transporte__matrix-turno">T{t}</span>
                  {horario && t !== '4' && (
                    <span className="transporte__matrix-horario">{horario}</span>
                  )}
                </th>
                {TRANSPORTE_DIAS.map(({ key }) => {
                  const activo = dias.includes(key);
                  if (!activo) {
                    return (
                      <td key={key} className="transporte__matrix-cell transporte__matrix-cell--off">
                        —
                      </td>
                    );
                  }
                  const sobre = capacidad != null && occ > capacidad;
                  return (
                    <td
                      key={key}
                      className={`transporte__matrix-cell${sobre ? ' transporte__matrix-cell--over' : ''}`}
                    >
                      <span className="transporte__matrix-occ">{occ}</span>
                      {capacidad != null && (
                        <span className="transporte__matrix-cap">/{capacidad}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}

function EmployeesTable({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return (
      <p className="transporte__empty">
        No hay empleados con ruta asignada para esta búsqueda.
      </p>
    );
  }
  return (
    <div className="transporte__table-wrap">
      <table className="transporte__table">
        <thead>
          <tr>
            <th scope="col">Num</th>
            <th scope="col">Nombre</th>
            <th scope="col">Puesto · Área</th>
            <th scope="col">Turno</th>
            <th scope="col">Ruta · Parada</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.num_empleado}>
              <td className="transporte__td-num">{emp.num_empleado}</td>
              <td>{emp.nombre}</td>
              <td>
                <div>{emp.puesto}</div>
                <div className="transporte__td-sub">
                  {emp.area} · {emp.seccion}
                </div>
              </td>
              <td>
                <div>{turnoLabel(mapClaveHorarioToTurno(emp.turno))}</div>
                {emp.turno && mapClaveHorarioToTurno(emp.turno) !== emp.turno && (
                  <div className="transporte__td-sub">clave {emp.turno}</div>
                )}
              </td>
              <td>
                <div>{emp.ruta}</div>
                <div className="transporte__td-sub">{emp.parada ?? '—'}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
