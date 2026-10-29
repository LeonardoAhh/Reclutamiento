import type { Language } from '@/contexts/LanguageContext';
import { getCandidateGroupOptions, type CandidateGroup } from './CandidateFilters';
import './CandidateGroupTabs.css';

interface CandidateGroupTabsProps {
  value: CandidateGroup;
  onChange: (value: CandidateGroup) => void;
  language: Language;
  counts: Record<CandidateGroup, number>;
}

export function CandidateGroupTabs({ value, onChange, language, counts }: CandidateGroupTabsProps) {
  return (
    <div className="candidate-group-tabs" role="group" aria-label={language === 'en' ? 'Candidate filters' : 'Filtros de candidatos'}>
      {getCandidateGroupOptions(language).map(({ value: group, label }) => (
        <button
          key={group}
          type="button"
          className={`candidate-group-tabs__item${value === group ? ' candidate-group-tabs__item--active' : ''}`}
          aria-pressed={value === group}
          onClick={() => onChange(group)}
        >
          <span>{label}</span>
          <span className="candidate-group-tabs__count" aria-label={language === 'en' ? `${counts[group]} candidates` : `${counts[group]} candidatos`}>{counts[group]}</span>
        </button>
      ))}
    </div>
  );
}
