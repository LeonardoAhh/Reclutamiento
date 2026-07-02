import { useMemo } from 'react';
import { X } from 'lucide-react';
import { usePositions } from '@/lib/positions';
import {
  VACANCY_STATUSES,
  VACANCY_STATUS_LABEL,
  VACANCY_PRIORITIES,
  VACANCY_PRIORITY_LABEL,
} from '@/lib/types';
import type { VacancyRequest, VacancyStatus, VacancyPriority } from '@/lib/types';
import { CustomSelect } from '@/components/ui/CustomSelect';
import '@/components/pipeline/CandidateFilters.css';

export interface VacancyFilterState {
  area: string;
  puesto: string;
  status: VacancyStatus | '';
  prioridad: VacancyPriority | '';
  reclutador: string;
  fechaDesde: string;
  fechaHasta: string;
}

export const EMPTY_VACANCY_FILTERS: VacancyFilterState = {
  area: '',
  puesto: '',
  status: '',
  prioridad: '',
  reclutador: '',
  fechaDesde: '',
  fechaHasta: '',
};

interface VacancyFiltersProps {
  vacancies: VacancyRequest[];
  value: VacancyFilterState;
  onChange: (next: VacancyFilterState) => void;
  onReset: () => void;
}

function unique(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (v && v.trim()) set.add(v.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

export function VacancyFilters({
  vacancies,
  value,
  onChange,
  onReset,
}: VacancyFiltersProps) {
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
    () => unique(vacancies.map((v) => v.reclutador_asignado)),
    [vacancies]
  );

  function update<K extends keyof VacancyFilterState>(
    key: K,
    val: VacancyFilterState[K]
  ) {
    onChange({ ...value, [key]: val });
  }

  const activeCount = (Object.keys(value) as Array<keyof VacancyFilterState>).filter(
    (k) => value[k] !== ''
  ).length;

  return (
    <div className="filters" role="region" aria-label="Filtros de vacantes">
      <div className="filters__grid">
        <div className="filters__field">
          <label htmlFor="vfilter-area">Área</label>
          <CustomSelect
            id="vfilter-area"
            value={value.area}
            onChange={(val) => onChange({ ...value, area: val, puesto: '' })}
            options={areas.map((a) => ({ value: a, label: a }))}
            placeholder="Todas"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-puesto">Puesto</label>
          <CustomSelect
            id="vfilter-puesto"
            value={value.puesto}
            onChange={(val) => update('puesto', val)}
            options={puestos.map((p) => ({ value: p, label: p }))}
            placeholder="Todos"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-status">Status</label>
          <CustomSelect
            id="vfilter-status"
            value={value.status}
            onChange={(val) => update('status', (val as VacancyStatus) || '')}
            options={VACANCY_STATUSES.map((s) => ({ value: s, label: VACANCY_STATUS_LABEL[s] }))}
            placeholder="Todos"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-prioridad">Prioridad</label>
          <CustomSelect
            id="vfilter-prioridad"
            value={value.prioridad}
            onChange={(val) => update('prioridad', (val as VacancyPriority) || '')}
            options={VACANCY_PRIORITIES.map((p) => ({ value: p, label: VACANCY_PRIORITY_LABEL[p] }))}
            placeholder="Todas"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-reclutador">Reclutador</label>
          <CustomSelect
            id="vfilter-reclutador"
            value={value.reclutador}
            onChange={(val) => update('reclutador', val)}
            options={reclutadores.map((r) => ({ value: r, label: r }))}
            placeholder="Todos"
          />
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-desde">Apertura desde</label>
          <input
            id="vfilter-desde"
            type="date"
            value={value.fechaDesde}
            onChange={(e) => update('fechaDesde', e.target.value)}
          />
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-hasta">Apertura hasta</label>
          <input
            id="vfilter-hasta"
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
