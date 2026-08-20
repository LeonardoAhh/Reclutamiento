import { Skeleton } from './Skeleton';
import './PageSkeletons.css';

/** Card de KPI en carga: imita label + valor de StatCard. */
export function StatCardSkeleton() {
  return (
    <div className="stat-card stat-card--cream skeleton-card">
      <Skeleton variant="text" width="55%" />
      <Skeleton variant="text" width="42%" height="2rem" />
    </div>
  );
}

/** Grilla de KPIs en carga, reutiliza el grid real de la página. */
export function KpiGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <section className="kpis-page__grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </section>
  );
}

interface SkeletonTableProps {
  rows?: number;
  /** Anchos relativos de cada columna (define el número de columnas). */
  columns?: string[];
}

/** Tabla genérica en carga. Cabecera + filas con celdas de ancho variable. */
export function SkeletonTable({
  rows = 8,
  columns = ['18%', '34%', '28%', '12%'],
}: SkeletonTableProps) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      <div className="skeleton-table__row skeleton-table__row--head">
        {columns.map((w, i) => (
          <div key={i} className="skeleton-table__cell" style={{ width: w }}>
            <Skeleton variant="text" width="60%" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table__row">
          {columns.map((w, c) => (
            <div key={c} className="skeleton-table__cell" style={{ width: w }}>
              <Skeleton variant="text" width={c === 0 ? '50%' : '80%'} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Lista de tarjetas en carga (p.ej. acordeón móvil de empleados). */
export function SkeletonCardList({ items = 5 }: { items?: number }) {
  return (
    <div className="skeleton-card-list" aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="skeleton-card-list__item">
          <div className="skeleton-card-list__main">
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="32%" />
          </div>
          <Skeleton variant="circle" width={28} height={28} />
        </div>
      ))}
    </div>
  );
}
