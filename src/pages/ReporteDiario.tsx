import { MotionConfig } from 'framer-motion';
import { useMatch } from 'react-router-dom';
import { REPORT_DAY_PATTERN } from '@/components/reporte-diario/navigation';
import ReporteDiarioContent from '@/components/reporte-diario';
import '@/components/reporte-diario/ReporteDiario.css';

export function ReporteDiario() {
  const isDayPage = Boolean(useMatch(REPORT_DAY_PATTERN));
  return (
    <MotionConfig reducedMotion="user">
      <main className={isDayPage ? "reporte-page reporte-page--day container" : "reporte-page container"} aria-labelledby="reporte-page-title">
        <ReporteDiarioContent />
      </main>
    </MotionConfig>
  );
}
