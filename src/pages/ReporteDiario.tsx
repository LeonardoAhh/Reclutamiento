import ReporteDiarioContent from '@/components/reporte-diario';
import '@/components/reporte-diario/ReporteDiario.css';

export function ReporteDiario() {
  return (
    <div className="reporte-page container animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none">
      <ReporteDiarioContent />
    </div>
  );
}
