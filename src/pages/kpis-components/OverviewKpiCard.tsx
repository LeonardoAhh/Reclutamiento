import { MetricTile } from '@/components/ui/MetricTile';
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

/**
 * Tarjeta de la semana: la misma ficha que las pestañas, con marco propio y
 * sin marca. La cifra y su etiqueta bastan; un icono por tarjeta solo añadiría
 * ruido a una fila que ya se lee de un vistazo.
 */
export function OverviewKpiCard({ label, value, cornerNote, note, onClick }: Props) {
  const { language } = useLanguage();

  return (
    <MetricTile
      className="overview-kpi"
      label={label}
      value={value}
      cornerNote={cornerNote}
      note={note}
      description={workforceText(language, 'Ver detalle')}
      onClick={onClick}
    />
  );
}
