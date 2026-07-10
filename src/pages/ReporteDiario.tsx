import { MotionConfig } from 'framer-motion';
import ReporteDiarioContent from '@/components/reporte-diario';
import '@/components/reporte-diario/ReporteDiario.css';

export function ReporteDiario() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="reporte-page container">
        <ReporteDiarioContent />
      </div>
    </MotionConfig>
  );
}
