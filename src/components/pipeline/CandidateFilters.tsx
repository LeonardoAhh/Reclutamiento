import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import './CandidateFilters.css';

export type CandidateGroup = 'todos' | 'activos' | 'contratados' | 'bajas';

const GROUP_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'contratados', label: 'Contratados' },
  { value: 'bajas', label: 'Bajas' },
] as const;

interface CandidateFiltersProps {
  value: CandidateGroup;
  onChange: (value: CandidateGroup) => void;
}

export function CandidateFilters({ value, onChange }: CandidateFiltersProps) {
  const selectedLabel = GROUP_OPTIONS.find((option) => option.value === value)?.label;

  return (
    <CustomSelect
      className="candidate-filter-select"
      triggerAppearance="control"
      value={value}
      onChange={(nextValue) => {
        const selected = GROUP_OPTIONS.find((option) => option.value === nextValue);
        if (selected) onChange(selected.value);
      }}
      options={GROUP_OPTIONS}
      showPlaceholderOption={false}
      aria-label={`Filtros de candidatos: ${selectedLabel}`}
      customTrigger={
        <span className="candidate-filter-select__content">
          <SlidersHorizontal className="candidate-filter-select__icon" size="var(--icon-size-sm)" aria-hidden="true" />
          <span>Filtros</span>
          <ChevronDown className="candidate-filter-select__chevron" size="var(--icon-size-sm)" aria-hidden="true" />
        </span>
      }
    />
  );
}
