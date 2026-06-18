import { useMemo } from 'react';
import { X } from 'lucide-react';
import { usePositions } from '@/lib/positions';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABEL } from '@/lib/types';
import type { Candidate, CandidateStatus } from '@/lib/types';
import { CustomSelect } from '@/components/ui/CustomSelect';
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
  const { positions } = usePositions();
  const areas = useMemo(
    () =>
      Array.from(new Set(positions.map((p) => p.area))).sort((a, b) =>
        a.localeCompare(b, 'es')
      ),
    [positions]
  );

  const puestos = useMemo(() => {
    const base = value.area
      ? positions.filter((p) => p.area === value.area)
      : positions;
    return Array.from(new Set(base.map((p) => p.puesto))).sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }, [positions, value.area]);

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
          <CustomSelect
            id="filter-area"
            value={value.area}
            onChange={(val) => {
              onChange({ ...value, area: val, puesto: '' });
            }}
            options={areas.map((a) => ({ value: a, label: a }))}
            placeholder="Todas"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="filter-puesto">Puesto</label>
          <CustomSelect
            id="filter-puesto"
            value={value.puesto}
            onChange={(val) => update('puesto', val)}
            options={puestos.map((p) => ({ value: p, label: p }))}
            placeholder="Todos"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="filter-estado">Estado</label>
          <CustomSelect
            id="filter-estado"
            value={value.estado}
            onChange={(val) => update('estado', (val as CandidateStatus) || '')}
            options={CANDIDATE_STATUSES.map((s) => ({ value: s, label: CANDIDATE_STATUS_LABEL[s] }))}
            placeholder="Todos"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="filter-reclutador">Reclutador</label>
          <CustomSelect
            id="filter-reclutador"
            value={value.reclutador}
            onChange={(val) => update('reclutador', val)}
            options={reclutadores.map((r) => ({ value: r, label: r }))}
            placeholder="Todos"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="filter-source">Fuente</label>
          <CustomSelect
            id="filter-source"
            value={value.source}
            onChange={(val) => update('source', val)}
            options={sources.map((s) => ({ value: s, label: s }))}
            placeholder="Todas"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="filter-desde">Entrevista desde</label>
          <input
            id="filter-desde"
            type="date"
            value={value.fechaDesde}
            onChange={(e) => update('fechaDesde', e.target.value)}
          />
        </div>

        <div className="filters__field">
          <label htmlFor="filter-hasta">Entrevista hasta</label>
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
