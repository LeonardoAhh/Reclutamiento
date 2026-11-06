import { Building2, ChevronDown, Clock3, Eraser, UserRoundCheck, UserRoundMinus, UsersRound } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AnalysisFilterPanel } from './AnalysisFilterPanel';
import { ALL_FILTER_VALUE, type SearchStatusFilter, type uniqueFilterValues } from '../analisis-helpers';
import type { getConfiguracionCopy } from '../configuracion-translations';

type AnalysisCopy = ReturnType<typeof getConfiguracionCopy>['analysis'];
type FilterOption = ReturnType<typeof uniqueFilterValues>[number];

interface AnalysisResultsFiltersProps {
  statusFilter: SearchStatusFilter;
  departmentFilter: string;
  shiftFilter: string;
  departmentOptions: FilterOption[];
  shiftOptions: FilterOption[];
  selectedDepartmentLabel: string;
  selectedShiftLabel: string;
  hasActiveFilters: boolean;
  copy: AnalysisCopy;
  onStatusFilterChange: (value: SearchStatusFilter) => void;
  onDepartmentFilterChange: (value: string) => void;
  onShiftFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function AnalysisResultsFilters({
  statusFilter,
  departmentFilter,
  shiftFilter,
  departmentOptions,
  shiftOptions,
  selectedDepartmentLabel,
  selectedShiftLabel,
  hasActiveFilters,
  copy,
  onStatusFilterChange,
  onDepartmentFilterChange,
  onShiftFilterChange,
  onClearFilters,
}: AnalysisResultsFiltersProps) {
  return (
    <AnalysisFilterPanel
      count={
        Number(statusFilter !== ALL_FILTER_VALUE) +
        Number(departmentFilter !== ALL_FILTER_VALUE) +
        Number(shiftFilter !== ALL_FILTER_VALUE)
      }
      label={copy.filters}
      doneLabel={copy.done}
    >
      <div className="config-results-controls__filters">
        <fieldset className="config-filter-group">
          <legend className="config-filter-label type-caption-up text-muted">{copy.status}</legend>
          <div className="config-segmented-control">
            {(
              [
                [ALL_FILTER_VALUE, copy.all, UsersRound],
                ['active', copy.active, UserRoundCheck],
                ['inactive', copy.leavers, UserRoundMinus],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                className={`config-segmented-control__button${statusFilter === value ? ' is-active' : ''}`}
                data-cuelume-select=""
                onClick={() => onStatusFilterChange(value)}
                aria-pressed={statusFilter === value}
              >
                <Icon size="var(--icon-size-sm)" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="config-filter-field analisis-select-filter analisis-select-filter--department">
          <span className="config-filter-label type-caption-up text-muted">{copy.department}</span>
          <CustomSelect
            value={departmentFilter}
            aria-label={`${copy.department}: ${selectedDepartmentLabel}`}
            title={`${copy.department}: ${selectedDepartmentLabel}`}
            onChange={onDepartmentFilterChange}
            options={[{ value: ALL_FILTER_VALUE, label: copy.all }, ...departmentOptions]}
            showPlaceholderOption={false}
            className={departmentFilter !== ALL_FILTER_VALUE ? 'is-active' : undefined}
            triggerAppearance="plain"
            customTrigger={
              <span className="analisis-select-filter__trigger">
                <Building2 size="var(--icon-size-sm)" aria-hidden="true" />
                <span className="analisis-select-filter__value">{selectedDepartmentLabel}</span>
                <ChevronDown size="var(--icon-size-sm)" aria-hidden="true" />
              </span>
            }
          />
        </div>

        <div className="config-filter-field analisis-select-filter analisis-select-filter--shift">
          <span className="config-filter-label type-caption-up text-muted">{copy.shift}</span>
          <CustomSelect
            value={shiftFilter}
            aria-label={`${copy.shift}: ${selectedShiftLabel}`}
            title={`${copy.shift}: ${selectedShiftLabel}`}
            onChange={onShiftFilterChange}
            options={[{ value: ALL_FILTER_VALUE, label: copy.all }, ...shiftOptions]}
            showPlaceholderOption={false}
            className={shiftFilter !== ALL_FILTER_VALUE ? 'is-active' : undefined}
            triggerAppearance="plain"
            customTrigger={
              <span className="analisis-select-filter__trigger">
                <Clock3 size="var(--icon-size-sm)" aria-hidden="true" />
                <span className="analisis-select-filter__value">{selectedShiftLabel}</span>
                <ChevronDown size="var(--icon-size-sm)" aria-hidden="true" />
              </span>
            }
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn-ghost config-filter-reset"
            data-cuelume-select=""
            aria-label={copy.clear}
            title={copy.clear}
            onClick={onClearFilters}
          >
            <Eraser size="var(--icon-size-sm)" aria-hidden="true" />
          </button>
        )}
      </div>
    </AnalysisFilterPanel>
  );
}
