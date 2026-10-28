import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type HomePagerProps = {
  onPrevious?: () => void;
  onNext: () => void;
  previousDisabled: boolean;
  nextDisabled: boolean;
};

export function HomePager({ onPrevious, onNext, previousDisabled, nextDisabled }: HomePagerProps) {
  const { language } = useLanguage();
  const en = language === 'en';

  return (
    <nav className="home-page__pagination" aria-label={en ? 'Browse topics' : 'Recorrer temas'}>
      <button
        type="button"
        className="home-page__pagination-button"
        data-cuelume-navigate=""
        aria-label={en ? 'Previous topic' : 'Tema anterior'}
        disabled={previousDisabled}
        onClick={onPrevious}
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <button
        type="button"
        className="home-page__pagination-button"
        aria-label={en ? 'Next topic' : 'Tema siguiente'}
        disabled={nextDisabled}
        onClick={onNext}
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}
