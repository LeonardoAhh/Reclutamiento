import { useMemo } from 'react';
import { X } from 'lucide-react';
import { PLANTILLA_AUTORIZADA } from '@/lib/constants';
import {
  VACANCY_STATUSES,
  VACANCY_STATUS_LABEL,
  VACANCY_PRIORITIES,
  VACANCY_PRIORITY_LABEL,
} from '@/lib/types';
import type { VacancyRequest, VacancyStatus, VacancyPriority } from '@/lib/types';
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
          <select
            id="vfilter-area"
            value={value.area}
            onChange={(e) =>
              onChange({ ...value, area: e.target.value, puesto: '' })
            }
          >
            <option value="">Todas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-puesto">Puesto</label>
          <select
            id="vfilter-puesto"
            value={value.puesto}
            onChange={(e) => update('puesto', e.target.value)}
          >
            <option value="">Todos</option>
            {puestos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-status">Status</label>
          <select
            id="vfilter-status"
            value={value.status}
            onChange={(e) => update('status', (e.target.value as VacancyStatus) || '')}
          >
            <option value="">Todos</option>
            {VACANCY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VACANCY_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-prioridad">Prioridad</label>
          <select
            id="vfilter-prioridad"
            value={value.prioridad}
            onChange={(e) =>
              update('prioridad', (e.target.value as VacancyPriority) || '')
            }
          >
            <option value="">Todas</option>
            {VACANCY_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {VACANCY_PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="filters__field">
          <label htmlFor="vfilter-reclutador">Reclutador</label>
          <select
            id="vfilter-reclutador"
            value={value.reclutador}
            onChange={(e) => update('reclutador', e.target.value)}
          >
            <option value="">Todos</option>
            {reclutadores.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
