import { Filter, X } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import './BajasFilters.css';

interface BajasFiltersProps {
  year: number;
  yearOptions: number[];
  onYearChange: (year: number) => void;
  areaFilter: string;
  areas: string[];
  onAreaChange: (area: string) => void;
  puestoFilter: string;
  puestosForArea: string[];
  onPuestoChange: (puesto: string) => void;
}

export function BajasFilters({
  year,
  yearOptions,
  onYearChange,
  areaFilter,
  areas,
  onAreaChange,
  puestoFilter,
  puestosForArea,
  onPuestoChange,
}: BajasFiltersProps) {
  const hasActiveFilters = Boolean(areaFilter || puestoFilter);

  const handleResetFilters = () => {
    onAreaChange('');
    onPuestoChange('');
  };

  return (
    <section className="bajas-filters" aria-label="Filtros de bajas">
      <div className="bajas-filters__group">
        <label className="bajas-filters__label" htmlFor="filter-year">
          Año
        </label>
        <CustomSelect
          id="filter-year"
          value={String(year)}
          onChange={(val) => onYearChange(Number(val))}
          options={yearOptions.map((y) => ({ value: String(y), label: String(y) }))}
          placeholder="Año"
        />
      </div>

      <div className="bajas-filters__group">
        <label className="bajas-filters__label" htmlFor="filter-area">
          <Filter size={14} aria-hidden="true" /> Área
        </label>
        <CustomSelect
          id="filter-area"
          value={areaFilter}
          onChange={(val) => {
            onAreaChange(val);
            onPuestoChange('');
          }}
          options={areas.map((a) => ({ value: a, label: a }))}
          placeholder="Todas las áreas"
        />
      </div>

      <div className="bajas-filters__group">
        <label className="bajas-filters__label" htmlFor="filter-puesto">
          Puesto
        </label>
        <CustomSelect
          id="filter-puesto"
          value={puestoFilter}
          onChange={onPuestoChange}
          options={puestosForArea.map((p) => ({ value: p, label: p }))}
          placeholder="Todos los puestos"
          disabled={puestosForArea.length === 0}
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          className="bajas-filters__reset"
          onClick={handleResetFilters}
          aria-label="Limpiar filtros de área y puesto"
        >
          <X size={14} aria-hidden="true" />
          <span>Limpiar filtros</span>
        </button>
      )}
    </section>
  );
}
