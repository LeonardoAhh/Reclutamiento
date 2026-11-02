import { useLanguage } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
import './OverviewKpiCard.css';

interface Props {
  label: string;
  value: number;
  cornerNote?: string;
  note?: string;
  onClick: () => void;
}

export function OverviewKpiCard({ label, value, cornerNote, note, onClick }: Props) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);

  return (
    <button
      data-cuelume-tap=""
      type="button"
      className={cornerNote ? 'overview-kpi overview-kpi--dated' : 'overview-kpi'}
      onClick={onClick}
    >
      <span className="overview-kpi__header">
        <span className="overview-kpi__label">{label}</span>
      </span>
      <span className="overview-kpi__value">{value}</span>
      {cornerNote && <span className="overview-kpi__corner-note">{cornerNote}</span>}
      {note && <span className="overview-kpi__footer">{note}</span>}
      <span className="sr-only">{t('Ver detalle')}</span>
    </button>
  );
}
