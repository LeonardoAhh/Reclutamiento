import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { language } = useLanguage();
  const options: ReadonlyArray<{ value: CandidateGroup; label: string }> = language === 'en' ? [
    { value: 'todos', label: 'All' }, { value: 'activos', label: 'Active' },
    { value: 'contratados', label: 'Hired' }, { value: 'bajas', label: 'Departures' },
  ] : GROUP_OPTIONS;
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <CustomSelect
      className="candidate-filter-select"
      triggerAppearance="control"
      value={value}
      onChange={(nextValue) => {
        const selected = options.find((option) => option.value === nextValue);
        if (selected) onChange(selected.value);
      }}
      options={options}
      showPlaceholderOption={false}
      aria-label={`${language === 'en' ? 'Candidate filters' : 'Filtros de candidatos'}: ${selectedLabel}`}
      customTrigger={
        <span className="candidate-filter-select__content">
          <SlidersHorizontal className="candidate-filter-select__icon" size="var(--icon-size-sm)" aria-hidden="true" />
          <span>{language === 'en' ? 'Filters' : 'Filtros'}</span>
          <ChevronDown className="candidate-filter-select__chevron" size="var(--icon-size-sm)" aria-hidden="true" />
        </span>
      }
    />
  );
}
