import { Link } from 'react-router-dom';
import { ChartNoAxesCombined } from 'lucide-react';
import { useReportLocale } from './useReportLocale';
import { REPORT_COMPARISON_PATH } from './navigation';

export default function ReporteComparison({ triggerVariant = 'icon' }: { triggerVariant?: 'icon' | 'labeled' }) {
  const { copy } = useReportLocale();
  return (
    <Link
      to={REPORT_COMPARISON_PATH}
      className={'reporte-saved__trigger reporte-saved__trigger--' + triggerVariant}
      aria-label={copy('Comparativa mensual', 'Monthly comparison')}
      title={copy('Comparativa mensual', 'Monthly comparison')}
      data-testid="open-comparison-btn"
    >
      <ChartNoAxesCombined size="var(--icon-size-sm)" aria-hidden="true" />
      {triggerVariant === 'labeled' && <span className="reporte-saved__trigger-label">{copy('Comparar', 'Compare')}</span>}
    </Link>
  );
}
