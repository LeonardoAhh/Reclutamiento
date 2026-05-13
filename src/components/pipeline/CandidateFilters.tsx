import { useMemo } from 'react';
import { X } from 'lucide-react';
import { PLANTILLA_AUTORIZADA } from '@/lib/constants';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABEL } from '@/lib/types';
import type { Candidate, CandidateStatus } from '@/lib/types';
import './CandidateFilters.css';

export interface FilterState {
  area: string;
  puesto: string;
  estado: CandidateStatus | '';
  reclutador: string;
  source: string;
  fechaDesde: string;
  fechaHasta: string;
}

export const EMPTY_FILTERS: FilterState = {
  area: '',
  puesto: '',
  estado: '',
  reclutador: '',
  source: '',
  fechaDesde: '',
  fechaHasta: '',
};

interface CandidateFiltersProps {
  candidates: Candidate[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}

function unique(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (v && v.trim()) set.add(v.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

export function CandidateFilters({
  candidates,
  value,
  onChange,
  onReset,
}: CandidateFiltersProps) {
  const areas = useMemo(
    () =>
      Array.from(new Set(PLANTILLA_AUTORIZADA.map((p) => p.area))).sort((a, b) =>
        a.localeCompare(b, 'es')
      ),
    []
  );

  const puestos = useMemo(() => {
    const base = value.area
      ? PLANTILLA_AUTORIZADA.filter((p) => p.area === value.area)
      : PLANTILLA_AUTORIZADA;
    return Array.from(new Set(base.map((p) => p.puesto))).sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }, [value.area]);

  const reclutadores = useMemo(
    () => unique(candidates.map((c) => c.reclutador)),
    [candidates]
  );

  const sources = useMemo(
    () => unique(candidates.map((c) => c.source)),
    [candidates]
  );

  function update<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    onChange({ ...value, [key]: val });
  }

  const activeCount = (Object.keys(value) as Array<keyof FilterState>).filter(
    (k) => value[k] !== ''
  ).length;

  return (
    <div className="filters" role="region" aria-label="Filtros de candidatos">
      <div className="filters__grid">
        <div className="filters__field">
          <label htmlFor="filter-area">Área</label>
          <select
            id="filter-area"
            value={value.area}
            onChange={(e) => {
              const nextArea = e.target.value;
              onChange({ ...value, area: nextArea, puesto: '' });
            }}
          >
            <option value="">Todas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label htmlFor="filter-puesto">Puesto</label>
          <select
            id="filter-puesto"
            value={value.puesto}
            onChange={(e) => update('puesto', e.target.value)}
          >
            <option value="">Todos</option>
            {puestos.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label htmlFor="filter-estado">Estado</label>
          <select
            id="filter-estado"
            value={value.estado}
            onChange={(e) =>
              update('estado', (e.target.value as CandidateStatus) || '')
            }
          >
            <option value="">Todos</option>
            {CANDIDATE_STATUSES.map((s) => (
              <option key={s} value={s}>{CANDIDATE_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label htmlFor="filter-reclutador">Reclutador</label>
          <select
            id="filter-reclutador"
            value={value.reclutador}
            onChange={(e) => update('reclutador', e.target.value)}
          >
            <option value="">Todos</option>
            {reclutadores.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label htmlFor="filter-source">Fuente</label>
          <select
            id="filter-source"
            value={value.source}
            onChange={(e) => update('source', e.target.value)}
          >
            <option value="">Todas</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label htmlFor="filter-desde">Aplicó desde</label>
          <input
            id="filter-desde"
            type="date"
            value={value.fechaDesde}
            onChange={(e) => update('fechaDesde', e.target.value)}
          />
        </div>

        <div className="filters__field">
          <label htmlFor="filter-hasta">Aplicó hasta</label>
          <input
            id="filter-hasta"
            type="date"
            value={value.fechaHasta}
            onChange={(e) => update('fechaHasta', e.target.value)}
          />
        </div>
      </div>

      <div className="filters__footer">
        <span className="filters__count">
          {activeCount === 0
            ? 'Sin filtros activos'
            : `${activeCount} filtro${activeCount === 1 ? '' : 's'} activo${activeCount === 1 ? '' : 's'}`}
        </span>
        <button
          type="button"
          className="btn-ghost"
          onClick={onReset}
          disabled={activeCount === 0}
          aria-label="Limpiar todos los filtros"
        >
          <X size={14} aria-hidden="true" />
          Limpiar
        </button>
      </div>
    </div>
  );
}
