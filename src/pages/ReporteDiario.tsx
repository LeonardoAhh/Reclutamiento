import { MotionConfig } from 'framer-motion';
import ReporteDiarioContent from '@/components/reporte-diario';
import '@/components/reporte-diario/ReporteDiario.css';

export function ReporteDiario() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="reporte-page container" aria-labelledby="reporte-page-title">
        <ReporteDiarioContent />
      </main>
    </MotionConfig>
  );
}
